import { describe, expect, it } from "bun:test";
import { calendarSourcePriority, chooseCanonicalCalendar, lumaCalendarIdFromValues, normalizeCalendarAlias } from "../calendar-identity";

describe("canonical calendar identity", () => {
  it("extracts one identity from API, synthetic, direct, and manage forms", () => {
    const id = "cal-bNk2zfu3F4QK6Oc";
    expect(lumaCalendarIdFromValues({ calendarId: id })).toBe(id);
    expect(lumaCalendarIdFromValues({ calendarId: `scr-${id}` })).toBe(id);
    expect(
      lumaCalendarIdFromValues({
        url: `https://luma.com/calendar/${id}`,
      }),
    ).toBe(id);
    expect(
      lumaCalendarIdFromValues({
        url: `https://luma.com/calendar/manage/${id}`,
      }),
    ).toBe(id);
    expect(
      lumaCalendarIdFromValues({
        sourceMetadata: { lumaCalendarId: id },
      }),
    ).toBe(id);
  });

  it("normalizes legacy URLs into the same permanent alias", () => {
    expect(normalizeCalendarAlias("https://lu.ma/calendar/manage/cal-FLIT123/?utm_source=old#events")).toBe(
      "https://luma.com/calendar/cal-flit123",
    );
    expect(normalizeCalendarAlias("SCR-cal-FLIT123")).toBe("scr-cal-flit123");
  });

  it("prefers API, then a successfully synchronized public source", () => {
    const pending = {
      id: "pending",
      source: "scrape" as const,
      sourceKind: "calendar" as const,
      syncStatus: "queued",
      createdAt: "2026-01-01T00:00:00Z",
    };
    const synced = {
      ...pending,
      id: "synced",
      syncStatus: "completed",
      createdAt: "2026-02-01T00:00:00Z",
    };
    const api = {
      ...pending,
      id: "api",
      source: "api" as const,
      sourceKind: "api" as const,
      createdAt: "2026-03-01T00:00:00Z",
    };
    expect(calendarSourcePriority(api)).toBe(3);
    expect(calendarSourcePriority(synced)).toBe(2);
    expect(chooseCanonicalCalendar([pending, synced, api])?.id).toBe("api");
    expect(chooseCanonicalCalendar([pending, synced])?.id).toBe("synced");
  });

  it("does not infer a calendar identity for profiles or standalone events", () => {
    expect(
      lumaCalendarIdFromValues({
        calendarId: "scr-profile-abc",
        url: "https://luma.com/user/theveller",
      }),
    ).toBeNull();
    expect(lumaCalendarIdFromValues({ calendarId: "scr-standalone-user" })).toBeNull();
  });
});
