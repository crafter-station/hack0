import { afterEach, expect, test } from "bun:test";
import { fetchManagedDescription, fetchManagedEvents } from "../luma-api";
import fixture from "./luma-api.fixture.json";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("a real Luma list entry maps to a sighting with country, timezone and coordinates", async () => {
  globalThis.fetch = Object.assign(async () => Response.json(fixture), { preconnect: realFetch.preconnect });
  const [input] = await fetchManagedEvents("key", { id: "src", name: "hack0", calendarId: "cal-1" });
  expect(input?.provider).toBe("luma");
  expect(input?.event.id).toMatch(/^evt-/);
  expect(input?.event.timezone).toBe("America/Lima");
  expect(input?.event.enrichment?.countryCode).toBe("PE");
  expect(input?.event.enrichment?.latitude).toBeNumber();
  // The fixture's host keeps the address to guests only, so it must not leak.
  expect(input?.event.enrichment?.venueAddress).toBeNull();
});

test("an event the calendar only lists answers 403 and has no description, without failing", async () => {
  globalThis.fetch = Object.assign(async () => new Response("forbidden", { status: 403 }), { preconnect: realFetch.preconnect });
  expect(await fetchManagedDescription("key", "evt-x")).toBeNull();
});
