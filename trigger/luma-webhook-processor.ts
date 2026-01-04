import Firecrawl from "@mendable/firecrawl-js";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq, ilike, sql } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import type { LumaApiEvent, LumaWebhookTaskPayload } from "@/lib/luma/types";
import { createUniqueSlug, ensureUniqueShortCode } from "@/lib/slug-utils";

async function fetchLumaEventDetails(
	eventId: string,
): Promise<LumaApiEvent | null> {
	const apiKey = process.env.LUMA_API_KEY;
	if (!apiKey) {
		console.warn("LUMA_API_KEY not configured");
		return null;
	}

	try {
		const response = await fetch(
			`https://public-api.luma.com/v1/event/get?id=${eventId}`,
			{
				headers: {
					accept: "application/json",
					"x-luma-api-key": apiKey,
				},
			},
		);

		if (!response.ok) {
			console.warn(`Luma API returned ${response.status}, will try Firecrawl`);
			return null;
		}

		const data = await response.json();
		return data.event as LumaApiEvent;
	} catch (error) {
		console.error("Failed to fetch Luma event details:", error);
		return null;
	}
}

async function scrapeEventWithFirecrawl(
	eventUrl: string,
): Promise<LumaApiEvent | null> {
	const firecrawlKey = process.env.FIRECRAWL_API_KEY;
	if (!firecrawlKey) {
		console.warn("FIRECRAWL_API_KEY not configured");
		return null;
	}

	try {
		metadata.set("firecrawlStep", "scraping");
		const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

		const result = await firecrawl.scrape(eventUrl, {
			formats: [
				"markdown",
				{
					type: "json",
					prompt: `Extract event information from this Luma event page. Return a JSON object with:
- name (string, event title)
- description_md (string, formatted in MARKDOWN with ## headers, bullet points, **bold** for key info)
- start_at (ISO 8601 string)
- end_at (ISO 8601 string)
- timezone (string, IANA timezone like America/Lima)
- location (object with city, region, country, address, venue name)
- meeting_url (string, if virtual event)
- cover_url (string, event cover image URL)`,
				},
			],
		});

		if (!result.json) {
			console.warn("Firecrawl returned no JSON data");
			return null;
		}

		metadata.set("firecrawlStep", "completed");
		const extracted = result.json as {
			name?: string;
			description_md?: string;
			start_at?: string;
			end_at?: string;
			timezone?: string;
			location?: {
				city?: string;
				region?: string;
				country?: string;
				address?: string;
			};
			meeting_url?: string;
			cover_url?: string;
		};

		return {
			api_id: "",
			name: extracted.name || "",
			description_md: extracted.description_md,
			start_at: extracted.start_at || "",
			end_at: extracted.end_at || "",
			timezone: extracted.timezone || "America/Lima",
			url: eventUrl,
			cover_url: extracted.cover_url || null,
			meeting_url: extracted.meeting_url,
			geo_address_json: extracted.location
				? {
						city: extracted.location.city,
						region: extracted.location.region,
						country: extracted.location.country,
						address: extracted.location.address,
					}
				: null,
		};
	} catch (error) {
		console.error("Firecrawl scraping failed:", error);
		metadata.set("firecrawlStep", "error");
		return null;
	}
}

export const lumaWebhookProcessorTask = task({
	id: "luma-webhook-processor",
	maxDuration: 120,
	run: async (payload: LumaWebhookTaskPayload) => {
		const { event_type, data } = payload;

		metadata.set("eventType", event_type);
		metadata.set("lumaEventId", data.api_id);
		metadata.set("lumaEventName", data.name);
		metadata.set("calendarSlug", data.calendar?.slug || "unknown");

		if (!data.calendar?.slug) {
			metadata.set("step", "error");
			metadata.set("error", "No calendar slug in webhook data");
			return { success: false, error: "No calendar slug" };
		}

		metadata.set("step", "finding_organization");

		const calendarSlug = data.calendar.slug;
		const calendarName = data.calendar.name;

		let org = await db.query.organizations.findFirst({
			where: eq(organizations.slug, calendarSlug),
		});

		if (!org && calendarName) {
			metadata.set("step", "finding_organization_by_name");
			org = await db.query.organizations.findFirst({
				where: ilike(organizations.name, calendarName),
			});
		}

		if (!org) {
			metadata.set("step", "finding_organization_by_partial_slug");
			org = await db.query.organizations.findFirst({
				where: sql`${organizations.slug} LIKE ${`%${calendarSlug}%`} OR ${organizations.slug} LIKE ${`${calendarSlug}-%`}`,
			});
		}

		if (!org) {
			metadata.set("step", "org_not_found");
			metadata.set(
				"error",
				`Organization not found for slug: ${calendarSlug} or name: ${calendarName}`,
			);
			return {
				success: false,
				error: `Organization not found: ${calendarSlug}`,
			};
		}

		metadata.set("organizationId", org.id);
		metadata.set("organizationName", org.name);

		metadata.set("step", "fetching_full_event_data");
		let fullEventData = await fetchLumaEventDetails(data.api_id);

		if (!fullEventData && data.url) {
			metadata.set("step", "scraping_with_firecrawl");
			fullEventData = await scrapeEventWithFirecrawl(data.url);
		}

		if (fullEventData) {
			metadata.set("hasFullData", "true");
			metadata.set(
				"dataSource",
				fullEventData.api_id ? "luma_api" : "firecrawl",
			);
		}

		switch (event_type) {
			case "calendar.event.added":
			case "calendar.event.created": {
				return await handleEventCreated(
					data,
					org.id,
					org.isVerified ?? false,
					fullEventData,
				);
			}
			case "calendar.event.updated": {
				return await handleEventUpdated(data, org.id, fullEventData);
			}
			case "calendar.event.deleted": {
				return await handleEventDeleted(data);
			}
			default: {
				metadata.set("step", "unknown_event_type");
				return {
					success: true,
					skipped: true,
					reason: `Unknown event type: ${event_type}`,
				};
			}
		}
	},
});

async function handleEventCreated(
	data: LumaWebhookTaskPayload["data"],
	organizationId: string,
	isVerified: boolean,
	fullEventData: LumaApiEvent | null,
) {
	metadata.set("step", "checking_existing");

	const existingEvent = await db.query.events.findFirst({
		where: eq(events.websiteUrl, data.url),
	});

	if (existingEvent) {
		metadata.set("step", "event_already_exists");
		metadata.set("existingEventId", existingEvent.id);
		return {
			success: true,
			skipped: true,
			reason: "Event already exists",
			eventId: existingEvent.id,
		};
	}

	metadata.set("step", "creating_event");

	const slug = await createUniqueSlug(data.name);
	const shortCode = await ensureUniqueShortCode();

	const coverUrl = fullEventData?.cover_url || data.cover_url;
	let eventImageUrl: string | null = null;
	if (coverUrl) {
		metadata.set("step", "uploading_image");
		try {
			const utapi = new UTApi();
			const uploadResult = await utapi.uploadFilesFromUrl(coverUrl);
			if (uploadResult.data?.url) {
				eventImageUrl = uploadResult.data.url;
			}
		} catch (error) {
			console.error("Failed to upload cover image:", error);
		}
	}

	const startDate = data.start_at ? new Date(data.start_at) : null;
	const endDate = data.end_at ? new Date(data.end_at) : null;

	const geoData = fullEventData?.geo_address_json || data.geo_address_json;
	const city = geoData?.city || null;
	const country = geoData?.country || "PE";
	const department = geoData?.region || null;
	const venue = geoData?.description || geoData?.address || null;

	const meetingUrl = fullEventData?.meeting_url || data.meeting_url;
	const isVirtual = !geoData && !!meetingUrl;
	const format = isVirtual ? "virtual" : "in-person";

	const description =
		fullEventData?.description_md ||
		fullEventData?.description ||
		data.description ||
		null;

	metadata.set("step", "inserting_event");

	const [newEvent] = await db
		.insert(events)
		.values({
			slug,
			shortCode,
			name: data.name,
			description,
			eventType: "meetup",
			startDate,
			endDate,
			timezone: data.timezone || "America/Lima",
			format,
			country,
			department,
			city,
			venue,
			geoLatitude:
				fullEventData?.geo_latitude ||
				data.geo_latitude ||
				geoData?.latitude ||
				null,
			geoLongitude:
				fullEventData?.geo_longitude ||
				data.geo_longitude ||
				geoData?.longitude ||
				null,
			meetingUrl: meetingUrl || null,
			websiteUrl: data.url,
			registrationUrl: data.url,
			eventImageUrl,
			organizationId,
			isApproved: isVerified,
			approvalStatus: isVerified ? "approved" : "pending",
			status: "upcoming",
		})
		.returning();

	metadata.set("step", "completed");
	metadata.set("newEventId", newEvent.id);
	metadata.set("newEventSlug", newEvent.slug);

	return {
		success: true,
		action: "created",
		eventId: newEvent.id,
		eventSlug: newEvent.slug,
	};
}

async function handleEventUpdated(
	data: LumaWebhookTaskPayload["data"],
	organizationId: string,
	fullEventData: LumaApiEvent | null,
) {
	metadata.set("step", "finding_event_to_update");

	const existingEvent = await db.query.events.findFirst({
		where: eq(events.websiteUrl, data.url),
	});

	if (!existingEvent) {
		metadata.set("step", "event_not_found_creating");
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, organizationId),
		});
		return await handleEventCreated(
			data,
			organizationId,
			org?.isVerified ?? false,
			fullEventData,
		);
	}

	metadata.set("step", "updating_event");

	const coverUrl = fullEventData?.cover_url || data.cover_url;
	let eventImageUrl = existingEvent.eventImageUrl;
	if (coverUrl && !coverUrl.includes("uploadthing")) {
		try {
			const utapi = new UTApi();
			const uploadResult = await utapi.uploadFilesFromUrl(coverUrl);
			if (uploadResult.data?.url) {
				eventImageUrl = uploadResult.data.url;
			}
		} catch (error) {
			console.error("Failed to upload updated cover image:", error);
		}
	}

	const startDate = data.start_at
		? new Date(data.start_at)
		: existingEvent.startDate;
	const endDate = data.end_at ? new Date(data.end_at) : existingEvent.endDate;

	const geoData = fullEventData?.geo_address_json || data.geo_address_json;
	const description =
		fullEventData?.description_md ||
		fullEventData?.description ||
		data.description ||
		existingEvent.description;
	const meetingUrl =
		fullEventData?.meeting_url || data.meeting_url || existingEvent.meetingUrl;

	await db
		.update(events)
		.set({
			name: data.name,
			description,
			startDate,
			endDate,
			timezone: data.timezone || existingEvent.timezone,
			city: geoData?.city || existingEvent.city,
			venue: geoData?.description || geoData?.address || existingEvent.venue,
			geoLatitude:
				fullEventData?.geo_latitude ||
				data.geo_latitude ||
				geoData?.latitude ||
				existingEvent.geoLatitude,
			geoLongitude:
				fullEventData?.geo_longitude ||
				data.geo_longitude ||
				geoData?.longitude ||
				existingEvent.geoLongitude,
			meetingUrl,
			eventImageUrl,
			updatedAt: new Date(),
		})
		.where(eq(events.id, existingEvent.id));

	metadata.set("step", "completed");
	metadata.set("updatedEventId", existingEvent.id);

	return {
		success: true,
		action: "updated",
		eventId: existingEvent.id,
		eventSlug: existingEvent.slug,
	};
}

async function handleEventDeleted(data: LumaWebhookTaskPayload["data"]) {
	metadata.set("step", "finding_event_to_delete");

	const existingEvent = await db.query.events.findFirst({
		where: eq(events.websiteUrl, data.url),
	});

	if (!existingEvent) {
		metadata.set("step", "event_not_found");
		return {
			success: true,
			skipped: true,
			reason: "Event not found to delete",
		};
	}

	metadata.set("step", "deleting_event");

	await db.delete(events).where(eq(events.id, existingEvent.id));

	metadata.set("step", "completed");
	metadata.set("deletedEventId", existingEvent.id);

	return {
		success: true,
		action: "deleted",
		eventId: existingEvent.id,
	};
}
