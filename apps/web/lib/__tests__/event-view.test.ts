import { describe, expect, test } from "bun:test";
import type { CalendarEvent } from "@/lib/calendar";
import { bodyOf, eventWhen, icsFor, providerName } from "@/lib/event-view";
import { accentOf } from "@/lib/tint";

const event: CalendarEvent = {
  id: "evt-1",
  name: "Replit Building Nights",
  url: "https://luma.com/qgaydqcv",
  startAt: "2026-10-29T23:30:00.000Z",
  endAt: "2026-10-30T03:00:00.000Z",
  timezone: "America/Lima",
  city: "Barranco",
  online: false,
  coverUrl: null,
  location: null,
  slug: "replit-building-nights-qgaydqcv",
  country: "PE",
  metro: "Lima",
  address: "Av. El Sol Oeste 145, Barranco",
  tags: [],
};

const pixels = (parts: [number, [number, number, number]][]) =>
  Uint8Array.from(parts.flatMap(([n, rgb]) => Array.from({ length: n }, () => rgb).flat()));

describe("event page helpers", () => {
  test("when: long date and a same-day range in the event's zone", () => {
    expect(eventWhen(event)).toMatchObject({ dayNumber: "29", range: "18:30 – 22:00", zone: "hora de Lima" });
  });

  test("the register button names the site the registration lives on", () => {
    expect(providerName("https://www.meetup.com/awsperu/events/1/")).toBe("Meetup");
    expect(providerName("https://lu.ma/x")).toBe("Luma");
  });

  test("a first paragraph that only repeats the title is dropped", () => {
    expect(bodyOf("Replit Building Nights", "Replit building nights!\n\nTraé tu laptop.")).toBe("Traé tu laptop.");
    expect(bodyOf("Replit Building Nights", "Traé tu laptop.")).toBe("Traé tu laptop.");
  });

  test("the calendar file carries UTC times and escapes commas", () => {
    const ics = icsFor(event);
    expect(ics).toContain("DTSTART:20261029T233000Z");
    expect(ics).toContain("LOCATION:Av. El Sol Oeste 145\\, Barranco");
  });

  test("a cover's accent is its largest vivid area; a gray cover has none", () => {
    const teal = accentOf(
      pixels([
        [900, [30, 30, 30]],
        [100, [20, 160, 140]],
      ]),
    );
    expect(teal).toBe("#14a08c");
    expect(accentOf(pixels([[1000, [120, 120, 120]]]))).toBeNull();
  });
});
