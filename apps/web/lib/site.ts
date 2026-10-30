import { type CalendarEvent, placeLabel } from "./calendar";

export const SITE = "https://hack0.dev";
export const LUMA = "https://luma.com/hack0";

export function formatDate(e: CalendarEvent) {
  const d = new Date(e.startAt);
  const day = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric", timeZone: e.timezone }).format(d);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: e.timezone }).format(d);
  return { day, time };
}

/** JSON-LD for an event, per schema.org/Event. */
export function eventJsonLd(e: CalendarEvent, description?: string | null, hosts: { name: string; slug: string }[] = []) {
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
    organizer: hosts.length
      ? hosts.map((h) => ({ "@type": "Organization", name: h.name, url: `${SITE}/comunidades/${h.slug}` }))
      : { "@type": "Organization", name: "hack0", url: SITE },
  };
}
