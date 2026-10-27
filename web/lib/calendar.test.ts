import { expect, test } from "bun:test";
import { groupSpots, metroOf, toEvent } from "./calendar";

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

test("groups nearby events into one spot and flags upcoming ones", () => {
  const base = {
    name: "x",
    url: "y",
    timezone: "UTC",
    city: null,
    online: false,
    coverUrl: null,
    slug: "x",
    endAt: null,
    country: null,
    metro: null,
    address: null,
    tags: [],
  };
  const spots = groupSpots(
    [
      { ...base, id: "1", startAt: "2026-01-01T00:00:00Z", location: [-12.09, -77.03] },
      { ...base, id: "2", startAt: "2026-12-01T00:00:00Z", location: [-12.1, -77.04] },
      { ...base, id: "3", startAt: "2026-12-01T00:00:00Z", location: null },
    ],
    Date.parse("2026-10-27T00:00:00Z"),
  );
  expect(spots).toHaveLength(1);
  expect(spots[0]).toMatchObject({ count: 2, upcoming: true });
});

test("reads the Luma coordinate", () => {
  expect(toEvent({ name: "x", url: "y", start_at: "2026-01-01", coordinate: { latitude: -12, longitude: -77 } })?.location).toEqual([
    -12, -77,
  ]);
});

test("builds a stable slug, public-only address and clean tags", () => {
  const e = toEvent({
    api_id: "evt-2",
    name: "Cursor Meetup: Lima Edición",
    url: "https://luma.com/1z4no5h8",
    start_at: "2026-01-01",
    visibility: "public",
    location_visibility: "guests-only",
    geo_address_json: { city: "Lima", country: "PE", full_address: "Av. Secreta 123" },
    tags: [{ name: "Cursor" }, { name: "🇵🇪 Perú" }, { name: "📍 Online" }],
  });
  expect(e?.slug).toBe("cursor-meetup-lima-edicion-1z4no5h8");
  expect(e?.address).toBeNull();
  expect(e?.tags).toEqual(["Cursor"]);
});

test("drops private events", () => {
  expect(toEvent({ name: "x", url: "y", start_at: "2026-01-01", visibility: "private" })).toBeNull();
});

test("rolls districts up to their metro area", () => {
  expect(metroOf("Barranco", "Provincia de Lima")).toBe("Lima");
  expect(metroOf("Cayma", "Arequipa")).toBe("Arequipa");
  expect(metroOf("Medellín", "Antioquia")).toBe("Medellín");
  expect(metroOf("Bellavista", "Provincia Constitucional del Callao")).toBe("Callao");
  expect(metroOf("Miraflores", "Lima Province")).toBe("Lima");
  expect(metroOf("Vitacura", "Región Metropolitana")).toBe("Santiago");
  expect(metroOf("M5519BDK", "Mendoza")).toBe("Mendoza");
});
