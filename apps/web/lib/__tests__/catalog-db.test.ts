import { expect, test } from "bun:test";
import { rowToEvent } from "../catalog-db";

const row = {
  id: "00000000-0000-0000-0000-000000000001",
  canonicalKey: "luma:evt-1",
  identityFingerprint: "fp",
  lumaEventId: "evt-1",
  externalIds: {},
  name: "Cursor Meetup: Lima Edición",
  description: null,
  url: "https://luma.com/1z4no5h8",
  coverUrl: null,
  startAt: new Date("2026-11-05T23:00:00.000Z"),
  endAt: null,
  timezone: null,
  city: "Barranco, Lima",
  region: null,
  countryCode: "PE",
  venueName: null,
  venueAddress: null,
  latitude: null,
  longitude: null,
  isOnline: false,
  format: "in_person",
  languageCode: "es",
  hostName: null,
  topics: [],
  audience: [],
  level: null,
  tags: ["meetup"],
  enrichment: {},
  enrichedAt: null,
  curated: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("a catalog row keeps the slug the Luma-backed pages already published", () => {
  const e = rowToEvent(row);
  expect(e.slug).toBe("cursor-meetup-lima-edicion-1z4no5h8");
  expect(e.id).toBe("evt-1");
});

test("a district in Luma's city_state rolls up to its metro", () => {
  expect(rowToEvent(row).metro).toBe("Lima");
  expect(rowToEvent(row).city).toBe("Barranco, PE");
});
