import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	events,
	notificationLogs,
	organizations,
	subscriptions,
} from "@/lib/db/schema";
import { getFormatLabel } from "@/lib/event-utils";
import { EMAIL_FROM, resend } from "./resend";
import { NewEventEmail } from "./templates/new-event";

interface NotifySubscribersOptions {
	eventId: string;
}

export async function notifySubscribersOfNewEvent({
	eventId,
}: NotifySubscribersOptions) {
	try {
		// Get the event with organization
		const results = await db
			.select({
				event: events,
				organization: organizations,
			})
			.from(events)
			.leftJoin(organizations, eq(events.organizationId, organizations.id))
			.where(eq(events.id, eventId))
			.limit(1);

		const event = results.map((r) => ({
			...r.event,
			organization: r.organization,
		}));

		if (event.length === 0) {
			console.error("Event not found:", eventId);
			return { success: false, error: "Event not found" };
		}

		const eventData = event[0];

		// Get all active, verified subscribers
		const activeSubscribers = await db
			.select()
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.isVerified, true),
					eq(subscriptions.isActive, true),
				),
			);

		if (activeSubscribers.length === 0) {
			console.log("No active subscribers to notify");
			return { success: true, sent: 0 };
		}

		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hack0.dev";
		let sent = 0;
		let failed = 0;

		// Send emails to each subscriber
		for (const subscriber of activeSubscribers) {
			try {
				const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`;
				const eventUrl = `${appUrl}/${eventData.slug}`;

				// Format date if available
				let eventDate: string | undefined;
				if (eventData.startDate) {
					const start = new Date(eventData.startDate);
					eventDate = start.toLocaleDateString("es-PE", {
						day: "numeric",
						month: "long",
						year: "numeric",
					});
					if (eventData.endDate) {
						const end = new Date(eventData.endDate);
						eventDate += ` - ${end.toLocaleDateString("es-PE", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}`;
					}
				}

				const result = await resend.emails.send({
					from: EMAIL_FROM,
					to: subscriber.email,
					subject: `Nuevo evento: ${eventData.name}`,
					react: NewEventEmail({
						eventName: eventData.name,
						eventDescription: eventData.description || undefined,
						eventDate,
						eventFormat: getFormatLabel(
							eventData.format || "virtual",
							eventData.department,
						),
						eventUrl,
						organizerName:
							eventData.organization?.displayName ||
							eventData.organization?.name ||
							undefined,
						prizePool: eventData.prizePool || undefined,
						unsubscribeUrl,
					}),
				});

				// Log the notification
				await db.insert(notificationLogs).values({
					subscriptionId: subscriber.id,
					eventId: eventData.id,
					subject: `Nuevo evento: ${eventData.name}`,
					status: "sent",
					resendId: result.data?.id,
				});

				// Update last email sent timestamp
				await db
					.update(subscriptions)
					.set({ lastEmailSentAt: new Date() })
					.where(eq(subscriptions.id, subscriber.id));

				sent++;
			} catch (error) {
				console.error(`Failed to send email to ${subscriber.email}:`, error);

				// Log the failed notification
				await db.insert(notificationLogs).values({
					subscriptionId: subscriber.id,
					eventId: eventData.id,
					subject: `Nuevo evento: ${eventData.name}`,
					status: "failed",
				});

				failed++;
			}
		}

		console.log(`Notification complete: ${sent} sent, ${failed} failed`);
		return { success: true, sent, failed };
	} catch (error) {
		console.error("Error notifying subscribers:", error);
		return { success: false, error: "Failed to notify subscribers" };
	}
}
