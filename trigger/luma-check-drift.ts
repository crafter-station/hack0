import { metadata, schedules } from "@trigger.dev/sdk/v3";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, lumaEventMappings } from "@/lib/db/schema";
import { getGlobalLumaClient } from "@/lib/luma";
import { computeContentHash } from "@/lib/luma/host-resolver";
import { mergeEventUpdates } from "@/lib/luma/transform";

interface DriftCheckResult {
	eventsChecked: number;
	eventsSynced: number;
	eventsDrifted: number;
	eventsDeleted: number;
	errors: string[];
}

export const lumaCheckDriftTask = schedules.task({
	id: "luma-check-drift",
	cron: "0 4 * * 0",
	run: async (): Promise<DriftCheckResult> => {
		metadata.set("step", "fetching_referenced_events");

		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const referencedEvents = await db.query.events.findMany({
			where: and(
				eq(events.ownership, "referenced"),
				lt(events.lastSourceCheckAt, oneWeekAgo),
			),
			limit: 100,
		});

		metadata.set("eventsFound", referencedEvents.length);
		metadata.set("step", "checking_events");

		const result: DriftCheckResult = {
			eventsChecked: 0,
			eventsSynced: 0,
			eventsDrifted: 0,
			eventsDeleted: 0,
			errors: [],
		};

		const client = getGlobalLumaClient();

		for (let i = 0; i < referencedEvents.length; i++) {
			const event = referencedEvents[i];
			metadata.set("progress", `${i + 1}/${referencedEvents.length}`);
			metadata.set("currentEvent", event.name);

			result.eventsChecked++;

			try {
				const mapping = await db.query.lumaEventMappings.findFirst({
					where: eq(lumaEventMappings.eventId, event.id),
				});

				if (!mapping) {
					result.errors.push(`${event.name}: No Luma mapping found`);
					continue;
				}

				let lumaEvent;
				try {
					lumaEvent = await client.getEvent(mapping.lumaEventId);
				} catch (fetchError) {
					if (
						fetchError instanceof Error &&
						fetchError.message.includes("404")
					) {
						await db
							.update(events)
							.set({
								syncStatus: "source_deleted",
								lastSourceCheckAt: new Date(),
							})
							.where(eq(events.id, event.id));

						result.eventsDeleted++;
						continue;
					}
					throw fetchError;
				}

				const newContentHash = computeContentHash({
					name: lumaEvent.name,
					description: lumaEvent.description_md || lumaEvent.description,
					startDate: lumaEvent.start_at ? new Date(lumaEvent.start_at) : null,
					endDate: lumaEvent.end_at ? new Date(lumaEvent.end_at) : null,
					venue: lumaEvent.location?.place_name,
				});

				if (newContentHash !== event.sourceContentHash) {
					const updates = mergeEventUpdates(event, lumaEvent);
					updates.sourceContentHash = newContentHash;
					updates.lastSourceCheckAt = new Date();
					updates.syncStatus = "drifted";

					await db.update(events).set(updates).where(eq(events.id, event.id));

					await db
						.update(lumaEventMappings)
						.set({
							lastSyncedAt: new Date(),
							lumaUpdatedAt: new Date(lumaEvent.updated_at),
						})
						.where(eq(lumaEventMappings.id, mapping.id));

					result.eventsDrifted++;
				} else {
					await db
						.update(events)
						.set({
							syncStatus: "synced",
							lastSourceCheckAt: new Date(),
						})
						.where(eq(events.id, event.id));

					result.eventsSynced++;
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				result.errors.push(`${event.name}: ${errorMessage}`);
			}
		}

		metadata.set("step", "completed");
		metadata.set("eventsSynced", result.eventsSynced);
		metadata.set("eventsDrifted", result.eventsDrifted);
		metadata.set("eventsDeleted", result.eventsDeleted);
		metadata.set("errorCount", result.errors.length);

		return result;
	},
});
