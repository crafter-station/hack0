import { beforeEach, describe, expect, mock, test } from "bun:test";

let signedIn: { primaryEmailAddress: { emailAddress: string; verification: { status: string } } } | null = null;
let entitled = false;
let uploaded: Record<string, number> = {};

mock.module("@clerk/nextjs/server", () => ({ currentUser: async () => signedIn }));
mock.module("@/lib/entitlements", () => ({ getEntitlementByEmail: async () => ({ hasEntitlement: entitled, packageBundle: null }) }));
mock.module("@/lib/db", () => ({ sql: () => async () => Object.entries(uploaded).map(([slug, duration_s]) => ({ slug, duration_s })) }));

const { GET } = await import("./route");
const call = (slug: string) => GET(new Request(`http://x/api/v1/sessions/${slug}/access`), { params: Promise.resolve({ slug }) });
const buyer = { primaryEmailAddress: { emailAddress: "a@example.com", verification: { status: "verified" } } };

beforeEach(() => {
  signedIn = null;
  entitled = false;
  uploaded = { "made-lando-stack": 1640, "look-lit-room": 4200, "look-lit-room-2": 2760, unlisted: 60 };
});

describe("GET /api/v1/sessions/[slug]/access", () => {
  test("signed out is 401 and says nothing about the session", async () => {
    const res = await call("made-lando-stack");
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("npt");
  });
  test("signed in without a purchase is 403", async () => {
    signedIn = buyer;
    expect((await call("made-lando-stack")).status).toBe(403);
  });
  test("a buyer gets the preview of an uploaded session, uncacheable", async () => {
    signedIn = buyer;
    entitled = true;
    const res = await call("made-lando-stack");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({ email: "a@example.com", session: { poster: "npt:4:00", seconds: 1640 }, takes: [] });
  });
  test("a buyer gets no session for a piece without one, or one not uploaded", async () => {
    signedIn = buyer;
    entitled = true;
    expect(await (await call("toast")).json()).toEqual({ email: "a@example.com", session: null, takes: [] });
    uploaded = {};
    expect(await (await call("made-lando-stack")).json()).toEqual({ email: "a@example.com", session: null, takes: [] });
  });
  test("a buyer gets the later sessions of a piece that are uploaded, in order, and no other slug", async () => {
    signedIn = buyer;
    entitled = true;
    const body = await (await call("look-lit-room")).json();
    expect(body.session).toEqual({ poster: "npt:45:00", seconds: 4200 });
    expect(body.takes.map((t: { slug: string; seconds: number }) => [t.slug, t.seconds])).toEqual([["look-lit-room-2", 2760]]);
    uploaded["look-lit-room-3"] = 2400;
    const all = await (await call("look-lit-room")).json();
    expect(all.takes.map((t: { slug: string }) => t.slug)).toEqual(["look-lit-room-2", "look-lit-room-3"]);
    expect(JSON.stringify(all)).not.toContain("unlisted");
  });
  test("without a purchase the later sessions are not listed", async () => {
    expect(await (await call("look-lit-room")).text()).not.toContain("look-lit-room-2");
    signedIn = buyer;
    const res = await call("look-lit-room");
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain("look-lit-room-2");
  });
  test("a later session is not a piece of its own", async () => {
    signedIn = buyer;
    entitled = true;
    expect((await call("look-lit-room-2")).status).toBe(404);
  });
  test("an unknown piece is 404", async () => {
    signedIn = buyer;
    entitled = true;
    expect((await call("missing")).status).toBe(404);
  });
});
