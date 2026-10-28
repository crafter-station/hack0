import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { fetchCalendarEvents, resolveCalendarId } from "@/lib/ingest/luma-public";
import { lumaInputs, normalizeBatch } from "@/lib/ingest/normalize";
import { persistBatch } from "@/lib/ingest/persist";
import { REFRESH_INTERVAL_MS } from "@/lib/ingest/sources";

async function loadSource(sourceId: string) {
  "use step";
  const [source] = await getDb().select().from(sources).where(eq(sources.id, sourceId));
  if (!source) throw new Error(`source ${sourceId} not found`);
  await getDb().update(sources).set({ syncStatus: "running", syncError: null }).where(eq(sources.id, sourceId));
  return { id: source.id, name: source.name, url: source.url, calendarId: source.lumaCalendarId };
}

async function ensureCalendarId(source: { id: string; url: string; calendarId: string | null }) {
  "use step";
  if (source.calendarId) return source.calendarId;
  const calendarId = await resolveCalendarId(source.url);
  if (!calendarId) throw new Error(`no Luma calendar behind ${source.url}`);
  await getDb().update(sources).set({ lumaCalendarId: calendarId }).where(eq(sources.id, source.id));
  return calendarId;
}

async function ingest(source: { id: string; name: string | null }, calendarId: string) {
  "use step";
  const events = await fetchCalendarEvents(calendarId);
  const batch = normalizeBatch(lumaInputs(events, { id: source.id, name: source.name, calendarId }));
  return persistBatch(getDb(), batch, source.id);
}

async function finish(sourceId: string, error: string | null) {
  "use step";
  const now = new Date();
  await getDb()
    .update(sources)
    .set({
      syncStatus: error ? "failed" : "completed",
      syncError: error,
      lastSyncedAt: error ? undefined : now,
      nextSyncAt: new Date(now.getTime() + REFRESH_INTERVAL_MS),
    })
    .where(eq(sources.id, sourceId));
}

/** Pulls one Luma calendar into the catalog. Each step retries on its own; the run is safe to replay. */
export async function syncSource(sourceId: string) {
  "use workflow";
  const source = await loadSource(sourceId);
  try {
    const calendarId = await ensureCalendarId(source);
    const result = await ingest(source, calendarId);
    await finish(sourceId, null);
    return { sourceId, ...result };
  } catch (error) {
    await finish(sourceId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
