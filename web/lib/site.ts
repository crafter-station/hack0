import { allEvents, type CalendarEvent, cityKey, placeLabel, slugify } from "./calendar";

export const SITE = "https://hack0.dev";
export const LUMA = "https://luma.com/hack0";

export type Hub = { slug: string; name: string; events: CalendarEvent[] };

function group(events: CalendarEvent[], keys: (e: CalendarEvent) => [string, string][]): Hub[] {
  const hubs = new Map<string, Hub>();
  for (const e of events) {
    for (const [slug, name] of keys(e)) {
      const hub = hubs.get(slug) ?? { slug, name, events: [] };
      hub.events.push(e);
      hubs.set(slug, hub);
    }
  }
  return [...hubs.values()].sort((a, b) => b.events.length - a.events.length);
}

/** Calendar snapshot plus the city and topic hubs derived from it. */
export async function catalog() {
  const events = (await allEvents()) ?? [];
  const cities = group(events, (e) => {
    const key = cityKey(e);
    return key && e.metro ? [[key, e.metro]] : [];
  });
  const tags = group(events, (e) => e.tags.map((t) => [slugify(t), t] as [string, string]));
  return { events, cities, tags };
}

export function splitByTime(events: CalendarEvent[], now = Date.now()) {
  const upcoming = events.filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= now);
  const past = events.filter((e) => new Date(e.endAt ?? e.startAt).getTime() < now).reverse();
  return { upcoming, past };
}

export function formatDate(e: CalendarEvent) {
  const d = new Date(e.startAt);
  const day = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric", timeZone: e.timezone }).format(d);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: e.timezone }).format(d);
  return { day, time };
}

/** JSON-LD for an event, per schema.org/Event. */
export function eventJsonLd(e: CalendarEvent, description?: string | null) {
  const place = e.online
    ? { "@type": "VirtualLocation", url: e.url }
    : {
        "@type": "Place",
        name: placeLabel(e) || "LATAM",
        address: {
          "@type": "PostalAddress",
          streetAddress: e.address ?? undefined,
          addressLocality: e.metro ?? undefined,
          addressCountry: e.country ?? undefined,
        },
      };
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    startDate: e.startAt,
    endDate: e.endAt ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: e.online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: place,
    image: e.coverUrl ? [e.coverUrl] : undefined,
    description: description ? description.replace(/[*_#>`[\]]/g, "").slice(0, 300) : undefined,
    url: `${SITE}/eventos/${e.slug}`,
    offers: { "@type": "Offer", url: e.url, availability: "https://schema.org/InStock" },
    organizer: { "@type": "Organization", name: "hack0", url: SITE },
  };
}
