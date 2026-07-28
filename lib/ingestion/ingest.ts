import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import {
	type CandidateRejection,
	validateEventCandidates,
} from "@/lib/ingestion/candidate";
import {
	type ConsistencyIssue,
	checkEventConsistency,
} from "@/lib/ingestion/consistency";
import { assertWriteAllowed, type IngestionMode } from "@/lib/ingestion/safety";
import type { EventCandidate } from "@/lib/ingestion/types";
import {
	type DeduplicationDecision,
	type DeduplicationReason,
	deduplicateAgainstDBWithReport,
} from "@/lib/scraper/deduplicator";
import { normalizeHackathon } from "@/lib/scraper/normalizer";

const REPORT_LIMIT = 100;

export interface IngestionDecision {
	name: string;
	action: "insert" | "skip" | "review" | "reject";
	reason: DeduplicationReason | "consistency";
	matchedEventId?: string;
	matchedEventName?: string;
	issues?: ConsistencyIssue[];
	evidence?: DeduplicationDecision["evidence"];
}

export interface IngestionResult {
	mode: IngestionMode;
	candidates: number;
	accepted: number;
	rejected: number;
	normalized: number;
	invalidNormalized: number;
	consistencyRejected: number;
	consistencyWarnings: number;
	duplicates: number;
	needsReview: number;
	wouldInsert: number;
	inserted: number;
	rejections: CandidateRejection[];
	decisions: IngestionDecision[];
	reportTruncated: boolean;
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

	const consistency = validNormalized.map((event) => ({
		event,
		result: checkEventConsistency(event),
	}));
	const eligibleWithConsistency = consistency
		.filter(({ result }) => result.status === "valid")
		.map(({ event, result }) => ({ event, issues: result.issues }));
	const eligible = eligibleWithConsistency.map(({ event }) => event);
	const consistencyDecisions: IngestionDecision[] = consistency
		.filter(({ result }) => result.status !== "valid")
		.map(({ event, result }) => ({
			name: event.name,
			action: result.status === "reject" ? "reject" : "review",
			reason: "consistency",
			issues: result.issues,
		}));

	const deduplication = await deduplicateAgainstDBWithReport(eligible);
	const decisions: IngestionDecision[] = [
		...consistencyDecisions,
		...deduplication.decisions.map((decision) => {
			const issues = eligibleWithConsistency[decision.index]?.issues;
			return {
				name: decision.name,
				action: decision.action,
				reason: decision.reason,
				matchedEventId: decision.matchedEventId,
				matchedEventName: decision.matchedEventName,
				issues: issues?.length ? issues : undefined,
				evidence: decision.evidence,
			};
		}),
	];
	let inserted = 0;

	if (options.mode === "write" && deduplication.newEvents.length > 0) {
		const rows = await db
			.insert(events)
			.values(deduplication.newEvents)
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
		consistencyRejected: consistency.filter(
			({ result }) => result.status === "reject",
		).length,
		consistencyWarnings: consistency.reduce(
			(total, { result }) =>
				total +
				result.issues.filter((issue) => issue.severity === "warning").length,
			0,
		),
		duplicates: deduplication.summary.duplicates,
		needsReview:
			consistency.filter(({ result }) => result.status === "review").length +
			deduplication.summary.needsReview,
		wouldInsert: deduplication.summary.new,
		inserted,
		rejections: validation.rejected,
		decisions: decisions.slice(0, REPORT_LIMIT),
		reportTruncated: decisions.length > REPORT_LIMIT,
	};
}
