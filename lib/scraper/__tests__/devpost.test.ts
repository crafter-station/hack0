import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	normalizeDevpostAssetUrl,
	parseDevpostDateRange,
	parseDevpostDetailPage,
} from "@/lib/scraper/sources/devpost";

describe("parseDevpostDateRange", () => {
	test("normalizes same-month ranges", () => {
		assert.deepEqual(parseDevpostDateRange("Jul 27 - 31, 2026"), {
			startDate: "2026-07-27T00:00:00.000Z",
			endDate: "2026-07-31T00:00:00.000Z",
		});
	});

	test("normalizes cross-month ranges", () => {
		assert.deepEqual(parseDevpostDateRange("Jul 27 - Aug 14, 2026"), {
			startDate: "2026-07-27T00:00:00.000Z",
			endDate: "2026-08-14T00:00:00.000Z",
		});
	});

	test("infers the previous year for ranges crossing January", () => {
		assert.deepEqual(parseDevpostDateRange("Dec 27 - Jan 4, 2027"), {
			startDate: "2026-12-27T00:00:00.000Z",
			endDate: "2027-01-04T00:00:00.000Z",
		});
	});

	test("uses a single date for one-day events", () => {
		assert.deepEqual(parseDevpostDateRange("Jul 28, 2026"), {
			startDate: "2026-07-28T00:00:00.000Z",
			endDate: "2026-07-28T00:00:00.000Z",
		});
	});

	test("returns no dates for unknown formats", () => {
		assert.deepEqual(parseDevpostDateRange("Coming soon"), {});
	});
});

describe("normalizeDevpostAssetUrl", () => {
	test("expands protocol-relative assets", () => {
		assert.equal(
			normalizeDevpostAssetUrl("//cdn.example.com/image.png"),
			"https://cdn.example.com/image.png",
		);
	});

	test("rejects relative and non-http assets", () => {
		assert.equal(normalizeDevpostAssetUrl("/image.png"), undefined);
		assert.equal(normalizeDevpostAssetUrl("javascript:alert(1)"), undefined);
	});
});

describe("parseDevpostDetailPage", () => {
	test("uses structured event and registration dates", () => {
		const parsed = parseDevpostDetailPage(
			`
				<script type="application/ld+json">
					{
						"@type": "Event",
						"name": "Hack0",
						"startDate": "2026-09-20T09:00:00-05:00",
						"endDate": "2026-09-20T18:00:00-05:00"
					}
				</script>
				<div class="deadline">
					<time datetime="2026-09-18T23:45:00-04:00">September 18</time>
				</div>
			`,
			"https://hack0.devpost.com/",
		);

		assert.equal(parsed.startDate, "2026-09-20T14:00:00.000Z");
		assert.equal(parsed.endDate, "2026-09-20T23:00:00.000Z");
		assert.equal(parsed.registrationDeadline, "2026-09-19T03:45:00.000Z");
	});

	test("selects the event registration link instead of Devpost signup", () => {
		const parsed = parseDevpostDetailPage(
			`
				<a href="https://secure.devpost.com/users/register?ref_content=nav">Sign up</a>
				<a href="https://hack0.devpost.com/register?flow%5Bdata%5D%5Bchallenge_id%5D=42">
					Join hackathon
				</a>
			`,
			"https://hack0.devpost.com/",
		);

		assert.equal(
			parsed.registrationUrl,
			"https://hack0.devpost.com/register?flow%5Bdata%5D%5Bchallenge_id%5D=42",
		);
	});
});
