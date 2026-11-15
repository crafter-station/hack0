import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "./db";
import { getEntitlementByEmail } from "./entitlements";
import { grant } from "./grant";

// Runs against a throwaway Postgres: TEST_DATABASE_URL=postgres://localhost/hack0_test bun test
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;
const workshop = "entitlements-test-ws";

beforeAll(async () => {
  if (!url) return;
  process.env.DATABASE_URL = url;
  delete process.env.RESEND_API_KEY;
  const db = sql();
  await db`delete from buyers where email = 'buyer@example.com'`;
  await db`delete from packages where id = ${workshop}`;
  await db`insert into packages (id, version, title, free, bundle) values (${workshop}, '1.0.0', 'T', false, ${JSON.stringify({ files: [{ path: "a" }], links: [] })}::text::jsonb)`;
  await grant("Buyer@Example.com", workshop, "grant", "test");
});

run("getEntitlementByEmail", () => {
  test("entitled email gets the bundle, case-insensitive", async () => {
    const r = await getEntitlementByEmail("BUYER@example.com ", workshop);
    expect(r.hasEntitlement).toBe(true);
    expect(r.packageBundle?.files).toHaveLength(1);
  });
  test("unknown email gets nothing", async () => {
    expect(await getEntitlementByEmail("nobody@example.com", workshop)).toEqual({ hasEntitlement: false, packageBundle: null });
  });
  test("entitled to another workshop gets nothing", async () => {
    expect((await getEntitlementByEmail("buyer@example.com", "other")).hasEntitlement).toBe(false);
  });
});
