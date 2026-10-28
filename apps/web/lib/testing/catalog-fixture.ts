import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { lumaInputs, normalizeBatch } from "@/lib/ingest/normalize";
import { persistBatch, refreshListing } from "@/lib/ingest/persist";

const event = (id: string, name: string, start: string, city = "Lima, Lima") => ({
  apiId: id,
  name,
  url: `https://luma.com/${id.replace("evt-", "e-")}`,
  coverUrl: null,
  startAt: start,
  endAt: null,
  city,
  hostNames: ["Crafter Station"],
});

/**
 * Resets the catalog to three Luma events (two upcoming in Lima, one past in Arequipa) seen by two calendars,
 * so each integration test file owns its data instead of depending on another file's run order.
 */
export async function seedCatalog() {
  const db = getDb();
  await db.execute(sql`truncate canonical_events, event_sources, sources, content_drafts, api_tokens cascade`);
  const a = [
    event("evt-1", "Cursor Meetup Lima", "2026-11-05T23:00:00.000Z"),
    event("evt-2", "Hackathon IA Perú", "2026-12-01T14:00:00.000Z"),
    event("evt-0", "Code Night Arequipa", "2025-06-01T23:00:00.000Z", "Arequipa, Arequipa"),
  ];
  await persistBatch(db, normalizeBatch(lumaInputs(a, { id: "cal-a", name: "Cursor Lima, Peru", calendarId: "cal-a" })), null);
  await persistBatch(
    db,
    normalizeBatch(lumaInputs([a[0] as (typeof a)[number]], { id: "cal-b", name: "Crafter Station", calendarId: "cal-b" })),
    null,
  );
  await refreshListing(db);
}
