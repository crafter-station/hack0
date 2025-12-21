import { metadata, schedules } from "@trigger.dev/sdk/v3";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, eventHosts } from "@/lib/db/schema";
import { resolveOrganization, upsertHostMappings } from "@/lib/luma/host-resolver";
import type { LumaEventHost } from "@/lib/luma/types";

interface BackfillResult {
	eventsProcessed: number;
	eventsResolved: number;
	eventsSkipped: number;
	errors: string[];
}

export const lumaBackfillOrgsTask = schedules.task({
	id: "luma-backfill-orgs",
	cron: "0 3 * * 0",
	run: async (): Promise<BackfillResult> => {
		metadata.set("step", "fetching_pending_events");

		const pendingEvents = await db.query.events.findMany({
			where: isNull(events.organizationId),
			with: {
				lumaHosts: true,
			},
			limit: 500,
		});

		metadata.set("eventsFound", pendingEvents.length);
		metadata.set("step", "processing_events");

		const result: BackfillResult = {
			eventsProcessed: 0,
			eventsResolved: 0,
			eventsSkipped: 0,
			errors: [],
		};

		for (let i = 0; i < pendingEvents.length; i++) {
			const event = pendingEvents[i];
			metadata.set("progress", `${i + 1}/${pendingEvents.length}`);
			metadata.set("currentEvent", event.name);

			result.eventsProcessed++;

			try {
				const hosts = event.lumaHosts;
				if (!hosts || hosts.length === 0) {
					result.eventsSkipped++;
					continue;
				}

				const lumaHostsData: LumaEventHost[] = hosts.map((h) => ({
					api_id: h.lumaHostApiId,
					name: h.name || "",
					email: h.email || undefined,
					avatar_url: h.avatarUrl || undefined,
				}));

				const resolution = await resolveOrganization(lumaHostsData);
				await upsertHostMappings(lumaHostsData);

				if (resolution.organizationId && resolution.isVerified) {
					await db
						.update(events)
						.set({ organizationId: resolution.organizationId })
						.where(eq(events.id, event.id));

					if (resolution.primaryHost) {
						await db
							.update(eventHosts)
							.set({ isPrimary: true })
							.where(
								eq(eventHosts.lumaHostApiId, resolution.primaryHost.api_id),
							);
					}

					result.eventsResolved++;
				} else {
					result.eventsSkipped++;
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				result.errors.push(`${event.name}: ${errorMessage}`);
			}
		}

		metadata.set("step", "completed");
		metadata.set("eventsResolved", result.eventsResolved);
		metadata.set("eventsSkipped", result.eventsSkipped);
		metadata.set("errorCount", result.errors.length);

		return result;
	},
});
