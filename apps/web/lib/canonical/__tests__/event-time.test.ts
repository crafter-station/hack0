import { describe, expect, test } from "bun:test";
import { compareEventsUpcomingFirst, eventDurationMinutes, eventTemporalStatus, summarizeEventCounts } from "../event-time";

const NOW = Date.parse("2026-07-28T12:00:00.000Z");

describe("event temporal status", () => {
  test("uses the current instant and end time for ongoing events", () => {
    expect(
      eventTemporalStatus(
        {
          startAt: "2026-07-28T11:00:00-00:00",
          endAt: "2026-07-28T13:00:00Z",
        },
        NOW,
      ),
    ).toBe("ongoing");
  });

  test("classifies ended, future, and invalid events", () => {
    expect(eventTemporalStatus({ startAt: "2026-07-28T08:00:00-05:00" }, NOW)).toBe("upcoming");
    expect(eventTemporalStatus({ startAt: "2026-07-28T08:00:00Z", endAt: "2026-07-28T10:00:00Z" }, NOW)).toBe("past");
    expect(eventTemporalStatus({ startAt: "not-a-date" }, NOW)).toBe("unknown");
  });

  test("orders ongoing, future, past, then unknown", () => {
    const events = [
      { id: "unknown", name: "Unknown", startAt: "invalid" },
      { id: "old", name: "Old", startAt: "2026-07-20T12:00:00Z" },
      { id: "future", name: "Future", startAt: "2026-07-29T12:00:00Z" },
      {
        id: "live",
        name: "Live",
        startAt: "2026-07-28T11:00:00Z",
        endAt: "2026-07-28T13:00:00Z",
      },
    ];
    events.sort((a, b) => compareEventsUpcomingFirst(a, b, NOW));
    expect(events.map((event) => event.id)).toEqual(["live", "future", "old", "unknown"]);
  });

  test("calculates duration only from a valid interval", () => {
    expect(
      eventDurationMinutes({
        startAt: "2026-07-28T10:00:00Z",
        endAt: "2026-07-28T11:30:00Z",
      }),
    ).toBe(90);
    expect(eventDurationMinutes({ startAt: "2026-07-28T10:00:00Z" })).toBeNull();
  });

  test("summarizes ongoing events as upcoming and keeps unknown dates visible", () => {
    expect(
      summarizeEventCounts(
        [
          { startAt: "2026-07-28T11:00:00Z", endAt: "2026-07-28T13:00:00Z" },
          { startAt: "2026-07-29T12:00:00Z" },
          { startAt: "2026-07-27T12:00:00Z" },
          { startAt: "unknown" },
        ],
        NOW,
      ),
    ).toEqual({ total: 4, upcoming: 2, past: 1, unknown: 1 });
  });
});
