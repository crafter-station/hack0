import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	buildExternalCalendarListing,
	durationToIsoInterval,
	LumaCalendarPublisherClient,
	lumaEventSlugFromUrl,
	prepareLumaCalendarListing,
} from "@/lib/luma/calendar-publisher";

const baseEvent = {
	id: "event-1",
	name: "Hack0 Builders",
	websiteUrl: "https://hack0.dev/e/builders",
	registrationUrl: "https://example.com/register",
	startDate: new Date("2026-08-10T14:00:00.000Z"),
	endDate: new Date("2026-08-10T16:30:00.000Z"),
	timezone: "America/Lima",
	format: "in-person" as const,
	venue: "UTEC",
	city: "Lima",
	country: "PE",
	geoLatitude: "-12.135",
	geoLongitude: "-77.022",
};

describe("lumaEventSlugFromUrl", () => {
	test("recognizes current and legacy Luma event URLs", () => {
		assert.equal(lumaEventSlugFromUrl("https://luma.com/ai-lima"), "ai-lima");
		assert.equal(
			lumaEventSlugFromUrl("https://lu.ma/ai-lima?tk=abc"),
			"ai-lima",
		);
	});

	test("ignores non-event URLs", () => {
		assert.equal(lumaEventSlugFromUrl("https://example.com/ai-lima"), null);
		assert.equal(lumaEventSlugFromUrl("https://luma.com/calendar/hack0"), null);
	});
});

describe("durationToIsoInterval", () => {
	test("preserves multi-day durations", () => {
		assert.deepEqual(
			durationToIsoInterval(
				new Date("2026-08-10T14:00:00.000Z"),
				new Date("2026-08-12T16:30:00.000Z"),
			),
			{ interval: "P2DT2H30M", inferred: false },
		);
	});

	test("defaults missing or invalid end dates to one hour", () => {
		assert.deepEqual(
			durationToIsoInterval(new Date("2026-08-10T14:00:00.000Z"), null),
			{ interval: "PT1H", inferred: true },
		);
		assert.deepEqual(
			durationToIsoInterval(
				new Date("2026-08-10T14:00:00.000Z"),
				new Date("2026-08-10T13:00:00.000Z"),
			),
			{ interval: "PT1H", inferred: true },
		);
	});
});

describe("buildExternalCalendarListing", () => {
	test("maps a Hack0 event to Luma's external listing contract", () => {
		assert.deepEqual(buildExternalCalendarListing(baseEvent), {
			sourceUrl: "https://example.com/register",
			durationInferred: false,
			payload: {
				platform: "external",
				submission_mode: "auto",
				url: "https://example.com/register",
				name: "Hack0 Builders",
				start_at: "2026-08-10T14:00:00.000Z",
				duration_interval: "PT2H30M",
				timezone: "America/Lima",
				geo_address_json: {
					type: "manual",
					address: "UTEC, Lima, PE",
				},
				coordinate: {
					latitude: -12.135,
					longitude: -77.022,
				},
			},
		});
	});

	test("requires a start date", () => {
		assert.throws(
			() => buildExternalCalendarListing({ ...baseEvent, startDate: null }),
			/start date/,
		);
	});

	test("does not send a physical address for virtual events", () => {
		const prepared = buildExternalCalendarListing({
			...baseEvent,
			format: "virtual",
		});
		assert.equal("geo_address_json" in prepared.payload, false);
		assert.equal("coordinate" in prepared.payload, false);
	});
});

describe("prepareLumaCalendarListing", () => {
	test("uses the native Luma identity for Luma event URLs", async () => {
		const prepared = await prepareLumaCalendarListing(
			{
				...baseEvent,
				registrationUrl: "https://luma.com/ai-lima",
			},
			{
				resolveLumaEventId: async () => "evt-ai-lima",
			},
		);

		assert.deepEqual(prepared, {
			sourceUrl: "https://luma.com/ai-lima",
			durationInferred: false,
			payload: {
				platform: "luma",
				submission_mode: "auto",
				event_id: "evt-ai-lima",
			},
		});
	});

	test("does not downgrade unresolved Luma URLs to external listings", async () => {
		await assert.rejects(
			prepareLumaCalendarListing(
				{
					...baseEvent,
					registrationUrl: "https://luma.com/unknown-event",
				},
				{
					resolveLumaEventId: async () => null,
				},
			),
			/Could not resolve/,
		);
	});
});

describe("LumaCalendarPublisherClient", () => {
	test("uses the official calendar lookup and add endpoints", async () => {
		const requests: Array<{ url: string; init?: RequestInit }> = [];
		const fakeFetch = (async (
			input: string | URL | Request,
			init?: RequestInit,
		) => {
			const url = input.toString();
			requests.push({ url, init });
			if (url.endsWith("/v1/calendars/get")) {
				return Response.json({
					id: "cal-hack0",
					name: "Hack0",
					slug: "hack0",
					url: "https://luma.com/hack0",
				});
			}
			if (url.includes("/v1/calendars/events/lookup?")) {
				return Response.json({ event: null });
			}
			if (url.endsWith("/v1/calendars/events/add")) {
				return Response.json({ id: "listing-1", status: "approved" });
			}
			return new Response(null, { status: 404 });
		}) as typeof fetch;
		const client = new LumaCalendarPublisherClient("secret-key", fakeFetch);
		const prepared = buildExternalCalendarListing(baseEvent);

		assert.equal((await client.getCalendar()).id, "cal-hack0");
		assert.equal((await client.lookupEvent(prepared.payload)).event, null);
		assert.equal((await client.addEvent(prepared.payload)).id, "listing-1");

		assert.equal(
			requests[1]?.url,
			"https://public-api.luma.com/v1/calendars/events/lookup?platform=external&url=https%3A%2F%2Fexample.com%2Fregister",
		);
		assert.equal(
			requests[2]?.url,
			"https://public-api.luma.com/v1/calendars/events/add",
		);
		assert.equal(requests[2]?.init?.method, "POST");
		const headers = new Headers(requests[2]?.init?.headers);
		assert.equal(headers.get("x-luma-api-key"), "secret-key");
		assert.deepEqual(
			JSON.parse(String(requests[2]?.init?.body)),
			prepared.payload,
		);
	});

	test("surfaces non-successful Luma responses", async () => {
		const fakeFetch = (async () =>
			new Response('{"error":"forbidden"}', { status: 403 })) as typeof fetch;
		const client = new LumaCalendarPublisherClient("secret-key", fakeFetch);

		await assert.rejects(client.getCalendar(), /Luma API returned 403/);
	});
});
