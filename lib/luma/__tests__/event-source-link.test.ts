import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildEventSourceIdentityKey } from "@/lib/ingestion/source-link";

describe("buildEventSourceIdentityKey", () => {
	test("builds one stable identity for a provider origin", () => {
		assert.equal(
			buildEventSourceIdentityKey({
				provider: " LUMA ",
				linkType: "origin",
				externalId: " EVT-ABC ",
			}),
			"luma:origin:_:evt-abc",
		);
	});

	test("separates listings of the same event in different calendars", () => {
		const first = buildEventSourceIdentityKey({
			provider: "luma",
			linkType: "calendar_listing",
			externalId: "evt-abc",
			calendarExternalId: "cal-hack0",
		});
		const second = buildEventSourceIdentityKey({
			provider: "luma",
			linkType: "calendar_listing",
			externalId: "evt-abc",
			calendarExternalId: "cal-community",
		});

		assert.equal(first, "luma:calendar_listing:cal-hack0:evt-abc");
		assert.equal(second, "luma:calendar_listing:cal-community:evt-abc");
		assert.notEqual(first, second);
	});

	test("requires a calendar for a listing identity", () => {
		assert.throws(
			() =>
				buildEventSourceIdentityKey({
					provider: "luma",
					linkType: "calendar_listing",
					externalId: "evt-abc",
				}),
			/calendarExternalId/,
		);
	});

	test("rejects blank provider and external IDs", () => {
		assert.throws(
			() =>
				buildEventSourceIdentityKey({
					provider: " ",
					linkType: "origin",
					externalId: "evt-abc",
				}),
			/provider/,
		);
		assert.throws(
			() =>
				buildEventSourceIdentityKey({
					provider: "luma",
					linkType: "origin",
					externalId: " ",
				}),
			/externalId/,
		);
	});

	test("rejects provider IDs that exceed schema limits", () => {
		assert.throws(
			() =>
				buildEventSourceIdentityKey({
					provider: "luma",
					linkType: "origin",
					externalId: "x".repeat(256),
				}),
			/255/,
		);
	});
});
