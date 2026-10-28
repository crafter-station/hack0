import { expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "../crypto";

test("a sealed key opens with the same secret and fails if tampered", () => {
  process.env.HACK0_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  const sealed = encrypt("luma-secret-key");
  expect(sealed).not.toContain("luma-secret-key");
  expect(decrypt(sealed)).toBe("luma-secret-key");
  const [iv, tag, data = ""] = sealed.split(".");
  const bytes = Buffer.from(data, "base64url");
  bytes[0] = (bytes[0] ?? 0) ^ 0xff;
  expect(() => decrypt([iv, tag, bytes.toString("base64url")].join("."))).toThrow();
});
