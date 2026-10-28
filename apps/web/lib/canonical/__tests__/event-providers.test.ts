import { describe, expect, test } from "bun:test";
import { canonicalizeEvents, type SourceEventInput } from "../canonical-events";
import { detectProviderImportTarget, providerEventId, providerForUrl, providerSourceId } from "../event-providers";

describe("event providers", () => {
  test("detects supported provider URLs and stable external ids", () => {
    expect(providerForUrl("https://www.eventbrite.com/e/demo-tickets-123456789")).toBe("eventbrite");
    expect(providerEventId("eventbrite", "https://eventbrite.com/e/demo-tickets-123456789")).toBe("123456789");
    expect(providerForUrl("https://www.meetup.com/coders/events/309123456/")).toBe("meetup");
    expect(providerEventId("meetup", "https://www.meetup.com/coders/events/309123456/")).toBe("309123456");
    expect(providerSourceId("meetup", "https://www.meetup.com/coders/")).toBe("meetup:meetup.com/coders");
    expect(providerSourceId("meetup", "https://www.meetup.com/ProductTank-Lima?recSource=chapter-search")).toBe(
      "meetup:meetup.com/producttank-lima",
    );
  });

  test("detects provider-specific collection types for the unified importer", () => {
    expect(detectProviderImportTarget("https://www.eventbrite.com/o/builders-latam-123456789")).toMatchObject({
      provider: "eventbrite",
      kind: "organizer",
      confidence: "certain",
      supportedKinds: ["event", "organizer"],
    });
    expect(detectProviderImportTarget("https://www.meetup.com/coders/")).toMatchObject({
      provider: "meetup",
      kind: "group",
      providerSourceId: "meetup:meetup.com/coders",
    });
    expect(detectProviderImportTarget("https://www.meetup.com/coders/events/309123456/")).toMatchObject({
      provider: "meetup",
      kind: "event",
      providerSourceId: "meetup:event:309123456",
    });
    expect(detectProviderImportTarget("https://luma.com/user/demo")).toMatchObject({
      provider: "luma",
      kind: "profile",
    });
    expect(detectProviderImportTarget("https://example.com/events")).toBeNull();
  });

  test("deduplicates a cross-provider listing by event fingerprint and keeps both sources", () => {
    const base = {
      name: "Builders Night",
      coverUrl: null,
      startAt: "2026-08-01T00:00:00Z",
    };
    const inputs: SourceEventInput[] = [
      {
        provider: "eventbrite",
        sourceType: "eventbrite_public",
        externalEventId: "123",
        event: { ...base, id: "eventbrite-123", url: "https://eventbrite.com/e/night-123" },
      },
      {
        provider: "meetup",
        sourceType: "meetup_public",
        externalEventId: "456",
        event: { ...base, id: "meetup-456", url: "https://meetup.com/builders/events/456" },
      },
    ];

    const events = canonicalizeEvents(inputs);
    expect(events).toHaveLength(1);
    expect(events[0]?.externalIds).toMatchObject({
      eventbriteEventId: "123",
      meetupEventId: "456",
    });
    expect(events[0]?.sources.map((source) => source.provider).sort()).toEqual(["eventbrite", "meetup"]);
  });
});
