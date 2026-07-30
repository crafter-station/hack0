import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { deduplicateEvents } from "@/lib/scraper/deduplicator";
import { normalizeHackathon } from "@/lib/scraper/normalizer";
import {
	eventRouterEligibility,
	eventRouterEventToCandidate,
	fetchEventRouterCandidates,
} from "@/lib/scraper/sources/event-router";

function event(overrides: Record<string, unknown> = {}) {
	return {
		id: "evt-router-1",
		name: "AI Builders Lima",
		coverUrl: "https://images.example.com/event.jpg",
		url: "https://lu.ma/ai-builders",
		startAt: "2026-08-10T23:00:00.000Z",
		endAt: "2026-08-11T02:00:00.000Z",
		temporalStatus: "upcoming" as const,
		city: "Lima, Peru",
		description: "Builders meetup",
		externalIds: {
			lumaEventId: "evt-luma-1",
			scrapedEventKeys: [],
		},
		sources: [
			{
				provider: "luma" as const,
				sourceType: "api",
				sourceKey: "api:cal-owned:evt-luma-1",
				calendarId: "cal-owned",
				calendarName: "Founder Dinners",
				sourceUrl: "https://lu.ma/ai-builders",
				externalEventId: "evt-luma-1",
				hostName: "Hack0",
				lastSyncedAt: "2026-07-28T14:00:00.000Z",
			},
		],
		sourceCount: 1,
		sourceCalendars: [
			{
				calendarId: "cal-owned",
				name: "Founder Dinners",
				slug: "founder-dinners",
				source: "api" as const,
				provider: "luma" as const,
				ownership: "connected" as const,
			},
		],
		tags: ["AI"],
		suggestedTags: ["Builders"],
		calendar: null,
		...overrides,
	};
}

function page(
	events: unknown[],
	nextCursor: string | null,
	offset = 0,
	total = events.length,
) {
	return {
		events,
		page: { limit: 200, offset, total, nextCursor },
		mode: "canonical",
		generatedAt: "2026-07-28T14:00:00.000Z",
	};
}

describe("eventRouterEventToCandidate", () => {
	test("preserves provider identity, ownership evidence, and LATAM location", () => {
		const candidate = eventRouterEventToCandidate(
			event(),
			"2026-07-28T14:00:00.000Z",
		);

		assert.equal(candidate.sourceType, "luma_router");
		assert.equal(candidate.externalId, "luma:evt-luma-1");
		assert.equal(candidate.country, "PE");
		assert.equal(candidate.city, "Lima");
		assert.equal(candidate.scopeHint, "latam");
		assert.deepEqual(candidate.organizers, [
			{ name: "Founder Dinners" },
			{ name: "Hack0" },
		]);
		assert.equal(
			(candidate.raw as { ownership: string }).ownership,
			"connected",
		);
	});

	test("namespaces external ids by provider", () => {
		const candidate = eventRouterEventToCandidate(
			event({
				externalIds: {
					eventbriteEventId: "123",
					scrapedEventKeys: [],
				},
				sources: [
					{
						provider: "eventbrite",
						sourceType: "eventbrite_api",
						sourceKey: "eventbrite_api:cal-owned:123",
						calendarId: "cal-owned",
						calendarName: "Tech Events",
						sourceUrl: "https://eventbrite.com/e/123",
						externalEventId: "123",
						hostName: "Tech Events",
					},
				],
				sourceCalendars: [
					{
						calendarId: "cal-owned",
						name: "Tech Events",
						slug: null,
						source: "api",
						provider: "eventbrite",
						ownership: "connected",
					},
				],
			}),
			"2026-07-28T14:00:00.000Z",
		);

		assert.equal(candidate.externalId, "eventbrite:123");
	});

	test("is idempotent for a repeated router provider identity", () => {
		const candidate = eventRouterEventToCandidate(
			event(),
			"2026-07-28T14:00:00.000Z",
		);
		const first = normalizeHackathon(candidate);
		const repeated = normalizeHackathon(candidate);
		const report = deduplicateEvents([first, repeated], []);

		assert.equal(report.summary.new, 1);
		assert.equal(report.summary.duplicates, 1);
		assert.equal(report.decisions[1].reason, "source_external_id");
	});

	test("accepts Spanish online events as LATAM scope", () => {
		const onlineEvent = event({
			name: "IA para todos",
			description: "Encuentro virtual para builders",
			city: null,
			enrichment: {
				countryCode: null,
				languageCode: "es",
				languages: ["Español"],
				isOnline: true,
				format: "online",
				topics: ["AI"],
			},
		});
		const eligibility = eventRouterEligibility(onlineEvent);
		const candidate = eventRouterEventToCandidate(
			onlineEvent,
			"2026-07-28T14:00:00.000Z",
		);

		assert.equal(eligibility.accepted, true);
		assert.equal(eligibility.reason, "online_spanish");
		assert.equal(candidate.modality, "virtual");
		assert.equal(candidate.scopeHint, "latam");
		assert.ok(candidate.themes?.includes("Latam"));
	});

	test("rejects physical events outside LATAM and non-Spanish online events", () => {
		assert.deepEqual(
			eventRouterEligibility(
				event({
					name: "Madrid Tech Night",
					city: "Madrid, Spain",
					enrichment: {
						countryCode: "ES",
						languageCode: "es",
						isOnline: false,
						format: "in_person",
					},
				}),
			),
			{
				accepted: false,
				reason: "outside_latam",
				countryCode: "ES",
				city: "Madrid, Spain",
				isOnline: false,
			},
		);
		assert.equal(
			eventRouterEligibility(
				event({
					name: "Global AI Online",
					description: "Online event for global builders",
					city: null,
					enrichment: {
						languageCode: "en",
						isOnline: true,
						format: "online",
					},
				}),
			).reason,
			"online_not_spanish",
		);
	});
});

describe("fetchEventRouterCandidates", () => {
	test("paginates with a stable reference time", async () => {
		const requestedUrls: URL[] = [];
		const responses = [
			page([event()], "next-page", 0, 2),
			page(
				[
					event({
						id: "evt-router-2",
						name: "Tech Night Bogota",
						url: "https://lu.ma/tech-bogota",
						city: "Bogota, Colombia",
					}),
				],
				null,
				1,
				2,
			),
		];
		const fetchImpl = (async (input: string | URL | Request) => {
			requestedUrls.push(new URL(input.toString()));
			return Response.json(responses.shift());
		}) as typeof fetch;

		const result = await fetchEventRouterCandidates({
			baseUrl: "https://router.example",
			token: "test-token",
			fetchImpl,
		});

		assert.equal(result.candidates.length, 2);
		assert.equal(result.metadata.pages, 2);
		assert.equal(requestedUrls[1].searchParams.get("cursor"), "next-page");
		assert.equal(
			requestedUrls[1].searchParams.get("at"),
			"2026-07-28T14:00:00.000Z",
		);
	});

	test("reports malformed events without rejecting the valid page", async () => {
		const fetchImpl = (async () =>
			Response.json(
				page([event(), event({ url: "not-a-url" })], null, 0, 2),
			)) as typeof fetch;

		const result = await fetchEventRouterCandidates({
			baseUrl: "https://router.example",
			token: "test-token",
			fetchImpl,
		});

		assert.equal(result.candidates.length, 1);
		assert.equal(result.rejections.length, 1);
		assert.match(result.rejections[0].issues.join(" "), /url/);
	});

	test("reports valid events excluded by the LATAM policy", async () => {
		const fetchImpl = (async () =>
			Response.json(
				page(
					[
						event(),
						event({
							name: "London Tech Night",
							city: "London, UK",
							url: "https://lu.ma/london-tech",
							enrichment: {
								countryCode: "GB",
								languageCode: "en",
								isOnline: false,
							},
						}),
					],
					null,
					0,
					2,
				),
			)) as typeof fetch;

		const result = await fetchEventRouterCandidates({
			baseUrl: "https://router.example",
			token: "test-token",
			fetchImpl,
		});

		assert.equal(result.candidates.length, 1);
		assert.equal(result.exclusions.length, 1);
		assert.equal(result.exclusions[0].reason, "outside_latam");
	});

	test("allows the terminal page to match the page safety limit", async () => {
		const responses = [
			page([event()], "next-page", 0, 2),
			page([event({ id: "evt-router-2" })], null, 1, 2),
		];
		const fetchImpl = (async () =>
			Response.json(responses.shift())) as typeof fetch;

		const result = await fetchEventRouterCandidates({
			baseUrl: "https://router.example",
			token: "test-token",
			fetchImpl,
			maxPages: 2,
		});

		assert.equal(result.metadata.pages, 2);
	});

	test("does not include the token in HTTP errors", async () => {
		const fetchImpl = (async () =>
			new Response(null, { status: 401 })) as typeof fetch;

		await assert.rejects(
			fetchEventRouterCandidates({
				baseUrl: "https://router.example",
				token: "secret-token",
				fetchImpl,
			}),
			(error: Error) => {
				assert.match(error.message, /HTTP 401/);
				assert.doesNotMatch(error.message, /secret-token/);
				return true;
			},
		);
	});
});
