import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { fetchCalendarEvents, resolveCalendarId } from "@/lib/ingest/luma-public";
import { lumaInputs, normalizeBatch, providerInputs } from "@/lib/ingest/normalize";
import { persistBatch } from "@/lib/ingest/persist";
import { fetchPublicProviderSnapshot } from "@/lib/ingest/providers";
import { REFRESH_INTERVAL_MS } from "@/lib/ingest/sources";

async function loadSource(sourceId: string) {
  "use step";
  const [source] = await getDb().select().from(sources).where(eq(sources.id, sourceId));
  if (!source) throw new Error(`source ${sourceId} not found`);
  await getDb().update(sources).set({ syncStatus: "running", syncError: null }).where(eq(sources.id, sourceId));
  return { id: source.id, provider: source.provider, name: source.name, url: source.url, calendarId: source.lumaCalendarId };
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

async function ingestProvider(source: { id: string; provider: "meetup" | "eventbrite"; name: string | null; url: string }) {
  "use step";
  const snapshot = await fetchPublicProviderSnapshot(source.provider, source.url, null);
  const batch = normalizeBatch(providerInputs(snapshot.events, source.provider, { id: source.id, name: source.name ?? snapshot.name, calendarId: null }));
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

/** Pulls one source (Luma calendar, Meetup group or Eventbrite organizer) into the catalog. Each step retries on its own; the run is safe to replay. */
export async function syncSource(sourceId: string) {
  "use workflow";
  const source = await loadSource(sourceId);
  try {
    const result =
      source.provider === "luma"
        ? await ingest(source, await ensureCalendarId(source))
        : await ingestProvider({ ...source, provider: source.provider });
    await finish(sourceId, null);
    return { sourceId, ...result };
  } catch (error) {
    await finish(sourceId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
