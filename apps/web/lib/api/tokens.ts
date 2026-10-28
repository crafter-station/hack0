import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { apiTokens } from "@/lib/db/schema";

const PREFIX = "hack0_sk_";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates a token and returns the raw value; it is shown once and never stored. */
export async function createToken(name: string) {
  const raw = PREFIX + randomBytes(32).toString("base64url");
  await getDb()
    .insert(apiTokens)
    .values({ name, tokenHash: hashToken(raw), prefix: raw.slice(0, PREFIX.length + 6) });
  return raw;
}

export async function revokeToken(id: string) {
  await getDb().update(apiTokens).set({ revokedAt: new Date() }).where(eq(apiTokens.id, id));
}

/** Resolves a bearer token to its row; null for unknown, malformed or revoked ones. */
export async function verifyToken(raw: string | null | undefined) {
  if (!raw?.startsWith(PREFIX)) return null;
  const [row] = await getDb()
    .select({ id: apiTokens.id, scopes: apiTokens.scopes })
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashToken(raw)), isNull(apiTokens.revokedAt)));
  if (!row) return null;
  await getDb().update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id));
  return row;
}
