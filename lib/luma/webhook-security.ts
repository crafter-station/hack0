import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/i;

export type LumaWebhookVerification =
	| { valid: true; timestamp: number }
	| {
			valid: false;
			reason:
				| "invalid_signature"
				| "invalid_timestamp"
				| "missing_signature"
				| "timestamp_outside_tolerance";
	  };

function parseSignatureHeader(signatureHeader: string) {
	const timestamps: string[] = [];
	const signatures: string[] = [];

	for (const rawPart of signatureHeader.split(",")) {
		const separator = rawPart.indexOf("=");
		if (separator === -1) continue;

		const key = rawPart.slice(0, separator).trim();
		const value = rawPart.slice(separator + 1).trim();
		if (key === "t" && value) timestamps.push(value);
		if (key === "v1" && value) signatures.push(value);
	}

	return {
		timestamp: timestamps[0] ?? null,
		signatures,
	};
}

function signaturesMatch(expectedHex: string, candidateHex: string) {
	if (!SIGNATURE_PATTERN.test(candidateHex)) return false;

	const expected = Buffer.from(expectedHex, "hex");
	const candidate = Buffer.from(candidateHex, "hex");
	return (
		expected.length === candidate.length && timingSafeEqual(expected, candidate)
	);
}

export function getLumaWebhookSecrets(
	env: Readonly<Record<string, string | undefined>> = process.env,
) {
	return [
		env.LUMA_WEBHOOK_SECRET,
		...(env.LUMA_WEBHOOK_SECRETS ?? "").split(","),
	]
		.map((secret) => secret?.trim())
		.filter((secret): secret is string => Boolean(secret));
}

export function verifyLumaWebhookSignature(input: {
	secrets: readonly string[];
	signatureHeader: string | null;
	rawBody: string;
	nowSeconds?: number;
	toleranceSeconds?: number;
}): LumaWebhookVerification {
	if (!input.signatureHeader) {
		return { valid: false, reason: "missing_signature" };
	}

	const { timestamp, signatures } = parseSignatureHeader(input.signatureHeader);
	if (!timestamp || signatures.length === 0) {
		return { valid: false, reason: "missing_signature" };
	}

	const timestampSeconds = Number(timestamp);
	if (!Number.isInteger(timestampSeconds) || timestampSeconds < 0) {
		return { valid: false, reason: "invalid_timestamp" };
	}

	const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
	const toleranceSeconds = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
	if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
		return { valid: false, reason: "timestamp_outside_tolerance" };
	}

	const signedPayload = `${timestampSeconds}.${input.rawBody}`;
	for (const secret of input.secrets) {
		const expected = createHmac("sha256", secret)
			.update(signedPayload)
			.digest("hex");
		if (signatures.some((signature) => signaturesMatch(expected, signature))) {
			return { valid: true, timestamp: timestampSeconds };
		}
	}

	return { valid: false, reason: "invalid_signature" };
}
