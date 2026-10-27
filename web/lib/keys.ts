import { createHash, randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

export function newKey(): string {
  const bytes = randomBytes(32);
  let out = "h0_";
  for (const byte of bytes) out += ALPHABET[byte % 32];
  return out;
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
