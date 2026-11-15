import { describe, expect, test } from "bun:test";
import { gateSession, verifiedPrimaryEmail } from "./session-access";

const user = (status: string | null) => ({
  primaryEmailAddress: { emailAddress: "b@example.com", verification: status ? { status } : null },
});

describe("gateSession", () => {
  test("signed out is 401", async () => {
    expect(await gateSession(null, async () => true)).toMatchObject({ ok: false, status: 401 });
  });
  test("unverified primary email is 403 and never asks for ownership", async () => {
    let asked = false;
    const r = await gateSession(user("unverified"), async () => {
      asked = true;
      return true;
    });
    expect(r).toMatchObject({ ok: false, status: 403, code: "auth.unverified-email" });
    expect(asked).toBe(false);
  });
  test("no primary email is 403", async () => {
    expect(await gateSession({ primaryEmailAddress: null }, async () => true)).toMatchObject({ ok: false, status: 403 });
  });
  test("verified but not entitled is 403", async () => {
    expect(await gateSession(user("verified"), async () => false)).toMatchObject({ ok: false, status: 403, code: "auth.not-entitled" });
  });
  test("verified and entitled passes with the email", async () => {
    expect(await gateSession(user("verified"), async () => true)).toEqual({ ok: true, email: "b@example.com" });
  });
  test("verifiedPrimaryEmail ignores unverified", () => {
    expect(verifiedPrimaryEmail(user(null))).toBeNull();
  });
});
