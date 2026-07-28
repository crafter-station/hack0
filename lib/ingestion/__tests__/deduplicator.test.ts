import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { NewEvent } from "@/lib/db/schema/events";
import {
	auditEventCollection,
	type ComparableEvent,
	canonicalizeEventUrl,
	deduplicateEvents,
	eventNameSimilarity,
} from "@/lib/scraper/deduplicator";

function event(overrides: Partial<NewEvent> = {}): NewEvent {
	return {
		name: "LATAM AI Hackathon",
		slug: "latam-ai-hackathon",
		websiteUrl: "https://example.com/events/latam-ai",
		organizationId: "00000000-0000-0000-0000-000000000001",
		startDate: new Date("2026-08-10T14:00:00Z"),
		format: "in-person",
		country: "PE",
		city: "Lima",
		scrapeSource: "devpost",
		scrapeSourceUrl: "https://latam-ai.devpost.com/",
		scrapeRawData: { externalId: "latam-ai" },
		...overrides,
	};
}

function existing(overrides: Partial<ComparableEvent> = {}): ComparableEvent {
	return {
		...event(),
		id: "event-existing",
		...overrides,
	};
}

describe("canonicalizeEventUrl", () => {
	test("removes tracking data and normalizes Luma host aliases", () => {
		assert.equal(
			canonicalizeEventUrl(
				"https://www.lu.ma/latam-ai/?utm_source=newsletter&b=2&a=1#top",
			),
			"luma.com/latam-ai?a=1&b=2",
		);
	});

	test("keeps meaningful query parameters", () => {
		assert.equal(
			canonicalizeEventUrl("https://events.example.com/view?id=42&utm_x=1"),
			"events.example.com/view?id=42",
		);
	});
});

describe("eventNameSimilarity", () => {
	test("handles accents and token order", () => {
		assert.ok(
			eventNameSimilarity("Perú AI Hackathon 2026", "Hackathon AI Peru 2026") >=
				0.9,
		);
	});
});

describe("deduplicateEvents", () => {
	test("skips the same provider external id", () => {
		const report = deduplicateEvents(
			[
				event({
					websiteUrl: "https://another.example.com/event",
					scrapeSourceUrl: "https://another.devpost.com",
				}),
			],
			[existing()],
		);

		assert.equal(report.summary.duplicates, 1);
		assert.equal(report.decisions[0].reason, "source_external_id");
	});

	test("skips canonical URL variants", () => {
		const report = deduplicateEvents(
			[
				event({
					scrapeRawData: null,
					scrapeSource: "exa_discovery",
					websiteUrl: "https://example.com/events/latam-ai/?utm_source=exa",
				}),
			],
			[
				existing({
					scrapeRawData: null,
					scrapeSource: "other",
					scrapeSourceUrl: null,
				}),
			],
		);

		assert.equal(report.summary.duplicates, 1);
		assert.equal(report.decisions[0].reason, "canonical_url");
	});

	test("holds reused URLs with conflicting dates for review", () => {
		const report = deduplicateEvents(
			[
				event({
					scrapeRawData: null,
					scrapeSource: "exa_discovery",
					startDate: new Date("2027-08-10T14:00:00Z"),
				}),
			],
			[
				existing({
					scrapeRawData: null,
					scrapeSource: "other",
					scrapeSourceUrl: null,
				}),
			],
		);

		assert.equal(report.summary.needsReview, 1);
		assert.equal(report.summary.duplicates, 0);
		assert.equal(report.decisions[0].reason, "canonical_url_date_conflict");
	});

	test("uses name, date, and location together for a high-confidence match", () => {
		const report = deduplicateEvents(
			[
				event({
					name: "Hackathon AI LATAM",
					websiteUrl: "https://different.example.com/ai",
					scrapeSourceUrl: "https://different.example.com/source",
					scrapeRawData: null,
				}),
			],
			[
				existing({
					scrapeRawData: null,
					scrapeSourceUrl: null,
				}),
			],
		);

		assert.equal(report.summary.duplicates, 1);
		assert.equal(report.decisions[0].reason, "name_date_location");
	});

	test("does not merge similar events in different countries", () => {
		const report = deduplicateEvents(
			[
				event({
					websiteUrl: "https://mexico.example.com/ai",
					scrapeSourceUrl: "https://mexico.example.com/source",
					scrapeRawData: null,
					country: "MX",
					city: "Ciudad de Mexico",
				}),
			],
			[
				existing({
					scrapeRawData: null,
					scrapeSourceUrl: null,
				}),
			],
		);

		assert.equal(report.summary.new, 1);
		assert.equal(report.summary.duplicates, 0);
	});

	test("holds an uncertain name and date match for review", () => {
		const report = deduplicateEvents(
			[
				event({
					name: "LATAM AI Hackathon 2026",
					websiteUrl: "https://different.example.com/ai",
					scrapeSourceUrl: "https://different.example.com/source",
					scrapeRawData: null,
					country: null,
					city: null,
				}),
			],
			[
				existing({
					scrapeRawData: null,
					scrapeSourceUrl: null,
					country: null,
					city: null,
				}),
			],
		);

		assert.equal(report.summary.needsReview, 1);
		assert.equal(report.summary.new, 0);
	});

	test("treats a repeated batch as idempotent", () => {
		const first = deduplicateEvents(
			[
				event(),
				event({
					name: "Lima Web3 Day",
					slug: "lima-web3-day",
					websiteUrl: "https://example.com/events/web3",
					scrapeSourceUrl: "https://lima-web3.devpost.com",
					scrapeRawData: { externalId: "lima-web3" },
				}),
			],
			[],
		);
		const second = deduplicateEvents(
			first.newEvents,
			first.newEvents.map((item, index) => ({
				...item,
				id: `persisted:${index}`,
			})),
		);

		assert.equal(first.summary.new, 2);
		assert.equal(second.summary.new, 0);
		assert.equal(second.summary.duplicates, 2);
	});

	test("does not use a shared slug as proof of a duplicate", () => {
		const report = deduplicateEvents(
			[
				event({
					websiteUrl: "https://example.com/latam-ai-2027",
					scrapeSourceUrl: "https://latam-ai-2027.devpost.com",
					scrapeRawData: { externalId: "latam-ai-2027" },
					startDate: new Date("2027-08-10T14:00:00Z"),
				}),
			],
			[existing()],
		);

		assert.equal(report.summary.new, 1);
		assert.notEqual(report.newEvents[0].slug, "latam-ai-hackathon");
	});
});

describe("auditEventCollection", () => {
	test("reports exact and possible duplicates without changing input", () => {
		const collection: ComparableEvent[] = [
			existing(),
			existing({ id: "exact-copy" }),
			existing({
				id: "possible-copy",
				scrapeRawData: null,
				scrapeSourceUrl: "https://different.example.com/source",
				websiteUrl: "https://different.example.com/event",
				country: null,
				city: null,
			}),
		];

		const report = auditEventCollection(collection);

		assert.equal(report.summary.total, 3);
		assert.equal(report.summary.duplicates, 1);
		assert.equal(report.summary.needsReview, 1);
		assert.equal(collection.length, 3);
	});
});
