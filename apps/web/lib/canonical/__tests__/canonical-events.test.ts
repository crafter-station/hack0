import { describe, expect, test } from "bun:test";
import { canonicalizeEvents, canonicalKeyFor, normalizeCanonicalUrl, sourceDTO } from "../canonical-events";

describe("canonical events", () => {
  test("uses a Luma event id as the strongest canonical key", () => {
    const key = canonicalKeyFor({
      sourceType: "api",
      event: {
        id: "evt-abc123",
        name: "Agents Night",
        coverUrl: null,
        url: "https://luma.com/agents-night",
        startAt: "2026-08-01T00:00:00.000Z",
      },
      externalEventId: "evt-abc123",
    });
    expect(key).toBe("luma:evt-abc123");
  });

  test("merges duplicate sightings into one canonical event with sources", () => {
    const events = canonicalizeEvents([
      {
        sourceType: "api",
        calendarId: "cal-main",
        calendarName: "Main",
        externalEventId: "evt-abc123",
        event: {
          id: "evt-abc123",
          name: "Agents Night",
          coverUrl: null,
          url: "https://luma.com/agents-night",
          startAt: "2026-08-01T00:00:00.000Z",
          calendarId: "cal-main",
          calendarName: "Main",
        },
      },
      {
        sourceType: "calendar_scrape",
        calendarId: "scr-cal-main",
        calendarName: "Public Main",
        externalEventId: "evt-abc123",
        event: {
          id: "evt-abc123",
          name: "Agents Night",
          coverUrl: "https://images.lu.ma/agents.jpg",
          url: "https://lu.ma/agents-night?utm=calendar",
          startAt: "2026-08-01T00:00:00.000Z",
          calendarId: "scr-cal-main",
          calendarName: "Public Main",
        },
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].externalIds.lumaEventId).toBe("evt-abc123");
    expect(events[0].sources.map((s) => s.sourceType).sort()).toEqual(["api", "calendar_scrape"]);
  });

  test("merges a profile URL sighting with a Luma id sighting", () => {
    const event = {
      id: "scr-profile",
      name: "Shared event",
      coverUrl: null,
      url: "https://luma.com/shared-event",
      startAt: "2026-08-01T12:00:00.000Z",
    };
    const result = canonicalizeEvents([
      {
        event,
        sourceType: "profile_scrape",
        externalEventId: "scr-profile",
        sourceUrl: event.url,
      },
      {
        event: { ...event, id: "evt-real" },
        sourceType: "calendar_scrape",
        externalEventId: "evt-real",
        sourceUrl: `${event.url}?utm_source=calendar`,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].externalIds.lumaEventId).toBe("evt-real");
    expect(result[0].sources).toHaveLength(2);
  });

  test("normalizes lu.ma and luma.com as the same public event URL", () => {
    expect(normalizeCanonicalUrl("https://lu.ma/shared-event?utm_source=calendar")).toBe("https://luma.com/shared-event");
  });

  test("merges calendar sightings with the same name and start instant", () => {
    const base = {
      name: "AI Builders Night",
      coverUrl: null,
      startAt: "2026-08-01T19:00:00-05:00",
    };
    const result = canonicalizeEvents([
      {
        sourceType: "calendar_scrape",
        calendarId: "cal-one",
        externalEventId: "scr-one",
        event: { ...base, id: "scr-one", url: "https://luma.com/builders-night" },
      },
      {
        sourceType: "calendar_scrape",
        calendarId: "cal-two",
        externalEventId: "scr-two",
        event: {
          ...base,
          id: "scr-two",
          url: "https://events.example.com/ai-builders",
          startAt: "2026-08-02T00:00:00Z",
        },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].sources).toHaveLength(2);
  });

  test("does not merge recurring events at different times", () => {
    const common = {
      name: "Weekly Meetup",
      coverUrl: null,
      url: "https://events.example.com/weekly",
    };
    const result = canonicalizeEvents([
      {
        sourceType: "calendar_scrape",
        event: { ...common, id: "one", startAt: "2026-08-01T12:00:00Z" },
      },
      {
        sourceType: "calendar_scrape",
        event: {
          ...common,
          id: "two",
          url: "https://events.example.com/weekly-2",
          startAt: "2026-08-08T12:00:00Z",
        },
      },
    ]);
    expect(result).toHaveLength(2);
  });

  test("uses the authoritative snapshot time on synchronized sources", () => {
    const lastSyncedAt = "2026-07-27T12:34:56.000Z";
    const source = sourceDTO({
      event: {
        id: "evt-api",
        name: "API event",
        coverUrl: null,
        url: "https://luma.com/api-event",
        startAt: "2026-08-01T12:00:00Z",
      },
      sourceType: "api",
      calendarRowId: "row-api",
      calendarId: "cal-api",
      externalEventId: "evt-api",
      lastSyncedAt,
    });
    expect(source.lastSyncedAt).toBe(lastSyncedAt);
  });
});

describe("merging keeps every alias on the merged event", () => {
  const base = { name: "Cursor Meetup Lima", coverUrl: null, startAt: "2026-11-05T23:00:00.000Z" };
  test("a third sighting by an earlier alias joins the same event", () => {
    const events = canonicalizeEvents([
      { sourceType: "api", event: { ...base, id: "evt-1", url: "https://luma.com/cursor-lima" } },
      {
        sourceType: "eventbrite_public",
        provider: "eventbrite",
        event: { ...base, id: "999", url: "https://eventbrite.com/e/cursor-999" },
      },
      { sourceType: "calendar_scrape", calendarId: "cal-2", event: { ...base, id: "evt-1", url: "https://luma.com/cursor-lima" } },
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]?.sources).toHaveLength(3);
    expect(events[0]?.externalIds.eventbriteEventId).toBe("999");
  });
});
