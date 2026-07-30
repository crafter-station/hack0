import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import type { NewEvent } from "@/lib/db/schema/events";

const TRACKING_PARAMS = new Set([
	"fbclid",
	"gclid",
	"mc_cid",
	"mc_eid",
	"ref",
	"referrer",
	"source",
]);

const URL_HOST_ALIASES: Record<string, string> = {
	"lu.ma": "luma.com",
	"www.lu.ma": "luma.com",
	"www.luma.com": "luma.com",
};

const EXACT_MATCH_REASONS = ["source_external_id", "canonical_url"] as const;

export type DeduplicationAction = "insert" | "skip" | "review";
export type DeduplicationConfidence = "exact" | "high" | "possible";
export type DeduplicationReason =
	| (typeof EXACT_MATCH_REASONS)[number]
	| "canonical_url_date_conflict"
	| "name_date_location"
	| "ambiguous_name_date"
	| "new_event";

export interface ComparableEvent {
	id?: string;
	slug?: string | null;
	name: string;
	startDate?: Date | null;
	format?: string | null;
	country?: string | null;
	city?: string | null;
	websiteUrl?: string | null;
	registrationUrl?: string | null;
	devpostUrl?: string | null;
	scrapeSource?: string | null;
	scrapeSourceUrl?: string | null;
	externalId?: string | null;
	scrapeRawData?: unknown;
}

export interface DeduplicationDecision {
	index: number;
	eventId?: string;
	name: string;
	action: DeduplicationAction;
	reason: DeduplicationReason;
	confidence: DeduplicationConfidence;
	matchedEventId?: string;
	matchedEventName?: string;
	slug?: string;
	evidence?: {
		startDate?: string;
		country?: string | null;
		city?: string | null;
		url?: string;
		matchedStartDate?: string;
		matchedCountry?: string | null;
		matchedCity?: string | null;
		matchedUrl?: string;
	};
}

export interface DeduplicationReport {
	newEvents: NewEvent[];
	decisions: DeduplicationDecision[];
	summary: {
		total: number;
		new: number;
		duplicates: number;
		needsReview: number;
	};
}

export interface DuplicateAuditReport {
	decisions: DeduplicationDecision[];
	summary: {
		total: number;
		unique: number;
		duplicates: number;
		needsReview: number;
	};
}

interface Match {
	action: Exclude<DeduplicationAction, "insert">;
	reason: Exclude<DeduplicationReason, "new_event">;
	confidence: DeduplicationConfidence;
	existing: ComparableEvent;
	rank: number;
}

function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function levenshteinDistance(a: string, b: string): number {
	const previous = Array.from({ length: a.length + 1 }, (_, index) => index);

	for (let row = 1; row <= b.length; row++) {
		const current = [row];
		for (let column = 1; column <= a.length; column++) {
			current[column] =
				a[column - 1] === b[row - 1]
					? previous[column - 1]
					: Math.min(
							previous[column - 1] + 1,
							previous[column] + 1,
							current[column - 1] + 1,
						);
		}
		previous.splice(0, previous.length, ...current);
	}

	return previous[a.length];
}

function tokenSimilarity(a: string, b: string): number {
	const left = new Set(a.split(" ").filter(Boolean));
	const right = new Set(b.split(" ").filter(Boolean));
	const union = new Set([...left, ...right]);
	if (union.size === 0) return 1;

	let intersection = 0;
	for (const token of left) {
		if (right.has(token)) intersection++;
	}
	return intersection / union.size;
}

export function eventNameSimilarity(a: string, b: string): number {
	const left = normalizeText(a);
	const right = normalizeText(b);
	const maxLength = Math.max(left.length, right.length);
	const levenshtein =
		maxLength === 0 ? 1 : 1 - levenshteinDistance(left, right) / maxLength;
	return Math.max(levenshtein, tokenSimilarity(left, right));
}

export function canonicalizeEventUrl(value: string | null | undefined) {
	if (!value) return null;

	try {
		const parsed = new URL(value.trim());
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
			return null;

		const rawHost = parsed.hostname.toLowerCase();
		const hostname = URL_HOST_ALIASES[rawHost] ?? rawHost.replace(/^www\./, "");
		const pathname = parsed.pathname
			.replace(/\/{2,}/g, "/")
			.replace(/\/+$/, "");
		if (
			hostname === "secure.devpost.com" &&
			pathname.toLowerCase() === "/users/register"
		) {
			return null;
		}

		for (const key of [...parsed.searchParams.keys()]) {
			const normalizedKey = key.toLowerCase();
			if (
				normalizedKey.startsWith("utm_") ||
				TRACKING_PARAMS.has(normalizedKey)
			) {
				parsed.searchParams.delete(key);
			}
		}
		parsed.searchParams.sort();

		const query = parsed.searchParams.toString();
		return `${hostname}${pathname || "/"}${query ? `?${query}` : ""}`;
	} catch {
		return null;
	}
}

function externalIdentity(event: ComparableEvent) {
	if (!event.scrapeSource) return null;
	if (event.externalId?.trim()) {
		return `${event.scrapeSource.trim().toLowerCase()}:${event.externalId.trim()}`;
	}
	if (!event.scrapeRawData) return null;
	if (
		typeof event.scrapeRawData !== "object" ||
		Array.isArray(event.scrapeRawData)
	) {
		return null;
	}

	const externalId = (event.scrapeRawData as Record<string, unknown>)
		.externalId;
	if (typeof externalId !== "string" || externalId.trim().length === 0) {
		return null;
	}

	return `${event.scrapeSource.trim().toLowerCase()}:${externalId.trim()}`;
}

function eventUrls(event: ComparableEvent) {
	return new Set(
		[
			event.websiteUrl,
			event.scrapeSourceUrl,
			event.devpostUrl,
			event.registrationUrl,
		]
			.map(canonicalizeEventUrl)
			.filter((url): url is string => Boolean(url)),
	);
}

function datesWithinHours(
	left: Date | null | undefined,
	right: Date | null | undefined,
	hours: number,
) {
	if (!left || !right) return false;
	return Math.abs(left.getTime() - right.getTime()) <= hours * 60 * 60 * 1000;
}

function locationRelationship(
	left: ComparableEvent,
	right: ComparableEvent,
): "same" | "unknown" | "conflict" {
	if (left.format === "virtual" && right.format === "virtual") return "same";
	if (
		(left.format === "virtual" && right.format === "in-person") ||
		(left.format === "in-person" && right.format === "virtual")
	) {
		return "conflict";
	}

	const leftCountry = normalizeText(left.country ?? "");
	const rightCountry = normalizeText(right.country ?? "");
	if (leftCountry && rightCountry && leftCountry !== rightCountry) {
		return "conflict";
	}

	const leftCity = normalizeText(left.city ?? "");
	const rightCity = normalizeText(right.city ?? "");
	if (leftCity && rightCity && leftCity !== rightCity) return "conflict";
	if (leftCity && rightCity && leftCity === rightCity) return "same";
	if (leftCity || rightCity) return "unknown";
	if (leftCountry && rightCountry && leftCountry === rightCountry)
		return "same";

	return "unknown";
}

function compareEvents(
	incoming: ComparableEvent,
	existing: ComparableEvent,
): Match | null {
	const incomingExternalIdentity = externalIdentity(incoming);
	const existingExternalIdentity = externalIdentity(existing);
	if (
		incomingExternalIdentity &&
		incomingExternalIdentity === existingExternalIdentity
	) {
		return {
			action: "skip",
			reason: "source_external_id",
			confidence: "exact",
			existing,
			rank: 100,
		};
	}

	const incomingUrls = eventUrls(incoming);
	const existingUrls = eventUrls(existing);
	for (const url of incomingUrls) {
		if (existingUrls.has(url)) {
			if (
				incoming.startDate &&
				existing.startDate &&
				!datesWithinHours(incoming.startDate, existing.startDate, 72)
			) {
				return {
					action: "review",
					reason: "canonical_url_date_conflict",
					confidence: "possible",
					existing,
					rank: 70,
				};
			}
			return {
				action: "skip",
				reason: "canonical_url",
				confidence: "exact",
				existing,
				rank: 90,
			};
		}
	}

	if (!incoming.startDate || !existing.startDate) return null;
	const similarity = eventNameSimilarity(incoming.name, existing.name);
	const location = locationRelationship(incoming, existing);

	if (
		similarity >= 0.9 &&
		datesWithinHours(incoming.startDate, existing.startDate, 6) &&
		location === "same"
	) {
		return {
			action: "skip",
			reason: "name_date_location",
			confidence: "high",
			existing,
			rank: 80 + similarity,
		};
	}

	if (
		similarity >= 0.78 &&
		datesWithinHours(incoming.startDate, existing.startDate, 72) &&
		location !== "conflict"
	) {
		return {
			action: "review",
			reason: "ambiguous_name_date",
			confidence: "possible",
			existing,
			rank: 50 + similarity,
		};
	}

	return null;
}

function bestMatch(incoming: ComparableEvent, existing: ComparableEvent[]) {
	let best: Match | null = null;
	for (const candidate of existing) {
		const match = compareEvents(incoming, candidate);
		if (match && (!best || match.rank > best.rank)) best = match;
	}
	return best;
}

function matchEvidence(
	incoming: ComparableEvent,
	existing: ComparableEvent,
): NonNullable<DeduplicationDecision["evidence"]> {
	return {
		startDate: incoming.startDate?.toISOString(),
		country: incoming.country,
		city: incoming.city,
		url: [...eventUrls(incoming)][0],
		matchedStartDate: existing.startDate?.toISOString(),
		matchedCountry: existing.country,
		matchedCity: existing.city,
		matchedUrl: [...eventUrls(existing)][0],
	};
}

function shortIdentityHash(event: ComparableEvent) {
	const identity =
		externalIdentity(event) ??
		[...eventUrls(event)][0] ??
		`${normalizeText(event.name)}:${event.startDate?.toISOString() ?? "undated"}:${event.country ?? ""}:${event.city ?? ""}`;
	return createHash("sha256").update(identity).digest("hex").slice(0, 12);
}

function allocateSlug(event: NewEvent, usedSlugs: Set<string>) {
	const base = event.slug ?? "event";
	if (!usedSlugs.has(base)) {
		usedSlugs.add(base);
		return base;
	}

	const year = event.startDate?.getUTCFullYear();
	const country = event.country?.toLowerCase();
	const readableSuffix = [year, country].filter(Boolean).join("-");
	const readable = readableSuffix ? `${base}-${readableSuffix}` : base;
	if (!usedSlugs.has(readable)) {
		usedSlugs.add(readable);
		return readable;
	}

	const hashed = `${readable}-${shortIdentityHash(event)}`;
	usedSlugs.add(hashed);
	return hashed;
}

function newEventId(event: NewEvent) {
	return typeof event.id === "string" ? event.id : undefined;
}

export function deduplicateEvents(
	incoming: NewEvent[],
	existing: ComparableEvent[],
): DeduplicationReport {
	const decisions: DeduplicationDecision[] = [];
	const newEvents: NewEvent[] = [];
	const acceptedBatch: ComparableEvent[] = [];
	const usedSlugs = new Set(
		existing
			.map((event) => event.slug)
			.filter((slug): slug is string => !!slug),
	);

	for (const [index, event] of incoming.entries()) {
		const match = bestMatch(event as ComparableEvent, [
			...existing,
			...acceptedBatch,
		]);

		if (match) {
			decisions.push({
				index,
				eventId: newEventId(event),
				name: event.name,
				action: match.action,
				reason: match.reason,
				confidence: match.confidence,
				matchedEventId: match.existing.id,
				matchedEventName: match.existing.name,
				evidence: matchEvidence(event as ComparableEvent, match.existing),
			});
			continue;
		}

		const slug = allocateSlug(event, usedSlugs);
		const prepared = { ...event, slug };
		newEvents.push(prepared);
		acceptedBatch.push({
			...(prepared as ComparableEvent),
			id: `batch:${index}`,
		});
		decisions.push({
			index,
			eventId: newEventId(event),
			name: event.name,
			action: "insert",
			reason: "new_event",
			confidence: "exact",
			slug,
		});
	}

	return {
		newEvents,
		decisions,
		summary: {
			total: incoming.length,
			new: newEvents.length,
			duplicates: decisions.filter((decision) => decision.action === "skip")
				.length,
			needsReview: decisions.filter((decision) => decision.action === "review")
				.length,
		},
	};
}

export function auditEventCollection(
	collection: ComparableEvent[],
): DuplicateAuditReport {
	const accepted: ComparableEvent[] = [];
	const decisions: DeduplicationDecision[] = [];

	for (const [index, event] of collection.entries()) {
		const match = bestMatch(event, accepted);
		if (match) {
			decisions.push({
				index,
				eventId: event.id,
				name: event.name,
				action: match.action,
				reason: match.reason,
				confidence: match.confidence,
				matchedEventId: match.existing.id,
				matchedEventName: match.existing.name,
				evidence: matchEvidence(event, match.existing),
			});
			if (match.action === "review") accepted.push(event);
			continue;
		}

		accepted.push(event);
		decisions.push({
			index,
			eventId: event.id,
			name: event.name,
			action: "insert",
			reason: "new_event",
			confidence: "exact",
		});
	}

	return {
		decisions,
		summary: {
			total: collection.length,
			unique: accepted.length,
			duplicates: decisions.filter((decision) => decision.action === "skip")
				.length,
			needsReview: decisions.filter((decision) => decision.action === "review")
				.length,
		},
	};
}

async function loadExistingEvents(): Promise<ComparableEvent[]> {
	return db
		.select({
			id: events.id,
			slug: events.slug,
			name: events.name,
			startDate: events.startDate,
			format: events.format,
			country: events.country,
			city: events.city,
			websiteUrl: events.websiteUrl,
			registrationUrl: events.registrationUrl,
			devpostUrl: events.devpostUrl,
			scrapeSource: events.scrapeSource,
			scrapeSourceUrl: events.scrapeSourceUrl,
			externalId: sql<
				string | null
			>`${events.scrapeRawData} ->> 'externalId'`.as("external_id"),
		})
		.from(events);
}

export async function deduplicateAgainstDBWithReport(
	normalized: NewEvent[],
): Promise<DeduplicationReport> {
	const existing = await loadExistingEvents();
	return deduplicateEvents(normalized, existing);
}
