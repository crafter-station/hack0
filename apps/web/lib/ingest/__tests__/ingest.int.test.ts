import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources } from "@/lib/db/schema";
import { fetchCalendarEvents } from "../luma-public";
import { lumaInputs, normalizeBatch } from "../normalize";
import { persistBatch } from "../persist";

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
  await getDb().execute(sql`truncate canonical_events, event_sources cascade`);
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

  test("routing enrichment infers the country from the city", async () => {
    const rows = await getDb().select({ name: canonicalEvents.name, country: canonicalEvents.countryCode }).from(canonicalEvents);
    expect(rows.every((r) => r.country === "PE")).toBe(true);
  });
});
