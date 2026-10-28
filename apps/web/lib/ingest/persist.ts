import { eq, or, sql } from "drizzle-orm";
import type { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources } from "@/lib/db/schema";
import type { NormalizedEvent } from "./normalize";

type Db = ReturnType<typeof getDb>;

function eventRow(n: NormalizedEvent) {
  const { event } = n;
  const e = event.enrichment ?? {};
  return {
    canonicalKey: n.canonicalKey,
    identityFingerprint: n.fingerprint,
    lumaEventId: event.externalIds.lumaEventId ?? null,
    externalIds: event.externalIds,
    name: event.name,
    description: event.description ?? null,
    url: event.url,
    coverUrl: event.coverUrl,
    startAt: new Date(event.startAt),
    endAt: event.endAt ? new Date(event.endAt) : null,
    timezone: event.timezone ?? null,
    city: event.city ?? null,
    region: e.region ?? null,
    countryCode: e.countryCode ?? null,
    venueName: e.venueName ?? null,
    venueAddress: e.venueAddress ?? null,
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
    isOnline: e.isOnline ?? null,
    format: e.format ?? null,
    languageCode: e.languageCode ?? null,
    hostName: event.sources.find((s) => s.hostName)?.hostName ?? null,
    topics: e.topics ?? [],
    audience: e.audience ?? [],
    tags: n.tags,
    enrichment: e,
    enrichedAt: new Date(),
  };
}

/** The stored event this one already is: same key, same Luma id, or same name and start. */
async function findExisting(db: Db, n: NormalizedEvent) {
  const lumaId = n.event.externalIds.lumaEventId;
  const [row] = await db
    .select()
    .from(canonicalEvents)
    .where(
      or(
        eq(canonicalEvents.canonicalKey, n.canonicalKey),
        lumaId ? eq(canonicalEvents.lumaEventId, lumaId) : undefined,
        eq(canonicalEvents.identityFingerprint, n.fingerprint),
      ),
    )
    .limit(1);
  return row ?? null;
}

type EventFields = Omit<ReturnType<typeof eventRow>, "canonicalKey">;

/**
 * The source that created a row may rewrite it (a rename on Luma should show up).
 * Any other source only fills fields that are still empty, so its URL never replaces the published one.
 */
function mergeFields(existing: typeof canonicalEvents.$inferSelect, incoming: EventFields, sameSource: boolean) {
  const filled = Object.entries(incoming).filter(([key, value]) => {
    if (value === null || value === undefined) return false;
    if (sameSource) return true;
    const current = existing[key as keyof typeof existing];
    return current === null || (Array.isArray(current) && current.length === 0);
  });
  return Object.fromEntries(filled) as Partial<EventFields>;
}

async function upsertEvent(db: Db, n: NormalizedEvent): Promise<{ id: string; created: boolean }> {
  const { canonicalKey: _key, ...fields } = eventRow(n);
  const existing = await findExisting(db, n);
  if (existing) {
    const update = mergeFields(existing, fields, existing.canonicalKey === n.canonicalKey);
    if (Object.keys(update).length > 0) await db.update(canonicalEvents).set(update).where(eq(canonicalEvents.id, existing.id));
    return { id: existing.id, created: false };
  }
  const [created] = await db.insert(canonicalEvents).values(eventRow(n)).returning({ id: canonicalEvents.id });
  if (!created) throw new Error(`insert returned no row for ${n.canonicalKey}`);
  return { id: created.id, created: true };
}

async function upsertSources(db: Db, n: NormalizedEvent, canonicalEventId: string, sourceId: string | null) {
  const rows = n.event.sources.map((s) => ({
    canonicalEventId,
    sourceId,
    provider: s.provider,
    sourceType: s.sourceType,
    sourceKey: s.sourceKey,
    sourceUrl: s.sourceUrl,
    externalEventId: s.externalEventId,
    calendarName: s.calendarName,
    hostName: s.hostName,
    lastSyncedAt: new Date(s.lastSyncedAt),
  }));
  if (rows.length === 0) return;
  await db
    .insert(eventSources)
    .values(rows)
    .onConflictDoUpdate({
      target: [eventSources.sourceType, eventSources.sourceKey],
      set: { canonicalEventId, lastSyncedAt: sql`excluded.last_synced_at`, calendarName: sql`excluded.calendar_name` },
    });
}

type PersistResult = { created: number; updated: number };

/** Writes a normalized batch; safe to replay, since every write is keyed. */
export async function persistBatch(db: Db, batch: NormalizedEvent[], sourceId: string | null): Promise<PersistResult> {
  const result: PersistResult = { created: 0, updated: 0 };
  for (const n of batch) {
    const { id, created } = await upsertEvent(db, n);
    await upsertSources(db, n, id, sourceId);
    result[created ? "created" : "updated"]++;
  }
  return result;
}
