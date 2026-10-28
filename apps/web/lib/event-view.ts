import type { CalendarEvent } from "@/lib/calendar";
import { SITE } from "@/lib/site";

const fmt = (timeZone: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es", { timeZone, ...options });

/** Everything the event page shows about when: a calendar tile, a long date and a time range in the event's zone. */
export function eventWhen(e: CalendarEvent) {
  const start = new Date(e.startAt);
  const end = e.endAt ? new Date(e.endAt) : null;
  const tz = e.timezone;
  const time = (d: Date) => fmt(tz, { hour: "2-digit", minute: "2-digit" }).format(d);
  const sameDay = end && fmt(tz, { dateStyle: "short" }).format(start) === fmt(tz, { dateStyle: "short" }).format(end);
  const city = tz.split("/").pop()?.replace(/_/g, " ");
  return {
    weekday: fmt(tz, { weekday: "short" }).format(start).replace(".", ""),
    dayNumber: fmt(tz, { day: "numeric" }).format(start),
    month: fmt(tz, { month: "short" }).format(start).replace(".", ""),
    longDate: fmt(tz, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start),
    range: end && sameDay ? `${time(start)} – ${time(end)}` : time(start),
    zone: city ? `hora de ${city}` : tz,
  };
}

const PROVIDERS: [RegExp, string][] = [
  [/(^|\.)(luma\.com|lu\.ma)$/, "Luma"],
  [/(^|\.)meetup\.com$/, "Meetup"],
  [/(^|\.)eventbrite\./, "Eventbrite"],
];

/** The site the registration lives on, for the button label. */
export function providerName(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return PROVIDERS.find(([re]) => re.test(host))?.[1] ?? host;
}

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Google Calendar's prefilled event URL. */
export function googleCalendarUrl(e: CalendarEvent) {
  const end = e.endAt ?? new Date(new Date(e.startAt).getTime() + 60 * 60 * 1000).toISOString();
  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: e.name,
    dates: `${stamp(new Date(e.startAt).toISOString())}/${stamp(new Date(end).toISOString())}`,
    details: `${e.url}\n\n${SITE}/eventos/${e.slug}`,
    location: e.online ? e.url : (e.address ?? e.city ?? ""),
  });
  return `https://calendar.google.com/calendar/render?${qs}`;
}

const escapeIcs = (v: string) => v.replace(/[;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** A one-event iCalendar file (RFC 5545) for Apple Calendar, Outlook and the rest. */
export function icsFor(e: CalendarEvent) {
  const end = e.endAt ?? new Date(new Date(e.startAt).getTime() + 60 * 60 * 1000).toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hack0//eventos//ES",
    "BEGIN:VEVENT",
    `UID:${e.id}@hack0.dev`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(new Date(e.startAt).toISOString())}`,
    `DTEND:${stamp(new Date(end).toISOString())}`,
    `SUMMARY:${escapeIcs(e.name)}`,
    `DESCRIPTION:${escapeIcs(`${e.url}\n${SITE}/eventos/${e.slug}`)}`,
    `LOCATION:${escapeIcs(e.online ? e.url : (e.address ?? e.city ?? ""))}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** The description without a first paragraph that only repeats the title. */
export function bodyOf(name: string, description: string | null) {
  if (!description) return null;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const [first, ...rest] = description.split(/\n{2,}/);
  return first && norm(first.replace(/^#+\s*/, "")) === norm(name) ? rest.join("\n\n") || null : description;
}
