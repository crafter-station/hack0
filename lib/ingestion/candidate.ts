import { z } from "zod";
import { EVENT_SOURCE_TYPES, type EventCandidate } from "@/lib/ingestion/types";

const optionalDateString = z
	.string()
	.refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

const optionalUrl = z.string().url();

export const eventCandidateSchema = z
	.object({
		name: z.string().trim().min(1).max(500),
		sourceUrl: z.string().url(),
		sourceType: z.enum(EVENT_SOURCE_TYPES),
		externalId: z.string().trim().min(1).optional(),
		description: z.string().optional(),
		startDate: optionalDateString.optional(),
		endDate: optionalDateString.optional(),
		registrationDeadline: optionalDateString.optional(),
		timezone: z.string().trim().min(1).optional(),
		websiteUrl: optionalUrl.optional(),
		registrationUrl: optionalUrl.optional(),
		imageUrl: optionalUrl.optional(),
		bannerUrl: optionalUrl.optional(),
		scopeHint: z.enum(["latam", "global"]).optional(),
		classifyConfidence: z.number().min(0).max(100).optional(),
		discoveredAt: optionalDateString.optional(),
	})
	.passthrough();

export interface CandidateRejection {
	index: number;
	name: string | null;
	sourceUrl: string | null;
	issues: string[];
}

export interface CandidateValidationResult {
	accepted: EventCandidate[];
	rejected: CandidateRejection[];
}

export function validateEventCandidates(
	candidates: readonly EventCandidate[],
): CandidateValidationResult {
	const accepted: EventCandidate[] = [];
	const rejected: CandidateRejection[] = [];

	for (const [index, candidate] of candidates.entries()) {
		const parsed = eventCandidateSchema.safeParse(candidate);
		if (parsed.success) {
			accepted.push(parsed.data as EventCandidate);
			continue;
		}

		rejected.push({
			index,
			name: typeof candidate.name === "string" ? candidate.name : null,
			sourceUrl:
				typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : null,
			issues: parsed.error.issues.map((issue) => {
				const path = issue.path.join(".");
				return path ? `${path}: ${issue.message}` : issue.message;
			}),
		});
	}

	return { accepted, rejected };
}
