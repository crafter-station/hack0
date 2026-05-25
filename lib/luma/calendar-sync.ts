import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventHosts, events, organizations } from "@/lib/db/schema";
import { resolveLumaEventLocation } from "@/lib/luma/location";
import { inferEventType } from "@/lib/scraper/luma-schema";
import {
	createUniqueSlug,
	ensureUniqueOrgShortCode,
	ensureUniqueShortCode,
	generateSlug,
} from "@/lib/slug-utils";

type LumaHost = {
	id?: string;
	api_id?: string;
	name?: string;
	avatar_url?: string | null;
};

type LumaGeoAddress = {
	city?: string | null;
	region?: string | null;
	country?: string | null;
	country_code?: string | null;
	address?: string | null;
	description?: string | null;
	latitude?: number | string | null;
	longitude?: number | string | null;
	full_address?: string | null;
	short_address?: string | null;
	mode?: string | null;
};

type LumaEvent = {
	id?: string;
	api_id?: string;
	name: string;
	description?: string | null;
	description_md?: string | null;
	start_at?: string | null;
	end_at?: string | null;
	timezone?: string | null;
	url: string;
	cover_url?: string | null;
	meeting_url?: string | null;
	geo_address_json?: LumaGeoAddress | null;
	geo_address_info?: LumaGeoAddress | null;
	coordinate?: {
		latitude?: number | string | null;
		longitude?: number | string | null;
	} | null;
	geo_latitude?: string | null;
	geo_longitude?: string | null;
	visibility?: string | null;
	duration_interval?: string | null;
	location_type?: string | null;
	host?: string | null;
	tags?: string[];
};

type LumaCalendar = {
	name?: string | null;
	slug?: string | null;
	website?: string | null;
	avatar_url?: string | null;
	cover_image_url?: string | null;
	description?: string | null;
	twitter_handle?: string | null;
	instagram_handle?: string | null;
};

type SyncOptions = {
	limit?: number;
	dryRun?: boolean;
	includePast?: boolean;
};

type SyncResult = {
	fetched: number;
	created: number;
	updated: number;
	skipped: number;
	events: Array<{
		name: string;
		url: string;
		action: "created" | "updated" | "skipped";
		reason?: string;
	}>;
};

type LumaCalendarItem = {
	api_id?: string;
	platform?: "luma" | "external";
	status?: string;
	event?: LumaEvent;
	hosts?: LumaHost[];
	calendar?: LumaCalendar;
};

function getLumaApiKey() {
	const apiKey = process.env.LUMA_API_KEY;
	if (!apiKey) {
		throw new Error("LUMA_API_KEY is required");
	}
	return apiKey;
}

function shouldSkipEvent(event: LumaEvent) {
	const name = event.name.toLowerCase();
	return (
		name.includes("speaker") ||
		name.includes("invitacion") ||
		name.includes("invitación") ||
		event.visibility === "private"
	);
}

function normalizeEventUrl(event: LumaEvent) {
	if (event.url.startsWith("http")) return event.url;
	return `https://luma.com/${event.url.replace(/^\/+/, "")}`;
}

function truncate(value: string | null | undefined, max: number) {
	if (!value) return null;
	return value.length > max ? value.slice(0, max) : value;
}

function durationEndDate(startDate: Date | null, interval?: string | null) {
	if (!startDate || !interval) return null;
	const match = interval.match(/P0Y0M0DT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return null;
	const hours = Number(match[1] || 0);
	const minutes = Number(match[2] || 0);
	const seconds = Number(match[3] || 0);
	return new Date(
		startDate.getTime() + (hours * 60 * 60 + minutes * 60 + seconds) * 1000,
	);
}

function statusFromDates(startDate: Date | null, endDate: Date | null) {
	const now = new Date();
	if (endDate && endDate < now) return "ended";
	if (startDate && startDate <= now && endDate && endDate >= now)
		return "ongoing";
	return "upcoming";
}

async function fetchJson<T>(url: string) {
	const response = await fetch(url, {
		headers: {
			accept: "application/json",
			"x-luma-api-key": getLumaApiKey(),
		},
	});

	if (!response.ok) {
		throw new Error(`Luma API returned ${response.status} for ${url}`);
	}

	return (await response.json()) as T;
}

async function fetchCalendar() {
	const calendarId = process.env.HACK0_LUMA_CALENDAR_API_ID;
	if (!calendarId) return null;

	const url = new URL("https://public-api.luma.com/v1/calendar/get");
	url.searchParams.set("id", calendarId);
	const data = await fetchJson<{ calendar: LumaCalendar }>(url.toString());
	return data.calendar;
}

async function listCalendarEvents(limit: number, includePast: boolean) {
	const calendarId = process.env.HACK0_LUMA_CALENDAR_API_ID;
	if (!calendarId) {
		throw new Error("HACK0_LUMA_CALENDAR_API_ID is required");
	}

	const eventsList: Array<{ event: LumaEvent; hosts: LumaHost[] }> = [];
	const seen = new Set<string>();
	const periods = includePast ? ["future", "past"] : ["future"];

	for (const period of periods) {
		let cursor: string | undefined;

		while (eventsList.length < limit) {
			const url = new URL("https://api2.luma.com/calendar/get-items");
			url.searchParams.set("calendar_api_id", calendarId);
			url.searchParams.set("pagination_limit", "50");
			url.searchParams.set("period", period);
			if (cursor) url.searchParams.set("pagination_cursor", cursor);

			const response = await fetch(url, {
				headers: { accept: "application/json" },
			});

			if (!response.ok) {
				throw new Error(`Luma calendar returned ${response.status} for ${url}`);
			}

			const data = (await response.json()) as {
				entries?: LumaCalendarItem[];
				has_more?: boolean;
				next_cursor?: string;
			};

			for (const entry of data.entries || []) {
				if (entry.status && entry.status !== "approved") continue;
				if (!entry.event?.name || !entry.event.url) continue;

				const event = {
					...entry.event,
					url: normalizeEventUrl(entry.event),
				};
				const key = event.api_id || event.id || event.url;
				if (seen.has(key)) continue;
				seen.add(key);
				eventsList.push({ event, hosts: entry.hosts || [] });

				if (eventsList.length >= limit) break;
			}

			if (!data.has_more || !data.next_cursor) break;
			cursor = data.next_cursor;
		}
	}

	return eventsList;
}

async function fetchEventDetails(event: LumaEvent, fallbackHosts: LumaHost[]) {
	const eventId = event.api_id || event.id;
	if (!eventId || !event.url.includes("luma.com")) {
		return { event, hosts: fallbackHosts };
	}

	const url = new URL("https://public-api.luma.com/v1/event/get");
	url.searchParams.set("id", eventId);
	try {
		const data = await fetchJson<{ event?: LumaEvent; hosts?: LumaHost[] }>(
			url.toString(),
		);

		if (data.event?.url) {
			data.event.url = normalizeEventUrl(data.event);
		}

		return {
			event: data.event || event,
			hosts: data.hosts || fallbackHosts,
		};
	} catch {
		return { event, hosts: fallbackHosts };
	}
}

async function resolveCalendarOrganization(
	calendar: LumaCalendar | null,
	dryRun: boolean,
) {
	const name = calendar?.name || "Hack0 Community";
	const slug = generateSlug(calendar?.slug || name || "hack0");

	const existing = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (existing) return existing;
	if (dryRun) return { id: "dry-run" };

	const shortCode = await ensureUniqueOrgShortCode();
	const [created] = await db
		.insert(organizations)
		.values({
			slug,
			shortCode,
			name,
			displayName: name,
			description: calendar?.description || null,
			type: "community",
			websiteUrl: calendar?.website || "https://hack0.dev",
			logoUrl: calendar?.avatar_url || null,
			coverUrl: calendar?.cover_image_url || null,
			twitterUrl: calendar?.twitter_handle
				? `https://x.com/${calendar.twitter_handle}`
				: null,
			instagramUrl: calendar?.instagram_handle
				? `https://instagram.com/${calendar.instagram_handle}`
				: null,
			ownerUserId: process.env.SYSTEM_OWNER_USER_ID || "system_luma_import",
			isPublic: true,
			isVerified: true,
			country: "PE",
		})
		.returning();

	return created;
}

async function syncHosts(eventId: string, hosts: LumaHost[], dryRun: boolean) {
	const validHosts = hosts.filter(
		(host) => host.name && (host.id || host.api_id),
	);
	if (dryRun || validHosts.length === 0) return;

	for (const host of validHosts) {
		await db
			.insert(eventHosts)
			.values({
				eventId,
				source: "luma",
				lumaHostId: host.id || host.api_id,
				name: host.name!,
				avatarUrl: host.avatar_url || null,
			})
			.onConflictDoUpdate({
				target: [eventHosts.eventId, eventHosts.lumaHostId],
				set: {
					name: host.name!,
					avatarUrl: host.avatar_url || null,
					updatedAt: new Date(),
				},
			});
	}

	const currentIds = validHosts
		.map((host) => host.id || host.api_id)
		.filter((id): id is string => Boolean(id));

	await db
		.delete(eventHosts)
		.where(
			and(
				eq(eventHosts.eventId, eventId),
				eq(eventHosts.source, "luma"),
				notInArray(eventHosts.lumaHostId, currentIds),
			),
		);
}

async function syncEvent(
	event: LumaEvent,
	organizationId: string,
	dryRun: boolean,
	fallbackHosts: LumaHost[],
) {
	if (shouldSkipEvent(event)) {
		return {
			name: event.name,
			url: event.url,
			action: "skipped" as const,
			reason: "internal_or_private",
		};
	}

	const { event: detailedEvent, hosts } = await fetchEventDetails(
		event,
		fallbackHosts,
	);
	const description =
		detailedEvent.description_md || detailedEvent.description || null;
	const startDate = detailedEvent.start_at
		? new Date(detailedEvent.start_at)
		: null;
	const endDate = detailedEvent.end_at
		? new Date(detailedEvent.end_at)
		: durationEndDate(startDate, detailedEvent.duration_interval);
	const meetingUrl = detailedEvent.meeting_url || null;
	const location = resolveLumaEventLocation({
		eventName: detailedEvent.name,
		geoAddress: detailedEvent.geo_address_json,
		geoAddressInfo: detailedEvent.geo_address_info,
		coordinate: detailedEvent.coordinate,
		geoLatitude: detailedEvent.geo_latitude,
		geoLongitude: detailedEvent.geo_longitude,
		meetingUrl,
		locationType: detailedEvent.location_type,
		countryFallback: "PE",
	});
	const status = statusFromDates(startDate, endDate);
	const eventType = inferEventType(
		detailedEvent.name,
		description || undefined,
	);

	const existing = await db.query.events.findFirst({
		where: eq(events.websiteUrl, detailedEvent.url),
	});

	if (dryRun) {
		return {
			name: detailedEvent.name,
			url: detailedEvent.url,
			action: existing ? ("updated" as const) : ("created" as const),
		};
	}

	if (existing) {
		await db
			.update(events)
			.set({
				name: truncate(detailedEvent.name, 255) || detailedEvent.name,
				description,
				eventType,
				startDate,
				endDate,
				timezone: detailedEvent.timezone || "America/Lima",
				format: location.format,
				country: location.country,
				department: truncate(location.department, 100),
				city: truncate(location.city, 100),
				venue: truncate(location.venue, 255),
				geoLatitude: location.geoLatitude || existing.geoLatitude,
				geoLongitude: location.geoLongitude || existing.geoLongitude,
				meetingUrl,
				registrationUrl: detailedEvent.url,
				eventImageUrl: detailedEvent.cover_url || existing.eventImageUrl,
				status,
				approvalStatus: "approved",
				isApproved: true,
				organizationId,
				scrapeSource: "luma_public",
				scrapeSourceUrl: detailedEvent.url,
				scrapeRawData: detailedEvent,
				updatedAt: new Date(),
			})
			.where(eq(events.id, existing.id));

		await syncHosts(existing.id, hosts, dryRun);

		return {
			name: detailedEvent.name,
			url: detailedEvent.url,
			action: "updated" as const,
		};
	}

	const slug = await createUniqueSlug(detailedEvent.name);
	const shortCode = await ensureUniqueShortCode();
	const [created] = await db
		.insert(events)
		.values({
			slug,
			shortCode,
			name: truncate(detailedEvent.name, 255) || detailedEvent.name,
			description,
			eventType,
			startDate,
			endDate,
			timezone: detailedEvent.timezone || "America/Lima",
			format: location.format,
			country: location.country,
			department: truncate(location.department, 100),
			city: truncate(location.city, 100),
			venue: truncate(location.venue, 255),
			geoLatitude: location.geoLatitude,
			geoLongitude: location.geoLongitude,
			meetingUrl,
			websiteUrl: detailedEvent.url,
			registrationUrl: detailedEvent.url,
			eventImageUrl: detailedEvent.cover_url || null,
			organizationId,
			isApproved: true,
			approvalStatus: "approved",
			status,
			scrapeSource: "luma_public",
			scrapeSourceUrl: detailedEvent.url,
			scrapeRawData: detailedEvent,
		})
		.returning();

	await syncHosts(created.id, hosts, dryRun);

	return {
		name: detailedEvent.name,
		url: detailedEvent.url,
		action: "created" as const,
	};
}

export async function syncLumaCalendarEvents(options: SyncOptions = {}) {
	const limit = options.limit ?? 50;
	const dryRun = options.dryRun ?? false;
	const calendar = await fetchCalendar();
	const organization = await resolveCalendarOrganization(calendar, dryRun);
	const lumaEvents = await listCalendarEvents(
		limit,
		options.includePast !== false,
	);
	const result: SyncResult = {
		fetched: lumaEvents.length,
		created: 0,
		updated: 0,
		skipped: 0,
		events: [],
	};

	for (const { event, hosts } of lumaEvents) {
		const eventResult = await syncEvent(event, organization.id, dryRun, hosts);
		result.events.push(eventResult);

		if (eventResult.action === "created") result.created++;
		if (eventResult.action === "updated") result.updated++;
		if (eventResult.action === "skipped") result.skipped++;
	}

	return result;
}
