import { expect, test } from "bun:test";
import { hashKey, newKey } from "./keys";

test("keys are h0_ plus 32 base32 characters and unique", () => {
  const a = newKey();
  expect(a).toMatch(/^h0_[a-z2-7]{32}$/);
  expect(newKey()).not.toBe(a);
  expect(hashKey(a)).toHaveLength(64);
});
