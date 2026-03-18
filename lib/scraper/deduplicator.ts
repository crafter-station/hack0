import { differenceInDays } from "date-fns";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import type { NewEvent } from "@/lib/db/schema/events";
import type { SourceType } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// Text utils (inlined to avoid extra dependency)
// ---------------------------------------------------------------------------

/** Normalize a string for comparison: lowercase, strip accents, remove punctuation, collapse spaces. */
function normalizeForComparison(s: string): string {
	return s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // strip accents
		.replace(/[^a-z0-9\s]/g, " ") // strip punctuation
		.replace(/\s+/g, " ")
		.trim();
}

// ---------------------------------------------------------------------------
// Levenshtein distance implementation (avoids dependency issues)
// ---------------------------------------------------------------------------

function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];
	for (let i = 0; i <= b.length; i++) matrix[i] = [i];
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}
	return matrix[b.length][a.length];
}

function normalizedLevenshtein(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 0;
	return levenshteinDistance(a, b) / maxLen;
}

/**
 * Sort the whitespace-delimited tokens of a string alphabetically.
 * "omega hack 2026 eafit" → "2026 eafit hack omega"
 * This makes the similarity metric robust to word-order variations
 * (e.g. "OmegaHack EAFIT 2026" vs "Omega Hack 2026 EAFIT").
 */
function tokenSort(s: string): string {
	return s.split(/\s+/).sort().join(" ");
}

/**
 * Robust name distance: min(raw Levenshtein, token-sorted Levenshtein).
 * Using the minimum means we reward the best possible alignment between
 * two strings regardless of word order, which is the common real-world
 * variant when the same event is listed on two different platforms.
 */
function robustNameDistance(a: string, b: string): number {
	const raw = normalizedLevenshtein(a, b);
	const sorted = normalizedLevenshtein(tokenSort(a), tokenSort(b));
	return Math.min(raw, sorted);
}

function normalizeUrlForDedup(url: string): string {
	return url.toLowerCase().replace(/\/+$/, "").split("?")[0].split("#")[0];
}

export interface DeduplicationResult {
	isNew: boolean;
	existingId?: string;
	action: "insert" | "update" | "skip";
}

export async function findDuplicate(
	normalized: NewEvent,
	sourceType: SourceType,
	sourceUrl: string,
): Promise<DeduplicationResult> {
	// Pass 1: Exact slug match
	if (normalized.slug) {
		const slugMatch = await db
			.select()
			.from(events)
			.where(eq(events.slug, normalized.slug))
			.limit(1);

		if (slugMatch.length > 0) {
			console.info(
				`[deduplicator] Duplicate found (slug match): ${normalized.slug}`,
			);
			return { isNew: false, existingId: slugMatch[0].id, action: "update" };
		}
	}

	// Pass 2: Same website URL (normalize both sides for consistent matching)
	if (normalized.websiteUrl) {
		const dedupedUrl = normalizeUrlForDedup(normalized.websiteUrl);
		const urlMatch = await db
			.select()
			.from(events)
			.where(
				sql`lower(regexp_replace(trim(trailing '/' from coalesce(${events.websiteUrl}, '')), '[?#].*$', '')) = ${dedupedUrl}`,
			)
			.limit(1);

		if (urlMatch.length > 0) {
			console.info(
				`[deduplicator] Duplicate found (URL match): ${normalized.websiteUrl}`,
			);
			return { isNew: false, existingId: urlMatch[0].id, action: "update" };
		}

		// Also check scrapeSourceUrl column
		const sourceUrlMatch = await db
			.select({ id: events.id })
			.from(events)
			.where(
				sql`lower(regexp_replace(trim(trailing '/' from coalesce(${events.scrapeSourceUrl}, '')), '[?#].*$', '')) = ${dedupedUrl}`,
			)
			.limit(1);

		if (sourceUrlMatch.length > 0) {
			console.info(
				`[deduplicator] Duplicate found (scrapeSourceUrl match): ${normalized.websiteUrl}`,
			);
			return {
				isNew: false,
				existingId: sourceUrlMatch[0].id,
				action: "update",
			};
		}
	}

	// Pass 3: Fuzzy name match within date window
	if (normalized.startDate && normalized.name) {
		const threeDaysBefore = new Date(normalized.startDate);
		threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
		const threeDaysAfter = new Date(normalized.startDate);
		threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);

		const candidates = await db
			.select()
			.from(events)
			.where(
				and(
					gte(events.startDate, threeDaysBefore),
					lte(events.startDate, threeDaysAfter),
				),
			);

		const normalizedName = normalizeForComparison(normalized.name);

		for (const candidate of candidates) {
			const candidateName = normalizeForComparison(candidate.name);
			const distance = robustNameDistance(normalizedName, candidateName);

			if (distance < 0.2) {
				console.info(
					`[deduplicator] Duplicate found (fuzzy match): "${normalized.name}" ≈ "${candidate.name}" (distance: ${distance.toFixed(3)})`,
				);
				return { isNew: false, existingId: candidate.id, action: "update" };
			}
		}
	}

	return { isNew: true, action: "insert" };
}

/**
 * Filter an array of normalized events to only those that are not already in
 * the database. Checks each event via findDuplicate and returns only new ones.
 */
export async function deduplicateAgainstDB(
	normalized: NewEvent[],
): Promise<NewEvent[]> {
	const newEvents: NewEvent[] = [];

	for (const event of normalized) {
		const sourceType = (event.scrapeSource ?? "other") as SourceType;
		const sourceUrl = event.scrapeSourceUrl ?? event.websiteUrl ?? "";
		const result = await findDuplicate(event, sourceType, sourceUrl);
		if (result.isNew) {
			newEvents.push(event);
		}
	}

	console.info(
		`[deduplicateAgainstDB] ${normalized.length} in → ${newEvents.length} new`,
	);
	return newEvents;
}

/**
 * Check whether a normalized event already exists in the current in-flight
 * batch (same scraper run). This catches same-URL or near-identical name+date
 * duplicates that appear across different source URLs within the same run
 * before they are both inserted into the DB.
 *
 * Returns the existing batch entry's id if a duplicate is found, null otherwise.
 */
export function findInBatch(
	normalized: NewEvent,
	batch: Array<{
		id: string;
		normalized: NewEvent;
		sourceType: SourceType;
		sourceUrl: string;
	}>,
): string | null {
	for (const b of batch) {
		// URL match
		if (
			normalized.websiteUrl &&
			b.normalized.websiteUrl &&
			normalized.websiteUrl === b.normalized.websiteUrl
		) {
			return b.id;
		}

		// Fuzzy name + close date
		if (
			normalized.startDate &&
			b.normalized.startDate &&
			normalized.name &&
			b.normalized.name
		) {
			const dateDiff = Math.abs(
				differenceInDays(normalized.startDate, b.normalized.startDate),
			);
			if (dateDiff <= 3) {
				const dist = robustNameDistance(
					normalizeForComparison(normalized.name),
					normalizeForComparison(b.normalized.name),
				);
				if (dist < 0.2) return b.id;
			}
		}
	}
	return null;
}
