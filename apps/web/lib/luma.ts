import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

/**
 * Luma signs `{t}.{raw body}` with HMAC-SHA256 and sends
 * `Webhook-Signature: t=<unix seconds>,v1=<hex>` (help.luma.com/p/webhooks).
 */
export function verifyLuma(rawBody: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(now / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type LumaGuestEvent = {
  type: string;
  data: { id: string; user_email: string; user_name: string | null; approval_status: string; event: { id: string; name?: string } };
};
