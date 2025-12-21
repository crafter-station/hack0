import type { NewEvent } from "@/lib/db/schema";
import type { LumaEvent } from "./types";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.substring(0, 200);
}

function detectEventType(
	name: string,
	description?: string,
): NewEvent["eventType"] {
	const text = `${name} ${description || ""}`.toLowerCase();

	if (text.includes("hackathon") || text.includes("hackatón"))
		return "hackathon";
	if (text.includes("workshop") || text.includes("taller")) return "workshop";
	if (text.includes("bootcamp")) return "bootcamp";
	if (text.includes("meetup") || text.includes("encuentro")) return "meetup";
	if (
		text.includes("conference") ||
		text.includes("conferencia") ||
		text.includes("congreso")
	)
		return "conference";
	if (text.includes("seminar") || text.includes("seminario")) return "seminar";
	if (text.includes("networking")) return "networking";
	if (text.includes("olympiad") || text.includes("olimpiada"))
		return "olympiad";
	if (text.includes("competition") || text.includes("competencia"))
		return "competition";
	if (text.includes("accelerator") || text.includes("aceleradora"))
		return "accelerator";
	if (text.includes("course") || text.includes("curso")) return "course";
	if (text.includes("certification") || text.includes("certificación"))
		return "certification";

	return "meetup";
}

function detectFormat(lumaEvent: LumaEvent): NewEvent["format"] {
	const locationType = lumaEvent.location?.type;

	if (locationType === "online") return "virtual";
	if (locationType === "offline") return "in-person";
	if (locationType === "hybrid") return "hybrid";

	if (lumaEvent.meeting_url || lumaEvent.zoom_meeting_url) {
		if (lumaEvent.location?.address) return "hybrid";
		return "virtual";
	}

	if (lumaEvent.location?.address) return "in-person";

	return "virtual";
}

function extractCountryCode(lumaEvent: LumaEvent): string | undefined {
	const country = lumaEvent.location?.country?.toLowerCase();
	if (!country) return undefined;

	const countryMap: Record<string, string> = {
		peru: "PE",
		perú: "PE",
		colombia: "CO",
		argentina: "AR",
		mexico: "MX",
		méxico: "MX",
		chile: "CL",
		brazil: "BR",
		brasil: "BR",
		ecuador: "EC",
		bolivia: "BO",
		uruguay: "UY",
		paraguay: "PY",
		venezuela: "VE",
		"united states": "US",
		usa: "US",
		spain: "ES",
		españa: "ES",
	};

	return countryMap[country] || country.substring(0, 2).toUpperCase();
}

function cleanDescription(description?: string): string | undefined {
	if (!description) return undefined;

	return description
		.replace(/<[^>]*>/g, "")
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
		.substring(0, 5000);
}

function extractLumaSlugFromUrl(url: string): string | undefined {
	try {
		const urlObj = new URL(url);
		if (urlObj.hostname === "lu.ma") {
			const pathParts = urlObj.pathname.split("/").filter(Boolean);
			if (pathParts.length > 0) {
				return pathParts[0];
			}
		}
	} catch {
		return undefined;
	}
	return undefined;
}

export function transformLumaEvent(
	lumaEvent: LumaEvent,
	options?: {
		organizationId?: string;
		sourceId?: string;
	},
): NewEvent {
	const name = lumaEvent.name.trim();
	const baseSlug = slugify(name);
	const timestamp = Date.now().toString(36);
	const slug = `${baseSlug}-luma-${timestamp}`;
	const lumaSlug = lumaEvent.slug || extractLumaSlugFromUrl(lumaEvent.url);

	const startDate = new Date(lumaEvent.start_at);
	const endDate = lumaEvent.end_at ? new Date(lumaEvent.end_at) : undefined;

	return {
		slug,
		name,
		description: cleanDescription(
			lumaEvent.description_md || lumaEvent.description,
		),
		eventType: detectEventType(name, lumaEvent.description),
		startDate,
		endDate: endDate || startDate,
		format: detectFormat(lumaEvent),
		country: extractCountryCode(lumaEvent),
		department: lumaEvent.location?.region,
		city: lumaEvent.location?.city,
		venue: lumaEvent.location?.place_name || lumaEvent.location?.address,
		timezone: lumaEvent.timezone,
		geoLatitude: lumaEvent.geo_latitude?.toString(),
		geoLongitude: lumaEvent.geo_longitude?.toString(),
		meetingUrl: lumaEvent.meeting_url || lumaEvent.zoom_meeting_url,
		skillLevel: "all",
		websiteUrl: lumaEvent.url,
		registrationUrl: lumaEvent.registration_url || lumaEvent.url,
		eventImageUrl: lumaEvent.cover_url,
		lumaSlug,
		status: determineEventStatus(startDate, endDate),
		isFeatured: false,
		isApproved: true,
		approvalStatus: "approved",
		organizationId: options?.organizationId,
		isOrganizerVerified: false,
	};
}

function determineEventStatus(
	startDate: Date,
	endDate?: Date,
): NewEvent["status"] {
	const now = new Date();
	const start = new Date(startDate);
	const end = endDate ? new Date(endDate) : start;

	if (now > end) return "ended";
	if (now >= start && now <= end) return "ongoing";
	return "upcoming";
}

export interface LumaEventMapping {
	lumaEventId: string;
	eventSlug: string;
	lumaCalendarId: string;
	lumaUpdatedAt: Date;
}

export function createEventMapping(
	lumaEvent: LumaEvent,
	eventId: string,
	lumaCalendarId: string,
): LumaEventMapping {
	return {
		lumaEventId: lumaEvent.api_id,
		eventSlug: eventId,
		lumaCalendarId,
		lumaUpdatedAt: new Date(lumaEvent.updated_at),
	};
}

export function shouldUpdateEvent(
	existingUpdatedAt: Date,
	lumaUpdatedAt: string,
): boolean {
	const lumaDate = new Date(lumaUpdatedAt);
	return lumaDate > existingUpdatedAt;
}

export function mergeEventUpdates(
	existing: Partial<NewEvent>,
	lumaEvent: LumaEvent,
): Partial<NewEvent> {
	const updates: Partial<NewEvent> = {};

	if (lumaEvent.name !== existing.name) {
		updates.name = lumaEvent.name;
	}

	const newDescription = cleanDescription(
		lumaEvent.description_md || lumaEvent.description,
	);
	if (newDescription !== existing.description) {
		updates.description = newDescription;
	}

	const newStartDate = new Date(lumaEvent.start_at);
	if (existing.startDate?.getTime() !== newStartDate.getTime()) {
		updates.startDate = newStartDate;
	}

	if (lumaEvent.end_at) {
		const newEndDate = new Date(lumaEvent.end_at);
		if (existing.endDate?.getTime() !== newEndDate.getTime()) {
			updates.endDate = newEndDate;
		}
	}

	if (lumaEvent.cover_url !== existing.eventImageUrl) {
		updates.eventImageUrl = lumaEvent.cover_url;
	}

	const newVenue =
		lumaEvent.location?.place_name || lumaEvent.location?.address;
	if (newVenue !== existing.venue) {
		updates.venue = newVenue;
	}

	if (lumaEvent.location?.city !== existing.city) {
		updates.city = lumaEvent.location?.city;
	}

	const newStatus = determineEventStatus(
		updates.startDate || existing.startDate!,
		updates.endDate || existing.endDate || undefined,
	);
	if (newStatus !== existing.status) {
		updates.status = newStatus;
	}

	updates.updatedAt = new Date();

	return updates;
}
