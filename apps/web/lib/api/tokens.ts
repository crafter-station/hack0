import { createHash, randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
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

/** Requests per token per minute; Event Aggregator's limit. */
export const RATE_LIMIT = 120;

/**
 * Resolves a bearer token and counts the request in one statement: unknown, malformed or revoked tokens return null.
 * The window is a fixed minute; `last_used_at` moves with it, so a read costs one write, not two.
 */
export async function verifyToken(raw: string | null | undefined) {
  if (!raw?.startsWith(PREFIX)) return null;
  const rows = await getDb().execute<{ id: string; scopes: string[]; window_count: number; window_start: string }>(sql`
    update api_tokens set
      window_count = case when window_start > now() - interval '1 minute' then window_count + 1 else 1 end,
      window_start = case when window_start > now() - interval '1 minute' then window_start else now() end,
      last_used_at = now()
    where token_hash = ${hashToken(raw)} and revoked_at is null
    returning id, scopes, window_count, window_start`);
  const row = (Array.isArray(rows) ? rows : (rows as { rows: unknown[] }).rows)[0] as
    | { id: string; scopes: string[]; window_count: number; window_start: string | Date }
    | undefined;
  if (!row) return null;
  const resetAt = new Date(new Date(row.window_start).getTime() + 60_000);
  return { id: row.id, scopes: row.scopes, used: row.window_count, resetAt };
}
