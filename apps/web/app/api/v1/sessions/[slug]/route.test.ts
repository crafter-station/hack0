import { beforeEach, describe, expect, mock, test } from "bun:test";

let signedIn: { primaryEmailAddress: { emailAddress: string; verification: { status: string } } } | null = null;
let entitled = false;
const castGz = Buffer.from([0x1f, 0x8b, 1, 2, 3]);

mock.module("@clerk/nextjs/server", () => ({ currentUser: async () => signedIn }));
mock.module("@/lib/entitlements", () => ({ getEntitlementByEmail: async () => ({ hasEntitlement: entitled, packageBundle: null }) }));
mock.module("@/lib/db", () => ({
  sql:
    () =>
    async (_s: TemplateStringsArray, ...v: unknown[]) =>
      v[1] === "there" ? [{ b64: castGz.toString("base64") }] : [],
}));

const { GET } = await import("./route");
const call = (slug: string) => GET(new Request("http://x/api/v1/sessions/" + slug), { params: Promise.resolve({ slug }) });

beforeEach(() => {
  signedIn = null;
  entitled = false;
});

describe("GET /api/v1/sessions/[slug]", () => {
  test("signed out is 401 with no body of the cast", async () => {
    const res = await call("there");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-encoding")).toBeNull();
  });
  test("signed in without a purchase is 403", async () => {
    signedIn = { primaryEmailAddress: { emailAddress: "a@example.com", verification: { status: "verified" } } };
    expect((await call("there")).status).toBe(403);
  });
  test("entitled gets the gzip bytes, private and uncacheable", async () => {
    signedIn = { primaryEmailAddress: { emailAddress: "a@example.com", verification: { status: "verified" } } };
    entitled = true;
    const res = await call("there");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-encoding")).toBe("gzip");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(castGz);
  });
  test("entitled, unknown slug is 404", async () => {
    signedIn = { primaryEmailAddress: { emailAddress: "a@example.com", verification: { status: "verified" } } };
    entitled = true;
    expect((await call("missing")).status).toBe(404);
  });
});
