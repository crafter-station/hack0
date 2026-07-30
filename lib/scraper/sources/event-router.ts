import { z } from "zod";
import { inferLatamLocationFromText } from "@/lib/geo/latam-location";
import type { EventCandidate } from "@/lib/ingestion/types";

const eventProviderSchema = z.enum(["luma", "eventbrite", "meetup"]);
const ownershipSchema = z.enum(["connected", "external"]);
const dateStringSchema = z
	.string()
	.refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");
const LATAM_COUNTRY_CODES = new Set([
	"AR",
	"BO",
	"BR",
	"BZ",
	"CL",
	"CO",
	"CR",
	"CU",
	"DO",
	"EC",
	"GF",
	"GP",
	"GT",
	"GY",
	"HN",
	"HT",
	"MQ",
	"MX",
	"NI",
	"PA",
	"PE",
	"PR",
	"PY",
	"SR",
	"SV",
	"UY",
	"VE",
]);

const eventSourceSchema = z
	.object({
		provider: eventProviderSchema,
		sourceType: z.string().min(1),
		sourceKey: z.string().min(1),
		calendarId: z.string().nullable().optional(),
		calendarName: z.string().nullable().optional(),
		sourceUrl: z.string().url(),
		externalEventId: z.string().nullable().optional(),
		hostName: z.string().nullable().optional(),
		lastSyncedAt: dateStringSchema.optional(),
	})
	.passthrough();

const eventCalendarSchema = z
	.object({
		calendarId: z.string().min(1),
		name: z.string().min(1),
		slug: z.string().nullable().optional(),
		source: z.enum(["api", "scrape"]),
		provider: eventProviderSchema,
		ownership: ownershipSchema,
	})
	.passthrough();

const externalIdsSchema = z
	.object({
		lumaEventId: z.string().optional(),
		eventbriteEventId: z.string().optional(),
		meetupEventId: z.string().optional(),
		scrapedEventKeys: z.array(z.string()).optional(),
	})
	.passthrough();

const eventEnrichmentSchema = z
	.object({
		languageCode: z.string().nullable().optional(),
		languages: z.array(z.string()).optional(),
		countryCode: z.string().nullable().optional(),
		region: z.string().nullable().optional(),
		venueName: z.string().nullable().optional(),
		venueAddress: z.string().nullable().optional(),
		latitude: z.number().nullable().optional(),
		longitude: z.number().nullable().optional(),
		isOnline: z.boolean().nullable().optional(),
		format: z.string().nullable().optional(),
		topics: z.array(z.string()).optional(),
		audience: z.array(z.string()).optional(),
		level: z.string().nullable().optional(),
		organizer: z.string().nullable().optional(),
		confidence: z.number().nullable().optional(),
		sources: z.record(z.string(), z.string()).optional(),
	})
	.passthrough();

const eventRouterEventSchema = z
	.object({
		id: z.string().min(1),
		name: z.string().trim().min(1),
		coverUrl: z.string().url().nullable().optional(),
		url: z.string().url(),
		startAt: dateStringSchema,
		endAt: dateStringSchema.nullable().optional(),
		temporalStatus: z
			.enum(["upcoming", "ongoing", "past", "unknown"])
			.optional(),
		city: z.string().nullable().optional(),
		description: z.string().nullable().optional(),
		timezone: z.string().nullable().optional(),
		enrichment: eventEnrichmentSchema.optional(),
		updatedAt: dateStringSchema.nullable().optional(),
		externalIds: externalIdsSchema.nullable().optional(),
		sources: z.array(eventSourceSchema).nullable().optional(),
		sourceCount: z.number().int().nonnegative().optional(),
		sourceCalendars: z.array(eventCalendarSchema).optional(),
		tags: z.array(z.string()).optional(),
		suggestedTags: z.array(z.string()).optional(),
		calendar: eventCalendarSchema.nullable().optional(),
	})
	.passthrough();

const eventRouterPageSchema = z
	.object({
		events: z.array(z.unknown()),
		page: z.object({
			limit: z.number().int().positive(),
			offset: z.number().int().nonnegative(),
			total: z.number().int().nonnegative(),
			nextCursor: z.string().nullable(),
		}),
		mode: z.literal("canonical"),
		generatedAt: dateStringSchema,
	})
	.passthrough();

type EventRouterEvent = z.infer<typeof eventRouterEventSchema>;
type EventRouterFetch = typeof fetch;

export interface EventRouterRejection {
	page: number;
	index: number;
	name: string | null;
	issues: string[];
}

export type EventRouterExclusionReason =
	| "outside_latam"
	| "online_not_spanish"
	| "missing_location_and_language";

export interface EventRouterExclusion {
	page: number;
	index: number;
	name: string;
	url: string;
	reason: EventRouterExclusionReason;
}

type EventRouterEligibility =
	| {
			accepted: true;
			reason: "latam_location" | "online_spanish";
			countryCode: string | null;
			city: string | null;
			isOnline: boolean;
	  }
	| {
			accepted: false;
			reason: EventRouterExclusionReason;
			countryCode: string | null;
			city: string | null;
			isOnline: boolean;
	  };

export interface EventRouterCollection {
	candidates: EventCandidate[];
	rejections: EventRouterRejection[];
	exclusions: EventRouterExclusion[];
	metadata: {
		pages: number;
		reportedTotal: number;
		generatedAt: string | null;
	};
}

export interface EventRouterOptions {
	baseUrl?: string;
	token?: string;
	from?: string;
	owned?: boolean;
	maxEvents?: number;
	maxPages?: number;
	fetchImpl?: EventRouterFetch;
}

function requiredConfig(value: string | undefined, name: string) {
	const normalized = value?.trim();
	if (!normalized) throw new Error(`${name} is required`);
	return normalized;
}

function parseBaseUrl(value: string) {
	const parsed = new URL(value);
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new Error("EVENT_ROUTER_API_URL must use http or https");
	}
	return parsed;
}

function uniqueOrganizers(event: EventRouterEvent) {
	const seen = new Set<string>();
	const organizers: Array<{ name: string }> = [];
	const names = [
		event.enrichment?.organizer,
		...(event.sourceCalendars ?? []).map((calendar) => calendar.name),
		...(event.sources ?? []).map((source) => source.hostName),
	];

	for (const name of names) {
		const normalized = name?.trim();
		if (!normalized || seen.has(normalized.toLowerCase())) continue;
		seen.add(normalized.toLowerCase());
		organizers.push({ name: normalized });
	}

	return organizers;
}

function normalizedLanguage(value: string) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

function isSpanishLanguage(event: EventRouterEvent) {
	const languages = [
		event.enrichment?.languageCode,
		...(event.enrichment?.languages ?? []),
	]
		.filter((value): value is string => Boolean(value))
		.map(normalizedLanguage);

	return languages.some(
		(language) =>
			language === "es" ||
			language.startsWith("es-") ||
			language === "spanish" ||
			language === "espanol" ||
			language === "castellano",
	);
}

function hasOnlineSignal(event: EventRouterEvent) {
	if (
		event.enrichment?.isOnline !== null &&
		event.enrichment?.isOnline !== undefined
	) {
		return event.enrichment.isOnline;
	}
	return /\b(online|virtual|remote|remoto|remota|en linea)\b/i.test(
		[event.enrichment?.format, event.city].filter(Boolean).join(" "),
	);
}

export function eventRouterEligibility(
	event: EventRouterEvent,
): EventRouterEligibility {
	const inferredLocation = inferLatamLocationFromText(
		event.city,
		event.enrichment?.region,
		event.enrichment?.venueName,
		event.enrichment?.venueAddress,
		event.name,
		event.description,
	);
	const declaredCountry =
		event.enrichment?.countryCode?.trim().toUpperCase() || null;
	const countryCode = declaredCountry ?? inferredLocation?.country ?? null;
	const isLatamLocation = declaredCountry
		? LATAM_COUNTRY_CODES.has(declaredCountry)
		: Boolean(inferredLocation);
	const isOnline = hasOnlineSignal(event);

	if (isLatamLocation) {
		return {
			accepted: true,
			reason: "latam_location",
			countryCode,
			city: inferredLocation?.city ?? event.city?.trim() ?? null,
			isOnline,
		};
	}
	if (isOnline && isSpanishLanguage(event)) {
		return {
			accepted: true,
			reason: "online_spanish",
			countryCode: null,
			city: null,
			isOnline: true,
		};
	}

	const hasLocationEvidence = Boolean(
		declaredCountry ||
			event.city?.trim() ||
			event.enrichment?.region?.trim() ||
			event.enrichment?.venueName?.trim() ||
			event.enrichment?.venueAddress?.trim(),
	);
	return {
		accepted: false,
		reason: isOnline
			? "online_not_spanish"
			: hasLocationEvidence
				? "outside_latam"
				: "missing_location_and_language",
		countryCode,
		city: event.city?.trim() ?? null,
		isOnline,
	};
}

function primaryProvider(event: EventRouterEvent) {
	return (
		event.calendar?.provider ??
		event.sourceCalendars?.[0]?.provider ??
		event.sources?.[0]?.provider ??
		"luma"
	);
}

function providerExternalId(
	event: EventRouterEvent,
	provider: "luma" | "eventbrite" | "meetup",
) {
	if (provider === "luma" && event.externalIds?.lumaEventId) {
		return event.externalIds.lumaEventId;
	}
	if (provider === "eventbrite" && event.externalIds?.eventbriteEventId) {
		return event.externalIds.eventbriteEventId;
	}
	if (provider === "meetup" && event.externalIds?.meetupEventId) {
		return event.externalIds.meetupEventId;
	}
	return (
		event.sources?.find((source) => source.provider === provider)
			?.externalEventId ?? event.id
	);
}

export function eventRouterEventToCandidate(
	event: EventRouterEvent,
	generatedAt: string,
): EventCandidate {
	const eligibility = eventRouterEligibility(event);
	const provider = primaryProvider(event);
	const calendars = event.sourceCalendars ?? [];
	const ownership = calendars.some(
		(calendar) => calendar.ownership === "connected",
	)
		? "connected"
		: "external";

	return {
		name: event.name,
		sourceUrl: event.url,
		sourceType: "luma_router",
		externalId: `${provider}:${providerExternalId(event, provider)}`,
		description: event.description ?? undefined,
		startDate: event.startAt,
		endDate: event.endAt ?? undefined,
		timezone: event.timezone ?? undefined,
		modality: eligibility.isOnline
			? eligibility.reason === "latam_location" && eligibility.city
				? "hybrid"
				: "virtual"
			: "in-person",
		country: eligibility.countryCode ?? undefined,
		city: eligibility.city ?? undefined,
		venue: event.enrichment?.venueName ?? undefined,
		fullAddress: event.enrichment?.venueAddress ?? undefined,
		websiteUrl: event.url,
		registrationUrl: event.url,
		imageUrl: event.coverUrl ?? undefined,
		themes: [
			"Latam",
			...new Set([...(event.tags ?? []), ...(event.suggestedTags ?? [])]),
			...(event.enrichment?.topics ?? []),
		],
		languages: [
			...new Set(
				[
					event.enrichment?.languageCode,
					...(event.enrichment?.languages ?? []),
				].filter((value): value is string => Boolean(value)),
			),
		],
		organizers: uniqueOrganizers(event),
		scopeHint: "latam",
		classifyConfidence:
			event.enrichment?.confidence === null ||
			event.enrichment?.confidence === undefined
				? undefined
				: event.enrichment.confidence <= 1
					? event.enrichment.confidence * 100
					: Math.min(event.enrichment.confidence, 100),
		discoveredAt: generatedAt,
		raw: {
			routerEventId: event.id,
			provider,
			ownership,
			sourceCount: event.sourceCount ?? event.sources?.length ?? 1,
			calendars,
			sources: event.sources ?? [],
			externalIds: event.externalIds ?? null,
			enrichment: event.enrichment ?? {},
			hack0Eligibility: eligibility.reason,
		},
	};
}

export async function fetchEventRouterCandidates(
	options: EventRouterOptions = {},
): Promise<EventRouterCollection> {
	const baseUrl = parseBaseUrl(
		requiredConfig(
			options.baseUrl ?? process.env.EVENT_ROUTER_API_URL,
			"EVENT_ROUTER_API_URL",
		),
	);
	const token = requiredConfig(
		options.token ?? process.env.EVENT_ROUTER_API_TOKEN,
		"EVENT_ROUTER_API_TOKEN",
	);
	const fetchImpl = options.fetchImpl ?? fetch;
	const maxPages = options.maxPages ?? 100;
	const maxEvents = options.maxEvents;

	if (!Number.isInteger(maxPages) || maxPages < 1) {
		throw new Error("maxPages must be a positive integer");
	}
	if (
		maxEvents !== undefined &&
		(!Number.isInteger(maxEvents) || maxEvents < 1)
	) {
		throw new Error("maxEvents must be a positive integer");
	}
	if (options.from && Number.isNaN(Date.parse(options.from))) {
		throw new Error("from must be an ISO date");
	}

	const candidates: EventCandidate[] = [];
	const rejections: EventRouterRejection[] = [];
	const exclusions: EventRouterExclusion[] = [];
	const seenCursors = new Set<string>();
	let cursor: string | null = null;
	let generatedAt: string | null = null;
	let reportedTotal = 0;
	let pages = 0;

	while (pages < maxPages) {
		const url = new URL("/api/v1/events", baseUrl);
		url.searchParams.set("calendar", "all");
		url.searchParams.set("mode", "canonical");
		url.searchParams.set("status", "upcoming");
		url.searchParams.set("sort", "start_asc");
		url.searchParams.set("limit", "200");
		if (options.from) url.searchParams.set("from", options.from);
		if (options.owned !== undefined) {
			url.searchParams.set("owned", String(options.owned));
		}
		if (cursor) url.searchParams.set("cursor", cursor);
		if (generatedAt) url.searchParams.set("at", generatedAt);

		const response = await fetchImpl(url, {
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${token}`,
			},
			redirect: "manual",
			signal: AbortSignal.timeout(30_000),
		});
		if (!response.ok) {
			throw new Error(
				`Event Router request failed with HTTP ${response.status}`,
			);
		}
		if (!response.headers.get("content-type")?.includes("application/json")) {
			throw new Error(
				"Event Router returned a non-JSON response; verify EVENT_ROUTER_API_URL",
			);
		}

		const pageResult = eventRouterPageSchema.safeParse(await response.json());
		if (!pageResult.success) {
			throw new Error(
				`Event Router returned an invalid page: ${pageResult.error.issues
					.map((issue) => issue.message)
					.join(", ")}`,
			);
		}

		pages++;
		const page = pageResult.data;
		generatedAt ??= page.generatedAt;
		reportedTotal = page.page.total;

		for (const [index, rawEvent] of page.events.entries()) {
			const parsed = eventRouterEventSchema.safeParse(rawEvent);
			if (!parsed.success) {
				rejections.push({
					page: pages,
					index,
					name:
						rawEvent &&
						typeof rawEvent === "object" &&
						"name" in rawEvent &&
						typeof rawEvent.name === "string"
							? rawEvent.name
							: null,
					issues: parsed.error.issues.map((issue) => {
						const path = issue.path.join(".");
						return path ? `${path}: ${issue.message}` : issue.message;
					}),
				});
				continue;
			}

			const eligibility = eventRouterEligibility(parsed.data);
			if (!eligibility.accepted) {
				exclusions.push({
					page: pages,
					index,
					name: parsed.data.name,
					url: parsed.data.url,
					reason: eligibility.reason,
				});
				continue;
			}

			candidates.push(eventRouterEventToCandidate(parsed.data, generatedAt));
			if (maxEvents && candidates.length >= maxEvents) break;
		}

		if (
			(maxEvents && candidates.length >= maxEvents) ||
			!page.page.nextCursor
		) {
			cursor = null;
			break;
		}
		if (seenCursors.has(page.page.nextCursor)) {
			throw new Error("Event Router returned a repeated pagination cursor");
		}
		seenCursors.add(page.page.nextCursor);
		cursor = page.page.nextCursor;
	}

	if (pages === maxPages && cursor) {
		throw new Error(`Event Router exceeded the ${maxPages}-page safety limit`);
	}

	return {
		candidates,
		rejections,
		exclusions,
		metadata: { pages, reportedTotal, generatedAt },
	};
}
