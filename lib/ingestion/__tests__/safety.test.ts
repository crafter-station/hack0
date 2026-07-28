import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	assertWriteAllowed,
	ingestionModeFromWriteFlag,
	parseIngestionMode,
} from "@/lib/ingestion/safety";

describe("parseIngestionMode", () => {
	test("defaults to dry-run", () => {
		assert.equal(parseIngestionMode([]), "dry-run");
	});

	test("requires an explicit write flag", () => {
		assert.equal(parseIngestionMode(["--write"]), "write");
	});

	test("rejects conflicting flags", () => {
		assert.throws(() => parseIngestionMode(["--write", "--dry-run"]));
	});
});

describe("ingestionModeFromWriteFlag", () => {
	test("defaults missing Trigger payloads to dry-run", () => {
		assert.equal(ingestionModeFromWriteFlag(), "dry-run");
		assert.equal(ingestionModeFromWriteFlag(false), "dry-run");
		assert.equal(ingestionModeFromWriteFlag(true), "write");
	});
});

describe("assertWriteAllowed", () => {
	test("always allows dry-run", () => {
		assert.doesNotThrow(() => assertWriteAllowed("dry-run", {}));
	});

	test("blocks writes without an explicit database environment", () => {
		assert.throws(
			() => assertWriteAllowed("write", { HACK0_ALLOW_WRITES: "true" }),
			/HACK0_DATABASE_ENV/,
		);
	});

	test("allows an explicitly authorized staging write", () => {
		assert.doesNotThrow(() =>
			assertWriteAllowed("write", {
				HACK0_DATABASE_ENV: "staging",
				HACK0_ALLOW_WRITES: "true",
			}),
		);
	});

	test("requires a second confirmation for production", () => {
		assert.throws(
			() =>
				assertWriteAllowed("write", {
					HACK0_DATABASE_ENV: "production",
					HACK0_ALLOW_WRITES: "true",
				}),
			/HACK0_ALLOW_PRODUCTION_WRITES/,
		);

		assert.doesNotThrow(() =>
			assertWriteAllowed("write", {
				HACK0_DATABASE_ENV: "production",
				HACK0_ALLOW_WRITES: "true",
				HACK0_ALLOW_PRODUCTION_WRITES: "true",
			}),
		);
	});
});
