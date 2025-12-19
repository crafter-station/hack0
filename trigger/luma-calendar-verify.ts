import { metadata, schedules, task } from "@trigger.dev/sdk/v3";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { lumaCalendars } from "@/lib/db/schema";
import { getGlobalLumaClient, LumaApiError } from "@/lib/luma";
import { lumaCalendarSyncTask } from "./luma-calendar-sync";

const MAX_VERIFICATION_ATTEMPTS = 10;
const WEBHOOK_EVENT_TYPES = [
	"event.created",
	"event.updated",
	"calendar.event.added",
] as const;

interface VerifyCalendarResult {
	success: boolean;
	status: "verified" | "pending" | "failed";
	calendarApiId?: string;
	webhookId?: string;
	error?: string;
	eventsFound?: number;
}

export const lumaVerifyCalendarTask = task({
	id: "luma-verify-calendar",
	maxDuration: 60,
	run: async (payload: {
		calendarId: string;
	}): Promise<VerifyCalendarResult> => {
		const { calendarId } = payload;

		metadata.set("calendarId", calendarId);
		metadata.set("step", "fetching_calendar");

		const calendar = await db.query.lumaCalendars.findFirst({
			where: eq(lumaCalendars.id, calendarId),
		});

		if (!calendar) {
			throw new Error(`Calendar not found: ${calendarId}`);
		}

		metadata.set("calendarSlug", calendar.lumaCalendarSlug);
		metadata.set("attempts", calendar.verificationAttempts ?? 0);

		const client = getGlobalLumaClient();

		metadata.set("step", "verifying_access");

		try {
			const result = await client.listCalendarEvents();

			metadata.set("step", "access_verified");
			metadata.set("eventsFound", result.events.length);

			let calendarApiId: string | undefined;
			if (result.events.length > 0) {
				calendarApiId = result.events[0].calendar_api_id;
			}

			let webhookId: string | undefined;

			if (process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL) {
				metadata.set("step", "registering_webhook");

				try {
					const baseUrl =
						process.env.NEXT_PUBLIC_APP_URL ||
						`https://${process.env.VERCEL_URL}`;
					const webhookUrl = `${baseUrl}/api/webhooks/luma`;

					const webhook = await client.createWebhook({
						url: webhookUrl,
						event_types: [...WEBHOOK_EVENT_TYPES],
					});

					webhookId = webhook.api_id;
					metadata.set("webhookId", webhookId);
				} catch (webhookError) {
					console.error("Failed to register webhook:", webhookError);
				}
			}

			await db
				.update(lumaCalendars)
				.set({
					verificationStatus: "verified",
					lumaCalendarApiId: calendarApiId,
					webhookId,
					lastVerificationAttempt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(lumaCalendars.id, calendarId));

			metadata.set("step", "triggering_sync");

			await lumaCalendarSyncTask.trigger({
				calendarId,
				forceFullSync: true,
			});

			metadata.set("step", "completed");

			return {
				success: true,
				status: "verified",
				calendarApiId,
				webhookId,
				eventsFound: result.events.length,
			};
		} catch (error) {
			const isAccessDenied =
				error instanceof LumaApiError &&
				(error.status === 401 || error.status === 403);

			const newAttempts = (calendar.verificationAttempts ?? 0) + 1;
			const shouldFail = newAttempts >= MAX_VERIFICATION_ATTEMPTS;

			const newStatus = shouldFail ? "failed" : "pending";

			await db
				.update(lumaCalendars)
				.set({
					verificationStatus: newStatus,
					verificationAttempts: newAttempts,
					lastVerificationAttempt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(lumaCalendars.id, calendarId));

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			metadata.set("step", newStatus);
			metadata.set("error", errorMessage);
			metadata.set("attempts", newAttempts);

			if (isAccessDenied) {
				return {
					success: false,
					status: newStatus as "pending" | "failed",
					error: `Access denied. Please ensure railly@crafterstation.com has been added as an admin to your Luma calendar. (Attempt ${newAttempts}/${MAX_VERIFICATION_ATTEMPTS})`,
				};
			}

			return {
				success: false,
				status: newStatus as "pending" | "failed",
				error: errorMessage,
			};
		}
	},
});

export const lumaRetryPendingVerificationsTask = schedules.task({
	id: "luma-retry-pending-verifications",
	cron: "*/30 * * * *",
	run: async () => {
		metadata.set("step", "fetching_pending_calendars");

		const pendingCalendars = await db.query.lumaCalendars.findMany({
			where: and(
				eq(lumaCalendars.verificationStatus, "pending"),
				lt(lumaCalendars.verificationAttempts, MAX_VERIFICATION_ATTEMPTS),
			),
		});

		metadata.set("pendingCount", pendingCalendars.length);

		if (pendingCalendars.length === 0) {
			metadata.set("step", "no_pending_calendars");
			return { verified: 0, stillPending: 0, failed: 0 };
		}

		let verified = 0;
		let stillPending = 0;
		let failed = 0;

		for (const calendar of pendingCalendars) {
			metadata.set("currentCalendar", calendar.lumaCalendarSlug);

			try {
				const result = await lumaVerifyCalendarTask.triggerAndWait({
					calendarId: calendar.id,
				});

				if (result.ok) {
					if (result.output.status === "verified") verified++;
					else if (result.output.status === "pending") stillPending++;
					else if (result.output.status === "failed") failed++;
				}
			} catch (error) {
				console.error(`Failed to verify calendar ${calendar.id}:`, error);
				stillPending++;
			}
		}

		metadata.set("step", "completed");
		metadata.set("verified", verified);
		metadata.set("stillPending", stillPending);
		metadata.set("failed", failed);

		return { verified, stillPending, failed };
	},
});

export const lumaManualVerifyTask = task({
	id: "luma-manual-verify",
	maxDuration: 60,
	run: async (payload: { calendarId: string }) => {
		await db
			.update(lumaCalendars)
			.set({
				verificationAttempts: 0,
				verificationStatus: "pending",
			})
			.where(eq(lumaCalendars.id, payload.calendarId));

		return lumaVerifyCalendarTask.triggerAndWait({
			calendarId: payload.calendarId,
		});
	},
});
