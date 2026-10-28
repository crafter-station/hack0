import { and, eq, isNull, sql } from "drizzle-orm";
import { FatalError } from "workflow";
import { decrypt } from "@/lib/crypto";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";
import { fetchManagedDescription, fetchManagedEvents } from "@/lib/ingest/luma-api";
import { fetchCalendarEvents, resolveCalendarId } from "@/lib/ingest/luma-public";
import { lumaInputs, normalizeBatch, providerInputs } from "@/lib/ingest/normalize";
import { markRemoved, persistBatch, refreshListing } from "@/lib/ingest/persist";
import { fetchPublicProviderSnapshot } from "@/lib/ingest/providers";
import { REFRESH_INTERVAL_MS } from "@/lib/ingest/sources";

const LUMA_REQUEST_GAP_MS = 60_000 / 200;

type Loaded = {
  id: string;
  provider: "luma" | "meetup" | "eventbrite";
  name: string | null;
  url: string;
  calendarId: string | null;
  hasKey: boolean;
  firstSync: boolean;
};

async function loadSource(sourceId: string): Promise<Loaded> {
  "use step";
  const [s] = await getDb().select().from(sources).where(eq(sources.id, sourceId));
  if (!s) throw new Error(`source ${sourceId} not found`);
  await getDb().update(sources).set({ syncStatus: "running", syncError: null }).where(eq(sources.id, sourceId));
  return {
    id: s.id,
    provider: s.provider,
    name: s.name,
    url: s.url,
    calendarId: s.lumaCalendarId,
    hasKey: Boolean(s.apiKeyCiphertext) || isHack0Calendar(s.lumaCalendarId),
    firstSync: !s.lastSyncedAt,
  };
}

async function ensureCalendarId(source: Loaded) {
  "use step";
  if (source.calendarId) return source.calendarId;
  const calendarId = await resolveCalendarId(source.url);
  if (!calendarId) throw new Error(`no Luma calendar behind ${source.url}`);
  const [twin] = await getDb().select({ id: sources.id }).from(sources).where(eq(sources.lumaCalendarId, calendarId));
  if (twin && twin.id !== source.id) {
    // Same calendar added under another URL: keep the existing source and stop this one.
    await getDb().update(sources).set({ syncEnabled: false }).where(eq(sources.id, source.id));
    throw new FatalError(`duplicate of source ${twin.id} (same Luma calendar)`);
  }
  await getDb().update(sources).set({ lumaCalendarId: calendarId }).where(eq(sources.id, source.id));
  return calendarId;
}

/** True for hack0's own Luma calendar, which syncs with the project's LUMA_API_KEY instead of a stored key. */
function isHack0Calendar(calendarId: string | null) {
  return Boolean(calendarId && calendarId === process.env.HACK0_LUMA_CALENDAR_API_ID && process.env.LUMA_API_KEY);
}

async function apiKeyOf(sourceId: string) {
  const [row] = await getDb()
    .select({ sealed: sources.apiKeyCiphertext, calendarId: sources.lumaCalendarId })
    .from(sources)
    .where(eq(sources.id, sourceId));
  if (row && isHack0Calendar(row.calendarId)) return process.env.LUMA_API_KEY as string;
  if (!row?.sealed) throw new Error("source has no API key");
  return decrypt(row.sealed);
}

/** Reads the source and writes it. Incremental after the first sync: upcoming events only. */
async function ingest(source: Loaded, calendarId: string | null, syncStart: Date) {
  "use step";
  const ref = { id: source.id, name: source.name, calendarId };
  const after = source.firstSync ? undefined : syncStart;
  let inputs: ReturnType<typeof lumaInputs>;
  if (source.provider === "luma" && source.hasKey) inputs = await fetchManagedEvents(await apiKeyOf(source.id), ref, after);
  else if (source.provider === "luma" && calendarId) inputs = lumaInputs(await fetchCalendarEvents(calendarId, { past: source.firstSync }), ref);
  else if (source.provider !== "luma") {
    const snapshot = await fetchPublicProviderSnapshot(source.provider, source.url, null, { after: after?.toISOString() });
    // An incomplete snapshot cannot prove an event is gone, so it never marks removals.
    const result = await persistBatch(getDb(), normalizeBatch(providerInputs(snapshot.events, source.provider, { ...ref, name: source.name ?? snapshot.name })), source.id);
    return { ...result, complete: snapshot.complete };
  } else throw new Error("Luma source without a calendar id");
  return { ...(await persistBatch(getDb(), normalizeBatch(inputs), source.id)), complete: true };
}

/** Fills missing descriptions for events a keyed Luma calendar manages; public feeds carry none. */
async function fillDescriptions(sourceId: string) {
  "use step";
  const key = await apiKeyOf(sourceId);
  const missing = await getDb()
    .selectDistinct({ id: canonicalEvents.id, lumaId: canonicalEvents.lumaEventId })
    .from(canonicalEvents)
    .innerJoin(eventSources, eq(eventSources.canonicalEventId, canonicalEvents.id))
    .where(and(eq(eventSources.sourceId, sourceId), isNull(canonicalEvents.description), sql`${canonicalEvents.lumaEventId} is not null`));
  for (const row of missing) {
    if (!row.lumaId) continue;
    // Luma allows 200 requests per minute per calendar key: one every 300 ms stays under it.
    await new Promise((resolve) => setTimeout(resolve, LUMA_REQUEST_GAP_MS));
    const description = await fetchManagedDescription(key, row.lumaId);
    if (description) await getDb().update(canonicalEvents).set({ description }).where(eq(canonicalEvents.id, row.id));
  }
  return missing.length;
}

async function settle(sourceId: string, syncStart: Date, complete: boolean) {
  "use step";
  if (complete) await markRemoved(getDb(), sourceId, syncStart);
  await refreshListing(getDb());
}

async function finish(sourceId: string, error: string | null) {
  "use step";
  const now = new Date();
  await getDb()
    .update(sources)
    .set(
      error
        ? // A failed source goes back in the queue for the next daily run instead of waiting three days.
          { syncStatus: "failed", syncError: error, nextSyncAt: null }
        : { syncStatus: "completed", syncError: null, lastSyncedAt: now, nextSyncAt: new Date(now.getTime() + REFRESH_INTERVAL_MS) },
    )
    .where(eq(sources.id, sourceId));
}

async function runSource(sourceId: string, syncStart: Date) {
  const source = await loadSource(sourceId);
  try {
    const calendarId = source.provider === "luma" && !source.hasKey ? await ensureCalendarId(source) : source.calendarId;
    const result = await ingest(source, calendarId, syncStart);
    if (source.hasKey) await fillDescriptions(sourceId);
    await settle(sourceId, syncStart, result.complete);
    await finish(sourceId, null);
    return { sourceId, created: result.created, updated: result.updated };
  } catch (error) {
    await finish(sourceId, error instanceof Error ? error.message : String(error));
    return { sourceId, error: error instanceof Error ? error.message : String(error) };
  }
}

/** One source, from the admin's sync button. */
export async function syncSource(sourceId: string) {
  "use workflow";
  return runSource(sourceId, new Date());
}

/** Every due source, one at a time: no burst against a provider and no two runs racing to insert the same event. */
export async function syncAll(sourceIds: string[]) {
  "use workflow";
  const results = [];
  for (const id of sourceIds) results.push(await runSource(id, new Date()));
  return results;
}
