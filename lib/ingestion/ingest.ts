import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import {
	type CandidateRejection,
	validateEventCandidates,
} from "@/lib/ingestion/candidate";
import { assertWriteAllowed, type IngestionMode } from "@/lib/ingestion/safety";
import type { EventCandidate } from "@/lib/ingestion/types";
import { deduplicateAgainstDB } from "@/lib/scraper/deduplicator";
import { normalizeHackathon } from "@/lib/scraper/normalizer";

export interface IngestionResult {
	mode: IngestionMode;
	candidates: number;
	accepted: number;
	rejected: number;
	normalized: number;
	invalidNormalized: number;
	wouldInsert: number;
	inserted: number;
	rejections: CandidateRejection[];
}

function isValidDate(value: unknown) {
	return value instanceof Date && !Number.isNaN(value.getTime());
}

export async function ingestEventCandidates(
	candidates: readonly EventCandidate[],
	options: { mode: IngestionMode },
): Promise<IngestionResult> {
	assertWriteAllowed(options.mode);
	const validation = validateEventCandidates(candidates);
	const normalized = validation.accepted.map(normalizeHackathon);
	const validNormalized = normalized.filter((event) => {
		if (event.startDate && !isValidDate(event.startDate)) return false;
		if (event.endDate && !isValidDate(event.endDate)) return false;
		if (
			event.registrationDeadline &&
			!isValidDate(event.registrationDeadline)
		) {
			return false;
		}
		return true;
	});

	const newEvents = await deduplicateAgainstDB(validNormalized);
	let inserted = 0;

	if (options.mode === "write" && newEvents.length > 0) {
		const rows = await db
			.insert(events)
			.values(newEvents)
			.onConflictDoNothing()
			.returning({ id: events.id });
		inserted = rows.length;
	}

	return {
		mode: options.mode,
		candidates: candidates.length,
		accepted: validation.accepted.length,
		rejected: validation.rejected.length,
		normalized: validNormalized.length,
		invalidNormalized: normalized.length - validNormalized.length,
		wouldInsert: newEvents.length,
		inserted,
		rejections: validation.rejected,
	};
}
