import type { Event } from "@/lib/db/schema";

const LUMA_API_BASE_URL = "https://public-api.luma.com";
const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;

type PublishableEvent = Pick<
	Event,
	| "id"
	| "name"
	| "websiteUrl"
	| "registrationUrl"
	| "startDate"
	| "endDate"
	| "timezone"
	| "format"
	| "venue"
	| "city"
	| "country"
	| "geoLatitude"
	| "geoLongitude"
>;

export type LumaCalendarListingPayload =
	| {
			platform: "luma";
			submission_mode: "auto";
			event_id: string;
	  }
	| {
			platform: "external";
			submission_mode: "auto";
			url: string;
			name: string;
			start_at: string;
			duration_interval: string;
			timezone: string;
			geo_address_json?: { type: "manual"; address: string };
			coordinate?: { latitude: number; longitude: number };
	  };

export type PreparedLumaCalendarListing = {
	payload: LumaCalendarListingPayload;
	sourceUrl: string;
	durationInferred: boolean;
};

type LumaCalendar = {
	id: string;
	name: string;
	slug: string | null;
	url: string;
};

type LumaEntityLookupResponse = {
	entity:
		| {
				type: "event";
				event: { id: string; slug: string };
		  }
		| {
				type: "calendar";
				calendar: { id: string; slug: string | null };
		  }
		| null;
};

type LumaCalendarEventLookupResponse = {
	event: {
		id: string;
		status: "approved" | "pending" | "rejected";
	} | null;
};

type LumaCalendarEventAddResponse = {
	id: string;
	status: "approved" | "pending";
};

function eventPublicUrl(event: PublishableEvent) {
	return event.registrationUrl || event.websiteUrl;
}

function finiteCoordinate(value: string | null) {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function eventAddress(event: PublishableEvent) {
	if (event.format === "virtual") return null;
	const parts = [event.venue, event.city, event.country].filter(
		(part): part is string => Boolean(part?.trim()),
	);
	return parts.length > 0 ? parts.join(", ") : null;
}

export function lumaEventSlugFromUrl(value: string) {
	try {
		const url = new URL(value);
		const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
		if (hostname !== "luma.com" && hostname !== "lu.ma") return null;

		const [slug] = url.pathname.split("/").filter(Boolean);
		if (!slug || ["calendar", "discover", "home"].includes(slug)) return null;
		return slug;
	} catch {
		return null;
	}
}

export function durationToIsoInterval(
	startDate: Date,
	endDate: Date | null,
): { interval: string; inferred: boolean } {
	const rawDuration = endDate
		? endDate.getTime() - startDate.getTime()
		: DEFAULT_EVENT_DURATION_MS;
	const durationMs = rawDuration > 0 ? rawDuration : DEFAULT_EVENT_DURATION_MS;
	let seconds = Math.max(1, Math.round(durationMs / 1000));
	const days = Math.floor(seconds / 86_400);
	seconds -= days * 86_400;
	const hours = Math.floor(seconds / 3_600);
	seconds -= hours * 3_600;
	const minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;

	const datePart = days > 0 ? `${days}D` : "";
	const timeParts = [
		hours > 0 ? `${hours}H` : "",
		minutes > 0 ? `${minutes}M` : "",
		seconds > 0 ? `${seconds}S` : "",
	].join("");
	const timePart = timeParts || (days === 0 ? "1S" : "");

	return {
		interval: `P${datePart}${timePart ? `T${timePart}` : ""}`,
		inferred: !endDate || rawDuration <= 0,
	};
}

export function buildExternalCalendarListing(
	event: PublishableEvent,
): PreparedLumaCalendarListing {
	if (!event.startDate) {
		throw new Error("The event needs a start date before publishing to Luma");
	}

	const sourceUrl = eventPublicUrl(event);
	if (!sourceUrl) {
		throw new Error("The event needs a public URL before publishing to Luma");
	}

	const duration = durationToIsoInterval(event.startDate, event.endDate);
	const address = eventAddress(event);
	const latitude =
		event.format === "virtual" ? null : finiteCoordinate(event.geoLatitude);
	const longitude =
		event.format === "virtual" ? null : finiteCoordinate(event.geoLongitude);

	return {
		sourceUrl,
		durationInferred: duration.inferred,
		payload: {
			platform: "external",
			submission_mode: "auto",
			url: sourceUrl,
			name: event.name,
			start_at: event.startDate.toISOString(),
			duration_interval: duration.interval,
			timezone: event.timezone || "America/Lima",
			...(address
				? { geo_address_json: { type: "manual" as const, address } }
				: {}),
			...(latitude !== null && longitude !== null
				? { coordinate: { latitude, longitude } }
				: {}),
		},
	};
}

export class LumaCalendarPublisherClient {
	constructor(
		private readonly apiKey: string,
		private readonly fetchImplementation: typeof fetch = fetch,
	) {
		if (!apiKey.trim()) {
			throw new Error("HACK0_LUMA_CALENDAR_API_KEY is required");
		}
	}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await this.fetchImplementation(
			`${LUMA_API_BASE_URL}${path}`,
			{
				...init,
				headers: {
					accept: "application/json",
					"x-luma-api-key": this.apiKey,
					...(init?.body ? { "content-type": "application/json" } : {}),
					...init?.headers,
				},
			},
		);

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Luma API returned ${response.status}${body ? `: ${body}` : ""}`,
			);
		}

		return (await response.json()) as T;
	}

	getCalendar() {
		return this.request<LumaCalendar>("/v1/calendars/get");
	}

	async resolveLumaEventId(sourceUrl: string) {
		const slug = lumaEventSlugFromUrl(sourceUrl);
		if (!slug) return null;

		const query = new URLSearchParams({ slug });
		const result = await this.request<LumaEntityLookupResponse>(
			`/v1/entities/lookup?${query}`,
		);
		return result.entity?.type === "event" ? result.entity.event.id : null;
	}

	lookupEvent(payload: LumaCalendarListingPayload) {
		const query =
			payload.platform === "luma"
				? new URLSearchParams({
						platform: "luma",
						event_id: payload.event_id,
					})
				: new URLSearchParams({
						platform: "external",
						url: payload.url,
					});
		return this.request<LumaCalendarEventLookupResponse>(
			`/v1/calendars/events/lookup?${query}`,
		);
	}

	addEvent(payload: LumaCalendarListingPayload) {
		return this.request<LumaCalendarEventAddResponse>(
			"/v1/calendars/events/add",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
		);
	}
}

export async function prepareLumaCalendarListing(
	event: PublishableEvent,
	client: Pick<LumaCalendarPublisherClient, "resolveLumaEventId">,
): Promise<PreparedLumaCalendarListing> {
	const sourceUrl = eventPublicUrl(event);
	const lumaSlug = lumaEventSlugFromUrl(sourceUrl);
	if (!lumaSlug) return buildExternalCalendarListing(event);

	const eventId = await client.resolveLumaEventId(sourceUrl);
	if (!eventId) {
		throw new Error(`Could not resolve the Luma event from ${sourceUrl}`);
	}

	return {
		sourceUrl,
		durationInferred: false,
		payload: {
			platform: "luma",
			submission_mode: "auto",
			event_id: eventId,
		},
	};
}
