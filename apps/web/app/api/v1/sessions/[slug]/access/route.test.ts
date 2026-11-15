import { beforeEach, describe, expect, mock, test } from "bun:test";

let signedIn: { primaryEmailAddress: { emailAddress: string; verification: { status: string } } } | null = null;
let entitled = false;
let uploaded = true;

mock.module("@clerk/nextjs/server", () => ({ currentUser: async () => signedIn }));
mock.module("@/lib/entitlements", () => ({ getEntitlementByEmail: async () => ({ hasEntitlement: entitled, packageBundle: null }) }));
mock.module("@/lib/db", () => ({ sql: () => async () => (uploaded ? [{ duration_s: 1640 }] : []) }));

const { GET } = await import("./route");
const call = (slug: string) => GET(new Request(`http://x/api/v1/sessions/${slug}/access`), { params: Promise.resolve({ slug }) });
const buyer = { primaryEmailAddress: { emailAddress: "a@example.com", verification: { status: "verified" } } };

beforeEach(() => {
  signedIn = null;
  entitled = false;
  uploaded = true;
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
    expect(await res.json()).toEqual({ email: "a@example.com", session: { poster: "npt:4:00", seconds: 1640 } });
  });
  test("a buyer gets no session for a piece without one, or one not uploaded", async () => {
    signedIn = buyer;
    entitled = true;
    expect(await (await call("toast")).json()).toEqual({ email: "a@example.com", session: null });
    uploaded = false;
    expect(await (await call("made-lando-stack")).json()).toEqual({ email: "a@example.com", session: null });
  });
  test("an unknown piece is 404", async () => {
    signedIn = buyer;
    entitled = true;
    expect((await call("missing")).status).toBe(404);
  });
});
