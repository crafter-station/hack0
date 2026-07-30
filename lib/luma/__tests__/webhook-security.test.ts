import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, test } from "node:test";
import {
	getLumaWebhookSecrets,
	verifyLumaWebhookSignature,
} from "@/lib/luma/webhook-security";

const secret = "whsec_test_secret";
const rawBody = JSON.stringify({
	type: "event.updated",
	data: { api_id: "evt-test" },
});
const timestamp = 1_800_000_000;

function signature(body = rawBody, signedAt = timestamp, key = secret) {
	return createHmac("sha256", key).update(`${signedAt}.${body}`).digest("hex");
}

describe("getLumaWebhookSecrets", () => {
	test("supports one or multiple calendar webhook secrets", () => {
		assert.deepEqual(
			getLumaWebhookSecrets({
				LUMA_WEBHOOK_SECRET: " first ",
				LUMA_WEBHOOK_SECRETS: "second, third",
			}),
			["first", "second", "third"],
		);
	});
});

describe("verifyLumaWebhookSignature", () => {
	test("accepts a valid signature", () => {
		assert.deepEqual(
			verifyLumaWebhookSignature({
				secrets: [secret],
				signatureHeader: `t=${timestamp},v1=${signature()}`,
				rawBody,
				nowSeconds: timestamp + 30,
			}),
			{ valid: true, timestamp },
		);
	});

	test("accepts a valid signature from any configured calendar", () => {
		const secondSecret = "whsec_second_calendar";
		const result = verifyLumaWebhookSignature({
			secrets: [secret, secondSecret],
			signatureHeader: `t=${timestamp},v1=${signature(
				rawBody,
				timestamp,
				secondSecret,
			)}`,
			rawBody,
			nowSeconds: timestamp,
		});

		assert.equal(result.valid, true);
	});

	test("rejects a modified body", () => {
		const result = verifyLumaWebhookSignature({
			secrets: [secret],
			signatureHeader: `t=${timestamp},v1=${signature()}`,
			rawBody: `${rawBody} `,
			nowSeconds: timestamp,
		});

		assert.deepEqual(result, { valid: false, reason: "invalid_signature" });
	});

	test("rejects stale requests to prevent replay", () => {
		const result = verifyLumaWebhookSignature({
			secrets: [secret],
			signatureHeader: `t=${timestamp},v1=${signature()}`,
			rawBody,
			nowSeconds: timestamp + 301,
		});

		assert.deepEqual(result, {
			valid: false,
			reason: "timestamp_outside_tolerance",
		});
	});

	test("rejects missing or malformed signature data", () => {
		assert.deepEqual(
			verifyLumaWebhookSignature({
				secrets: [secret],
				signatureHeader: null,
				rawBody,
				nowSeconds: timestamp,
			}),
			{ valid: false, reason: "missing_signature" },
		);
		assert.deepEqual(
			verifyLumaWebhookSignature({
				secrets: [secret],
				signatureHeader: "t=not-a-number,v1=bad",
				rawBody,
				nowSeconds: timestamp,
			}),
			{ valid: false, reason: "invalid_timestamp" },
		);
	});
});
