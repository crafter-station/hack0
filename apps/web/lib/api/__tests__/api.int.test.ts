import { beforeAll, describe, expect, test } from "bun:test";
import { GET as eventById } from "@/app/api/v1/events/[id]/route";
import { GET as events } from "@/app/api/v1/events/route";
import { GET as health } from "@/app/api/v1/health/route";
import { createToken, revokeToken, verifyToken } from "../tokens";

// Needs the catalog the ingest integration test writes: TEST_DATABASE_URL=... bun test
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

let token = "";
const get = (path: string, auth = token) =>
  new Request(`http://localhost${path}`, { headers: auth ? { authorization: `Bearer ${auth}` } : {} });

beforeAll(async () => {
  process.env.DATABASE_URL = url;
  if (url) token = await createToken("api test");
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
    const first = await (await events(get("/api/v1/events?limit=2"))).json();
    expect(first.events).toHaveLength(2);
    expect(first.page.total).toBeGreaterThanOrEqual(3);
    const second = await (await events(get(`/api/v1/events?limit=2&cursor=${first.page.nextCursor}`))).json();
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
    expect(event.sourceCount).toBeGreaterThanOrEqual(2);
  });

  test("a revoked token stops working", async () => {
    const raw = await createToken("to revoke");
    const row = await verifyToken(raw);
    if (!row) throw new Error("token did not verify");
    await revokeToken(row.id);
    expect((await events(get("/api/v1/events", raw))).status).toBe(401);
  });
});
