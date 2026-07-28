import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { inferLatamLocationFromText } from "@/lib/geo/latam-location";
import { getEventSourceSuppression } from "@/lib/ingestion/manual-overrides";
import { resolveLumaEventLocation } from "@/lib/luma/location";

describe("inferLatamLocationFromText", () => {
	test("uses the longest matching place name", () => {
		assert.deepEqual(inferLatamLocationFromText("Café Cursor Nova Lima"), {
			country: "BR",
			city: "Nova Lima",
		});
	});

	test("infers countries and cities used by Luma titles", () => {
		assert.deepEqual(
			inferLatamLocationFromText("[Ciudad de Guatemala] Full day Hackathon"),
			{ country: "GT", city: "Ciudad de Guatemala" },
		);
		assert.deepEqual(
			inferLatamLocationFromText("[El Salvador] Full day Hackathon"),
			{ country: "SV", city: null },
		);
	});
});

describe("resolveLumaEventLocation", () => {
	test("prefers a LATAM place in the title over the country fallback", () => {
		assert.deepEqual(
			resolveLumaEventLocation({
				eventName: "[Bogotá] Full day Hackathon",
				countryFallback: "PE",
			}),
			{
				format: "in-person",
				country: "CO",
				department: null,
				city: "Bogotá",
				venue: null,
				geoLatitude: null,
				geoLongitude: null,
			},
		);
	});
});

describe("getEventSourceSuppression", () => {
	test("matches canonical Luma URL aliases and tracking parameters", () => {
		const suppression = getEventSourceSuppression(
			"https://www.lu.ma/hveetdob?utm_source=test",
		);

		assert.equal(
			suppression?.canonicalEventId,
			"19846e8e-c0aa-49d2-a5d9-f0c6546e7407",
		);
	});

	test("does not suppress unrelated sources", () => {
		assert.equal(getEventSourceSuppression("https://luma.com/yn7nc6id"), null);
	});
});
