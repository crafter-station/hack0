import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { GET as eventById } from "@/app/api/v1/events/[id]/route";
import { GET as exportRoute } from "@/app/api/v1/events/export/route";
import { GET as events } from "@/app/api/v1/events/route";
import { GET as health } from "@/app/api/v1/health/route";
import { getDb } from "@/lib/db/client";
import { seedCatalog } from "@/lib/testing/catalog-fixture";
import { createToken, revokeToken, verifyToken } from "../tokens";

// Runs against a throwaway Postgres: TEST_DATABASE_URL=postgres://localhost/hack0_test bun test
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

let token = "";
const get = (path: string, auth = token) =>
  new Request(`http://localhost${path}`, { headers: auth ? { authorization: `Bearer ${auth}` } : {} });

beforeAll(async () => {
  if (!url) return;
  process.env.DATABASE_URL = url;
  await seedCatalog();
  token = await createToken("api test");
});

run("REST API", () => {
  test("health needs no token", async () => {
    expect(await health().json()).toEqual({ ok: true, service: "hack0", apiVersion: "v1" });
  });

  test("events reject a missing or unknown token", async () => {
    expect((await events(get("/api/v1/events", ""))).status).toBe(401);
    expect((await events(get("/api/v1/events", "hack0_sk_nope"))).status).toBe(401);
  });

  test("events page with a cursor until the end", async () => {
    const first = await (await events(get("/api/v1/events?limit=1"))).json();
    expect(first.events).toHaveLength(1);
    expect(first.page.total).toBe(3);
    const second = await (await events(get(`/api/v1/events?limit=1&cursor=${first.page.nextCursor}`))).json();
    expect(second.events[0].id).not.toBe(first.events[0].id);
  });

  test("status filters split upcoming from past", async () => {
    const upcoming = await (await events(get("/api/v1/events?status=upcoming"))).json();
    const past = await (await events(get("/api/v1/events?status=past"))).json();
    expect(upcoming.events.every((e: { temporalStatus: string }) => e.temporalStatus !== "past")).toBe(true);
    expect(past.events.map((e: { name: string }) => e.name)).toContain("Code Night Arequipa");
  });

  test("an event resolves by its Luma id with every sighting", async () => {
    const res = await eventById(get("/api/v1/events/evt-1"), { params: Promise.resolve({ id: "evt-1" }) });
    const { event } = await res.json();
    expect(event.name).toBe("Cursor Meetup Lima");
    expect(event.sourceCount).toBe(2);
    expect(event.sources).toHaveLength(2);
  });

  test("a revoked token stops working", async () => {
    const raw = await createToken("to revoke");
    const row = await verifyToken(raw);
    if (!row) throw new Error("token did not verify");
    await revokeToken(row.id);
    expect((await events(get("/api/v1/events", raw))).status).toBe(401);
  });

  test("responses carry rate-limit headers and the 121st request in a minute is refused", async () => {
    const raw = await createToken("rate");
    const ok = await events(get("/api/v1/events?limit=1", raw));
    expect(ok.headers.get("x-ratelimit-limit")).toBe("120");
    await getDb().execute(sql`update api_tokens set window_count = 120, window_start = now() where name = 'rate'`);
    const limited = await events(get("/api/v1/events?limit=1", raw));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  test("export returns every matching event as CSV", async () => {
    const res = await exportRoute(get("/api/v1/events/export?format=csv"));
    expect(res.headers.get("content-type")).toContain("text/csv");
    const lines = (await res.text()).split("\n");
    expect(lines[0]).toBe("id,name,startAt,endAt,city,countryCode,languageCode,url,sourceCount,tags");
    expect(lines.length).toBeGreaterThan(1);
  });
});
