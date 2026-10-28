import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";
import { fetchCalendarEvents } from "../luma-public";
import { lumaInputs, normalizeBatch, providerInputs } from "../normalize";
import { markRemoved, persistBatch, refreshListing } from "../persist";

// Runs against a throwaway Postgres: TEST_DATABASE_URL=postgres://localhost/hack0_test bun test
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

const entry = (id: string, name: string, start: string, city = "Lima, Lima") => ({
  event: { api_id: id, name, url: id.replace("evt-", "e-"), start_at: start, geo_address_info: { city_state: city } },
  hosts: [{ name: "Crafter Station" }],
});

const FEEDS: Record<string, { future: unknown[]; past: unknown[] }> = {
  "cal-a": {
    future: [
      entry("evt-1", "Cursor Meetup Lima", "2026-11-05T23:00:00.000Z"),
      entry("evt-2", "Hackathon IA Perú", "2026-12-01T14:00:00.000Z"),
    ],
    past: [entry("evt-0", "Code Night Arequipa", "2025-06-01T23:00:00.000Z", "Arequipa, Arequipa")],
  },
  // Second calendar lists evt-1 again: one event, two sightings.
  "cal-b": { future: [entry("evt-1", "Cursor Meetup Lima", "2026-11-05T23:00:00.000Z")], past: [] },
};

const realFetch = globalThis.fetch;

beforeAll(async () => {
  process.env.DATABASE_URL = url;
  globalThis.fetch = (async (input: string | URL) => {
    const u = new URL(String(input));
    const feed = FEEDS[u.searchParams.get("calendar_api_id") ?? ""];
    const period = u.searchParams.get("period") as "future" | "past";
    return Response.json({ entries: feed?.[period] ?? [], has_more: false });
  }) as typeof fetch;
  await getDb().execute(sql`truncate canonical_events, event_sources, sources cascade`);
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

async function sync(calendarId: string, name: string) {
  const events = await fetchCalendarEvents(calendarId);
  return persistBatch(getDb(), normalizeBatch(lumaInputs(events, { id: calendarId, name, calendarId })), null);
}

run("ingest into Postgres", () => {
  test("first sync creates every event", async () => {
    expect(await sync("cal-a", "Cursor Lima, Peru")).toEqual({ created: 3, updated: 0 });
  });

  test("an event listed by a second calendar gains a sighting, not a row", async () => {
    expect(await sync("cal-b", "Crafter Station")).toEqual({ created: 0, updated: 1 });
    const rows = await getDb().select().from(canonicalEvents);
    expect(rows).toHaveLength(3);
    const sightings = await getDb().select().from(eventSources);
    expect(sightings).toHaveLength(4);
  });

  test("replaying a sync changes nothing", async () => {
    expect(await sync("cal-a", "Cursor Lima, Peru")).toEqual({ created: 0, updated: 3 });
    expect(await getDb().select().from(eventSources)).toHaveLength(4);
  });

  test("the same name at the same time in another city stays a separate event", async () => {
    const listing = {
      externalId: "554433",
      hostName: "Cursor Arequipa",
      payload: {},
      event: {
        id: "554433",
        name: "Cursor Meetup Lima",
        url: "https://www.eventbrite.com/e/554433",
        coverUrl: null,
        startAt: "2026-11-05T23:00:00.000Z",
        city: "Arequipa",
      },
    };
    const batch = normalizeBatch(providerInputs([listing], "eventbrite", { id: "org-2", name: "Cursor Arequipa", calendarId: null }));
    expect(await persistBatch(getDb(), batch, null)).toEqual({ created: 1, updated: 0 });
    await getDb().delete(canonicalEvents).where(eq(canonicalEvents.canonicalKey, "eventbrite:554433"));
  });

  test("a rename on the calendar that owns the event shows up", async () => {
    const feed = FEEDS["cal-a"];
    if (!feed) throw new Error("fixture missing");
    const original = feed.future[1];
    feed.future[1] = entry("evt-2", "Hackathon IA Perú 2026", "2026-12-01T14:00:00.000Z");
    await sync("cal-a", "Cursor Lima, Peru");
    feed.future[1] = original;
    const [row] = await getDb()
      .select({ name: canonicalEvents.name })
      .from(canonicalEvents)
      .where(eq(canonicalEvents.lumaEventId, "evt-2"));
    expect(row?.name).toBe("Hackathon IA Perú 2026");
  });

  test("routing enrichment infers the country from the city", async () => {
    const rows = await getDb().select({ name: canonicalEvents.name, country: canonicalEvents.countryCode }).from(canonicalEvents);
    expect(rows.every((r) => r.country === "PE")).toBe(true);
  });

  test("the same event on Eventbrite joins the Luma row by name and start", async () => {
    const listing = {
      externalId: "998877",
      hostName: "Cursor Lima",
      payload: {},
      event: {
        id: "998877",
        name: "Cursor Meetup Lima",
        url: "https://www.eventbrite.com/e/cursor-meetup-lima-998877",
        coverUrl: null,
        startAt: "2026-11-05T23:00:00.000Z",
        city: "Lima",
      },
    };
    const batch = normalizeBatch(providerInputs([listing], "eventbrite", { id: "org-1", name: "Cursor Lima", calendarId: null }));
    expect(await persistBatch(getDb(), batch, null)).toEqual({ created: 0, updated: 1 });
    expect(await getDb().select().from(canonicalEvents)).toHaveLength(3);
    expect(await getDb().select().from(eventSources)).toHaveLength(5);
    const rows = await getDb().select({ name: canonicalEvents.name, lumaEventId: canonicalEvents.lumaEventId }).from(canonicalEvents);
    expect(rows.find((r) => r.name === "Cursor Meetup Lima")?.lumaEventId).toBe("evt-1");
    const [lima] = await getDb().select({ url: canonicalEvents.url }).from(canonicalEvents).where(eq(canonicalEvents.lumaEventId, "evt-1"));
    expect(lima?.url).toBe("https://luma.com/e-1");
  });

  test("an upcoming event the source stopped listing goes inactive; past ones are untouched", async () => {
    const [src] = await getDb()
      .insert(sources)
      .values({ provider: "luma", kind: "calendar", providerSourceId: "luma:test/removals", url: "https://luma.com/test", scope: "latam" })
      .returning({ id: sources.id });
    if (!src) throw new Error("no source");
    const events = await fetchCalendarEvents("cal-a");
    // Only this source lists the events, so removal decides whether they stay active.
    await getDb().delete(eventSources);
    await persistBatch(getDb(), normalizeBatch(lumaInputs(events, { id: src.id, name: "t", calendarId: "cal-r" })), src.id);
    const syncStart = new Date();
    // The next sync no longer lists evt-2.
    const later = events.filter((e) => e.apiId !== "evt-2");
    await persistBatch(
      getDb(),
      normalizeBatch(lumaInputs(later, { id: src.id, name: "t", calendarId: "cal-r" }, new Date(syncStart.getTime() + 1000).toISOString())),
      src.id,
    );
    await markRemoved(getDb(), src.id, syncStart);
    await refreshListing(getDb());
    const rows = await getDb().select({ id: canonicalEvents.lumaEventId, active: canonicalEvents.active }).from(canonicalEvents);
    expect(rows.find((r) => r.id === "evt-2")?.active).toBe(false);
    expect(rows.find((r) => r.id === "evt-0")?.active).toBe(true);
  });

  test("listing: LATAM country, or a latam source, or online in Spanish", async () => {
    await getDb()
      .update(canonicalEvents)
      .set({ countryCode: null, isOnline: null, languageCode: null })
      .where(eq(canonicalEvents.lumaEventId, "evt-1"));
    await refreshListing(getDb());
    // evt-1 is still seen by the latam test source above, so it stays listed without a country.
    const [kept] = await getDb()
      .select({ listed: canonicalEvents.listed })
      .from(canonicalEvents)
      .where(eq(canonicalEvents.lumaEventId, "evt-1"));
    expect(kept?.listed).toBe(true);
    await getDb().update(sources).set({ scope: "global" }).where(eq(sources.providerSourceId, "luma:test/removals"));
    await refreshListing(getDb());
    const [dropped] = await getDb()
      .select({ listed: canonicalEvents.listed })
      .from(canonicalEvents)
      .where(eq(canonicalEvents.lumaEventId, "evt-1"));
    expect(dropped?.listed).toBe(false);
    await getDb().update(canonicalEvents).set({ isOnline: true, languageCode: "es" }).where(eq(canonicalEvents.lumaEventId, "evt-1"));
    await refreshListing(getDb());
    const [online] = await getDb()
      .select({ listed: canonicalEvents.listed })
      .from(canonicalEvents)
      .where(eq(canonicalEvents.lumaEventId, "evt-1"));
    expect(online?.listed).toBe(true);
    await getDb().update(canonicalEvents).set({ countryCode: "PE", isOnline: false }).where(eq(canonicalEvents.lumaEventId, "evt-1"));
    await refreshListing(getDb());
  });
});
