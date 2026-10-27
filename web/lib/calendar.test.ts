import { expect, test } from "bun:test";
import { toEvent } from "./calendar";

test("maps a Luma entry with a relative url and city", () => {
  const e = toEvent({
    status: "approved",
    event: {
      api_id: "evt-1",
      name: "Replit Building Nights",
      url: "abc123",
      start_at: "2026-10-29T23:30:00Z",
      timezone: "America/Lima",
      geo_address_json: { city: "Barranco", country: "Peru" },
    },
  });
  expect(e?.url).toBe("https://luma.com/abc123");
  expect(e?.city).toBe("Barranco, Peru");
  expect(e?.online).toBe(false);
});

test("drops unapproved and incomplete entries", () => {
  expect(toEvent({ status: "pending", event: { name: "x", url: "y", start_at: "2026-01-01" } })).toBeNull();
  expect(toEvent({ event: { name: "x" } })).toBeNull();
});

test("marks events without a city but with a meeting url as online", () => {
  expect(toEvent({ event: { name: "x", url: "y", start_at: "2026-01-01", meeting_url: "https://zoom.us/j/1" } })?.online).toBe(true);
});

test("accepts the flat event shape the API returns today", () => {
  const e = toEvent({
    id: "evt-2",
    name: "Del dato a la nube",
    url: "https://luma.com/xyz",
    start_at: "2026-10-29T21:00:00Z",
    geo_address_json: { city: "San Isidro", country: "Peru" },
  });
  expect(e?.id).toBe("evt-2");
  expect(e?.city).toBe("San Isidro, Peru");
});
