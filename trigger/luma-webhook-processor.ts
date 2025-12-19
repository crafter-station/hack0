import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { events, lumaCalendars, lumaEventMappings } from "@/lib/db/schema";
import {
	mergeEventUpdates,
	shouldUpdateEvent,
	transformLumaEvent,
} from "@/lib/luma/transform";
import type { LumaEvent, LumaWebhookEventType } from "@/lib/luma/types";
import { createUniqueSlug } from "@/lib/slug-utils";

interface WebhookPayload {
	event_type: LumaWebhookEventType;
	data: {
		event?: LumaEvent;
		calendar_api_id?: string;
	};
}

async function uploadEventImage(imageUrl: string): Promise<string | null> {
	if (!imageUrl) return null;

	try {
		const utapi = new UTApi();
		const uploadResult = await utapi.uploadFilesFromUrl(imageUrl);
		return uploadResult.data?.url || null;
	} catch (error) {
		console.error("Failed to upload image:", error);
		return null;
	}
}

async function findCalendarByApiId(calendarApiId: string) {
	return db.query.lumaCalendars.findFirst({
		where: eq(lumaCalendars.lumaCalendarApiId, calendarApiId),
	});
}

async function processEventCreatedOrUpdated(lumaEvent: LumaEvent) {
	if (lumaEvent.status !== "published" || lumaEvent.visibility !== "public") {
		return { skipped: true, reason: "Event not published or not public" };
	}

	const calendar = await findCalendarByApiId(lumaEvent.calendar_api_id);
	if (!calendar) {
		return { skipped: true, reason: "Calendar not found for this event" };
	}

	const existingMapping = await db.query.lumaEventMappings.findFirst({
		where: eq(lumaEventMappings.lumaEventId, lumaEvent.api_id),
	});

	if (existingMapping) {
		if (
			!shouldUpdateEvent(existingMapping.lumaUpdatedAt!, lumaEvent.updated_at)
		) {
			return { skipped: true, reason: "Event already up to date" };
		}

		const existingEvent = await db.query.events.findFirst({
			where: eq(events.id, existingMapping.eventId),
		});

		if (!existingEvent) {
			return { skipped: true, reason: "Mapped event not found in database" };
		}

		const updates = mergeEventUpdates(existingEvent, lumaEvent);

		if (Object.keys(updates).length > 1) {
			await db
				.update(events)
				.set(updates)
				.where(eq(events.id, existingMapping.eventId));

			await db
				.update(lumaEventMappings)
				.set({
					lastSyncedAt: new Date(),
					lumaUpdatedAt: new Date(lumaEvent.updated_at),
				})
				.where(eq(lumaEventMappings.id, existingMapping.id));

			return { updated: true, eventId: existingMapping.eventId };
		}

		return { skipped: true, reason: "No changes detected" };
	}

	const eventData = transformLumaEvent(lumaEvent, {
		organizationId: calendar.organizationId,
	});

	if (lumaEvent.cover_url) {
		const uploadedUrl = await uploadEventImage(lumaEvent.cover_url);
		if (uploadedUrl) {
			eventData.eventImageUrl = uploadedUrl;
		}
	}

	const slug = await createUniqueSlug(eventData.name);
	eventData.slug = slug;

	const [newEvent] = await db.insert(events).values(eventData).returning();

	await db.insert(lumaEventMappings).values({
		lumaEventId: lumaEvent.api_id,
		eventId: newEvent.id,
		lumaCalendarId: calendar.id,
		lastSyncedAt: new Date(),
		lumaUpdatedAt: new Date(lumaEvent.updated_at),
	});

	return { created: true, eventId: newEvent.id };
}

export const lumaWebhookProcessorTask = task({
	id: "luma-webhook-processor",
	maxDuration: 120,
	run: async (payload: WebhookPayload) => {
		const { event_type, data } = payload;

		metadata.set("eventType", event_type);

		switch (event_type) {
			case "event.created":
			case "event.updated":
			case "calendar.event.added": {
				if (!data.event) {
					metadata.set("error", "No event data in payload");
					return { success: false, error: "No event data" };
				}

				metadata.set("lumaEventId", data.event.api_id);
				metadata.set("eventName", data.event.name);
				metadata.set("calendarApiId", data.event.calendar_api_id);

				const result = await processEventCreatedOrUpdated(data.event);

				if ("skipped" in result) {
					metadata.set("result", "skipped");
					if (result.reason) {
						metadata.set("reason", result.reason);
					}
				} else if ("created" in result) {
					metadata.set("result", "created");
					metadata.set("eventId", result.eventId);
				} else if ("updated" in result) {
					metadata.set("result", "updated");
					metadata.set("eventId", result.eventId);
				}

				return { success: true, ...result };
			}

			case "guest.registered":
			case "guest.updated":
			case "ticket.registered":
			case "calendar.person.subscribed": {
				metadata.set("result", "ignored");
				return {
					success: true,
					ignored: true,
					reason: "Event type not relevant for event sync",
				};
			}

			default: {
				metadata.set("result", "unknown");
				return { success: false, error: `Unknown event type: ${event_type}` };
			}
		}
	},
});
