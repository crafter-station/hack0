import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";
import fixture from "@/lib/ingest/__tests__/luma-pages.fixture.json";
import { syncSource } from "../sync-source";

// Runs against a throwaway Postgres: TEST_DATABASE_URL=postgres://localhost/hack0_test bun test
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

const html = (initialData: unknown) =>
  `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { initialData } } })}</script>`;

const hosted = {
  event: { api_id: "evt-host1", name: "Taller de agentes", url: "agentes-lima", start_at: "2027-03-01T23:00:00.000Z", geo_address_info: { city_state: "Lima, Peru", country_code: "PE" } },
  hosts: [{ name: "Ignacio Velasquez" }],
};

const calls: string[] = [];
const realFetch = globalThis.fetch;

beforeAll(async () => {
  if (!url) return;
  process.env.DATABASE_URL = url;
  // The fixture's events are in October 2026; keep them upcoming for the page check.
  const calendar = structuredClone(fixture.calendar);
  for (const e of calendar.data.upcoming.entries) e.event.start_at = e.event.start_at.replace("2026", "2027");
  calendar.data.event_start_ats = calendar.data.upcoming.entries.map((e) => e.event.start_at);
  globalThis.fetch = (async (input: string | URL) => {
    const u = new URL(String(input));
    calls.push(`${u.hostname}${u.pathname}`);
    if (u.hostname === "api.lu.ma" && u.pathname === "/user/profile/events-hosting") {
      return Response.json({ entries: u.searchParams.get("period") === "future" ? [hosted] : [], has_more: false });
    }
    if (u.hostname === "api.lu.ma") return Response.json({ entries: [], has_more: false });
    if (u.pathname === "/hack0") return new Response(html(calendar));
    if (u.pathname === "/user/theveller") return new Response(html(fixture.profile));
    return new Response(html(fixture.event));
  }) as typeof fetch;
  await getDb().execute(sql`truncate canonical_events, event_sources, sources cascade`);
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

const addSource = async (kind: "calendar" | "profile" | "event", path: string) => {
  const [row] = await getDb()
    .insert(sources)
    .values({ provider: "luma", kind, providerSourceId: `luma:luma.com${path}`, url: `https://luma.com${path}`, name: path, scope: "latam" })
    .returning({ id: sources.id });
  if (!row) throw new Error("no source");
  return row.id;
};

run("sync workflow over public Luma pages", () => {
  test("a calendar syncs its upcoming events from its page, fills descriptions from event pages, and reads only history from api.lu.ma", async () => {
    calls.length = 0;
    const id = await addSource("calendar", "/hack0");
    const result = await syncSource(id);
    expect(result).toMatchObject({ created: 2 });
    expect(calls.filter((c) => c === "api.lu.ma/calendar/get-items")).toHaveLength(1);
    const rows = await getDb().select().from(canonicalEvents);
    expect(rows.every((r) => r.countryCode === "PE")).toBe(true);
    expect(rows.every((r) => r.description?.startsWith("¿Alguna vez"))).toBe(true);
    const [src] = await getDb().select().from(sources).where(eq(sources.id, id));
    expect(src?.syncStatus).toBe("completed");
  });

  test("a profile syncs the events its user hosts", async () => {
    const id = await addSource("profile", "/user/theveller");
    expect(await syncSource(id)).toMatchObject({ created: 1 });
    const [sighting] = await getDb().select().from(eventSources).where(eq(eventSources.sourceId, id));
    expect(sighting?.sourceType).toBe("profile_scrape");
  });

  test("a single event URL syncs that event", async () => {
    const id = await addSource("event", "/5z2nzojb");
    // Already in the catalog from the calendar: a new sighting, not a new row.
    expect(await syncSource(id)).toMatchObject({ created: 0, updated: 1 });
  });
});
