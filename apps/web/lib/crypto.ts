import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** 32-byte key, base64, from HACK0_ENCRYPTION_KEY. Generate one with `openssl rand -base64 32`. */
function key() {
  const raw = process.env.HACK0_ENCRYPTION_KEY;
  const buf = raw ? Buffer.from(raw, "base64") : null;
  if (buf?.length !== 32) throw new Error("HACK0_ENCRYPTION_KEY must be 32 bytes, base64");
  return buf;
}

/** AES-256-GCM; the output is `iv.tag.ciphertext`, each base64url. */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(sealed: string) {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !data) throw new Error("malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
