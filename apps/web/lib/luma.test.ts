import { expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifyLuma } from "./luma";

const secret = "whsec_test";
const body = '{"type":"guest.registered"}';
const sign = (t: number, b = body) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${b}`).digest("hex")}`;

test("accepts a fresh, correctly signed body", () => {
  const now = Date.now();
  expect(verifyLuma(body, sign(Math.floor(now / 1000)), secret, now)).toBe(true);
});

test("rejects a tampered body, a stale timestamp and a missing header", () => {
  const now = Date.now();
  const t = Math.floor(now / 1000);
  expect(verifyLuma('{"type":"x"}', sign(t), secret, now)).toBe(false);
  expect(verifyLuma(body, sign(t - 3600), secret, now)).toBe(false);
  expect(verifyLuma(body, null, secret, now)).toBe(false);
});
