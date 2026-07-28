import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { validateEventCandidates } from "@/lib/ingestion/candidate";
import type { EventCandidate } from "@/lib/ingestion/types";

describe("validateEventCandidates", () => {
	test("accepts a valid source-neutral candidate", () => {
		const candidate: EventCandidate = {
			name: "LATAM AI Builders",
			sourceType: "luma_router",
			sourceUrl: "https://luma.com/latam-ai-builders",
			startDate: "2026-08-10T18:00:00-05:00",
			country: "PE",
			city: "Lima",
		};

		const result = validateEventCandidates([candidate]);

		assert.equal(result.accepted.length, 1);
		assert.equal(result.rejected.length, 0);
	});

	test("rejects malformed URLs and dates without exposing raw data", () => {
		const candidate = {
			name: "Broken event",
			sourceType: "devpost",
			sourceUrl: "not-a-url",
			startDate: "not-a-date",
			raw: { token: "must-not-appear" },
		} as EventCandidate;

		const result = validateEventCandidates([candidate]);

		assert.equal(result.accepted.length, 0);
		assert.equal(result.rejected.length, 1);
		assert.equal(
			result.rejected[0].issues.join(" ").includes("must-not-appear"),
			false,
		);
	});

	test("keeps candidate order while reporting rejected indexes", () => {
		const valid: EventCandidate = {
			name: "Valid event",
			sourceType: "peruanos_dev",
			sourceUrl: "https://peruanos.dev/events/valid",
		};
		const invalid = {
			name: "",
			sourceType: "other",
			sourceUrl: "https://example.com/invalid",
		} as EventCandidate;

		const result = validateEventCandidates([invalid, valid]);

		assert.equal(result.accepted[0].name, "Valid event");
		assert.equal(result.rejected[0].index, 0);
	});
});
