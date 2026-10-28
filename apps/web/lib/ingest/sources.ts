import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import type { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { SEED_CALENDARS } from "./seed";

type Db = ReturnType<typeof getDb>;

/** How often each source refreshes; Event Aggregator's rule. */
export const REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

function sourceIdForLuma(url: string) {
  const u = new URL(url);
  return `luma:${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
}

/** Inserts the seed calendars once; existing rows are left as they are. */
export async function seedSources(db: Db) {
  const rows = SEED_CALENDARS.map(([name, url, scope]) => ({
    provider: "luma" as const,
    kind: "calendar" as const,
    providerSourceId: sourceIdForLuma(url),
    url,
    name,
    scope,
    lumaCalendarId: url.match(/cal-[A-Za-z0-9]+/)?.[0] ?? null,
  }));
  return db.insert(sources).values(rows).onConflictDoNothing({ target: sources.providerSourceId }).returning({ id: sources.id });
}

/** Enabled sources whose next sync is due, never synced first. */
export async function dueSources(db: Db, now = new Date()) {
  return db
    .select({ id: sources.id, provider: sources.provider })
    .from(sources)
    .where(and(eq(sources.syncEnabled, true), or(isNull(sources.nextSyncAt), lte(sources.nextSyncAt, now))))
    .orderBy(asc(sources.lastSyncedAt));
}
