import Firecrawl from "@mendable/firecrawl-js";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { events, lumaEventMappings } from "@/lib/db/schema";
import { getGlobalLumaClient } from "@/lib/luma/client";
import type { LumaExtractedData } from "@/lib/scraper/luma-schema";
import {
	resolveOrganization,
	saveEventHosts,
	upsertHostMappings,
	computeContentHash,
} from "@/lib/luma/host-resolver";
import {
	mergeEventUpdates,
	shouldUpdateEvent,
	transformLumaEvent,
} from "@/lib/luma/transform";
import type { LumaEvent, LumaWebhookEventType } from "@/lib/luma/types";
import { createUniqueSlug } from "@/lib/slug-utils";

interface WebhookEventData {
	api_id: string;
	url: string;
	name: string;
	hosts: Array<{
		id: string;
		name: string;
		avatar_url?: string;
	}>;
	start_at: string;
	end_at?: string;
	timezone: string;
	cover_url?: string;
	platform: string;
	calendar: {
		id: string;
		url: string;
		name: string;
		slug?: string;
		is_personal: boolean;
		avatar_url?: string;
	};
}

interface WebhookPayload {
	event_type: LumaWebhookEventType;
	data: WebhookEventData;
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

async function processEventCreatedOrUpdated(lumaEvent: LumaEvent) {
	if (lumaEvent.status !== "published" || lumaEvent.visibility !== "public") {
		return { skipped: true, reason: "Event not published or not public" };
	}

	const hosts = lumaEvent.hosts || [];
	const hack0CalendarApiId = process.env.HACK0_LUMA_CALENDAR_API_ID;
	const isOwnedCalendar =
		!!hack0CalendarApiId &&
		lumaEvent.calendar_api_id === hack0CalendarApiId;

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
		updates.sourceContentHash = computeContentHash({
			name: lumaEvent.name,
			description: lumaEvent.description_md || lumaEvent.description,
			startDate: lumaEvent.start_at ? new Date(lumaEvent.start_at) : null,
			endDate: lumaEvent.end_at ? new Date(lumaEvent.end_at) : null,
			venue: lumaEvent.location?.place_name,
		});
		updates.lastSourceCheckAt = new Date();

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

			if (hosts.length > 0) {
				const resolution = await resolveOrganization(hosts);
				await saveEventHosts(
					existingMapping.eventId,
					hosts,
					resolution.primaryHost?.api_id,
				);
				await upsertHostMappings(hosts, resolution);
			}

			return { updated: true, eventId: existingMapping.eventId };
		}

		return { skipped: true, reason: "No changes detected" };
	}

	const resolution = await resolveOrganization(hosts);
	const organizationId = resolution.organizationId;

	const eventData = transformLumaEvent(lumaEvent, { organizationId });

	eventData.ownership = isOwnedCalendar ? "created" : "referenced";
	eventData.sourceLumaCalendarId = lumaEvent.calendar_api_id;
	eventData.sourceLumaEventId = lumaEvent.api_id;
	eventData.sourceContentHash = computeContentHash({
		name: lumaEvent.name,
		description: lumaEvent.description_md || lumaEvent.description,
		startDate: lumaEvent.start_at ? new Date(lumaEvent.start_at) : null,
		endDate: lumaEvent.end_at ? new Date(lumaEvent.end_at) : null,
		venue: lumaEvent.location?.place_name,
	});
	eventData.lastSourceCheckAt = new Date();
	eventData.syncStatus = "synced";

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
		lastSyncedAt: new Date(),
		lumaUpdatedAt: new Date(lumaEvent.updated_at),
	});

	if (hosts.length > 0) {
		await saveEventHosts(newEvent.id, hosts, resolution.primaryHost?.api_id);
		await upsertHostMappings(hosts, resolution);
	}

	return { created: true, eventId: newEvent.id };
}

async function scrapeEventWithFirecrawl(
	eventUrl: string,
): Promise<LumaExtractedData | null> {
	try {
		const firecrawl = new Firecrawl({
			apiKey: process.env.FIRECRAWL_API_KEY!,
		});

		const result = await firecrawl.scrape(eventUrl, {
			formats: [
				"markdown",
				"html",
				{
					type: "json",
					prompt: `Extract event information from this Luma event page. Return a JSON object with:
- name (string, event title)
- description (string, formatted in MARKDOWN)
- startDate (ISO 8601 string)
- endDate (ISO 8601 string)
- location (object with venue, city, country, isVirtual boolean)
- organizerName (string)
- registrationUrl (string)
- eventType (string: hackathon, conference, workshop, meetup, etc.)`,
				},
			],
		});

		if (!result.json) {
			return null;
		}

		const extracted = result.json as LumaExtractedData;

		if (result.html) {
			const lumaImageRegex = /https:\/\/images\.lumacdn\.com\/[^\s"'<>]+/g;
			const matches = result.html.match(lumaImageRegex);
			if (matches && matches.length > 0) {
				extracted.imageUrl = matches[0];
			}
		}

		return extracted;
	} catch (error) {
		console.warn(`[Webhook] Firecrawl scraping failed for ${eventUrl}:`, error);
		return null;
	}
}

async function fetchFullEventData(
	eventApiId: string,
	webhookData: WebhookEventData,
): Promise<{ lumaEvent: LumaEvent; scrapedData?: LumaExtractedData }> {
	let lumaEvent: LumaEvent;
	let scrapedData: LumaExtractedData | undefined;

	try {
		const client = getGlobalLumaClient();
		lumaEvent = await client.getEvent(eventApiId);

		if (!lumaEvent.description && !lumaEvent.location) {
			metadata.set("fallback", "firecrawl");
			scrapedData = (await scrapeEventWithFirecrawl(webhookData.url)) ?? undefined;
		}
	} catch {
		metadata.set("fallback", "firecrawl");
		scrapedData = (await scrapeEventWithFirecrawl(webhookData.url)) ?? undefined;

		lumaEvent = {
			api_id: webhookData.api_id,
			name: webhookData.name,
			url: webhookData.url,
			start_at: webhookData.start_at,
			end_at: webhookData.end_at,
			timezone: webhookData.timezone,
			cover_url: webhookData.cover_url,
			calendar_api_id: webhookData.calendar.id,
			hosts: webhookData.hosts.map((h) => ({
				api_id: h.id,
				name: h.name,
				avatar_url: h.avatar_url,
			})),
			visibility: "public",
			status: "published",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
	}

	return { lumaEvent, scrapedData };
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
				if (!data.api_id) {
					metadata.set("error", "No event data in payload");
					return { success: false, error: "No event data" };
				}

				metadata.set("webhookEventId", data.api_id);
				metadata.set("webhookEventName", data.name);

				const { lumaEvent, scrapedData } = await fetchFullEventData(
					data.api_id,
					data,
				);

				if (scrapedData) {
					if (scrapedData.description && !lumaEvent.description) {
						lumaEvent.description_md = scrapedData.description;
					}
					if (scrapedData.location && !lumaEvent.location) {
						lumaEvent.location = {
							type: scrapedData.location.isVirtual ? "online" : "offline",
							city: scrapedData.location.city,
							country: scrapedData.location.country,
							place_name: scrapedData.location.venue,
						};
					}
					metadata.set("scrapedDescription", !!scrapedData.description);
					metadata.set("scrapedLocation", !!scrapedData.location);
				}

				metadata.set("lumaEventId", lumaEvent.api_id);
				metadata.set("eventName", lumaEvent.name);
				metadata.set("calendarApiId", lumaEvent.calendar_api_id);
				metadata.set("hasDescription", !!lumaEvent.description || !!lumaEvent.description_md);
				metadata.set("hasLocation", !!lumaEvent.location);

				const result = await processEventCreatedOrUpdated(lumaEvent);

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
