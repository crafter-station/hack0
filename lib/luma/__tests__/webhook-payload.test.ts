import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseLumaWebhookPayload } from "@/lib/luma/webhook-payload";

describe("parseLumaWebhookPayload", () => {
	test("normalizes the current Luma event ID into the legacy internal field", () => {
		const payload = parseLumaWebhookPayload(
			JSON.stringify({
				type: "event.created",
				data: {
					platform: "luma",
					id: "evt-current-id",
					name: "LATAM Builders Day",
					url: "https://luma.com/builders-day",
					start_at: "2026-09-01T14:00:00Z",
					end_at: "2026-09-01T18:00:00Z",
					timezone: "America/Lima",
					cover_url: "https://images.lumacdn.com/example.png",
				},
			}),
		);

		assert.equal(payload?.data.id, "evt-current-id");
		assert.equal(payload?.data.api_id, "evt-current-id");
	});

	test("normalizes nullable fields on an external calendar listing", () => {
		const payload = parseLumaWebhookPayload(
			JSON.stringify({
				type: "calendar.event.added",
				data: {
					platform: "external",
					id: "calevt-external",
					name: "External Hack0 Event",
					url: "https://hack0.dev/e/example",
					start_at: "2026-09-01T14:00:00-05:00",
					end_at: null,
					timezone: null,
				},
			}),
		);

		assert.equal(payload?.data.api_id, "calevt-external");
		assert.equal(payload?.data.end_at, "2026-09-01T14:00:00-05:00");
		assert.equal(payload?.data.timezone, "UTC");
		assert.equal(payload?.data.cover_url, null);
	});

	test("rejects malformed JSON and incomplete event data", () => {
		assert.equal(parseLumaWebhookPayload("{"), null);
		assert.equal(
			parseLumaWebhookPayload(
				JSON.stringify({
					type: "event.updated",
					data: { id: "evt-incomplete" },
				}),
			),
			null,
		);
	});
});
