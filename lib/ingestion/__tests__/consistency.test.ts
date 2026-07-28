import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { NewEvent } from "@/lib/db/schema/events";
import { checkEventConsistency } from "@/lib/ingestion/consistency";

function event(overrides: Partial<NewEvent> = {}): NewEvent {
	return {
		name: "LATAM Builders Day",
		slug: "latam-builders-day",
		websiteUrl: "https://example.com/latam-builders-day",
		organizationId: "00000000-0000-0000-0000-000000000001",
		startDate: new Date("2026-08-10T14:00:00Z"),
		endDate: new Date("2026-08-10T18:00:00Z"),
		format: "virtual",
		...overrides,
	};
}

describe("checkEventConsistency", () => {
	test("accepts a complete event", () => {
		const result = checkEventConsistency(event());

		assert.equal(result.status, "valid");
		assert.equal(result.issues.length, 0);
	});

	test("holds undated events for review", () => {
		const result = checkEventConsistency(event({ startDate: null }));

		assert.equal(result.status, "review");
		assert.equal(result.issues[0].code, "missing_start_date");
	});

	test("rejects an end date before the start date", () => {
		const result = checkEventConsistency(
			event({ endDate: new Date("2026-08-09T18:00:00Z") }),
		);

		assert.equal(result.status, "reject");
		assert.equal(result.issues[0].code, "end_before_start");
	});

	test("warns about an in-person event without a location", () => {
		const result = checkEventConsistency(
			event({ format: "in-person", country: null, city: null }),
		);

		assert.equal(result.status, "valid");
		assert.equal(result.issues[0].severity, "warning");
	});

	test("holds a country contradiction for review", () => {
		const result = checkEventConsistency(
			event({
				name: "[Bogotá] Full Day Hackathon",
				country: "PE",
				city: null,
			}),
		);

		assert.equal(result.status, "review");
		assert.equal(result.issues[0].code, "country_name_mismatch");
	});

	test("uses the longest city name when locations overlap", () => {
		const result = checkEventConsistency(
			event({
				name: "Café Cursor Nova Lima",
				country: "BR",
				city: "Nova Lima",
			}),
		);

		assert.equal(result.status, "valid");
		assert.equal(result.issues.length, 0);
	});
});
