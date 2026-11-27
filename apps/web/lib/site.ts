import { type CalendarEvent, placeLabel } from "./calendar";
import { eventMetro } from "./page-keys";

export const SITE = "https://hack0.dev";
export const LUMA = "https://luma.com/hack0";
export const GITHUB = "https://github.com/crafter-station/hack0";
export const CRAFTER = "https://crafter.run";

/** One line that says what hack0 is, used in metadata, /about and llms.txt. */
export const TAGLINE = "hack0 es el calendario abierto de Crafter Station: eventos, comunidades y ecosistema tech de Latinoamérica.";

export const AUTHORS = [
  {
    id: "https://www.railly.dev/#person",
    name: "Railly Hugo",
    role: "Fundador de Crafter Station",
    url: `${CRAFTER}/es/team/railly`,
    github: "https://github.com/Railly",
  },
  {
    id: "https://crafter.run/en/team/nacho#person",
    name: "Ignacio Velásquez",
    role: "Growth y automatización en Crafter Station",
    url: `${CRAFTER}/es/team/nacho`,
    github: "https://github.com/TheVeller",
  },
];

/** schema.org Organization for hack0, tied to Crafter Station's own node on crafter.run. */
export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "hack0",
  alternateName: ["hack0.dev", "hack0 by Crafter Station"],
  url: SITE,
  logo: `${SITE}/icon.svg`,
  description: TAGLINE,
  disambiguatingDescription:
    "Calendario de eventos y comunidades tech de Latinoamérica creado por Crafter Station. No tiene relación con el nodo Hack0 de BTCPay Server.",
  parentOrganization: {
    "@type": "Organization",
    "@id": `${CRAFTER}/#organization`,
    name: "Crafter Station",
    url: CRAFTER,
    sameAs: ["https://www.linkedin.com/company/crafter-station"],
  },
  founder: AUTHORS.map((a) => ({ "@type": "Person", "@id": a.id, name: a.name, url: a.url, sameAs: [a.github] })),
  areaServed: { "@type": "Place", name: "Latin America" },
  sameAs: [LUMA, "https://www.linkedin.com/company/hack0-dev", GITHUB],
};

export function formatDate(e: CalendarEvent) {
  const d = new Date(e.startAt);
  const day = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric", timeZone: e.timezone }).format(d);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: e.timezone }).format(d);
  return { day, time };
}

/** JSON-LD for an event, per schema.org/Event. */
export function eventJsonLd(e: CalendarEvent, description?: string | null, hosts: { name: string; slug: string }[] = []) {
  return { "@context": "https://schema.org", ...eventNode(e, description, hosts) };
}

/** ItemList for a listing: upcoming events carry their full Event so search can show them as events; past ones are links. */
export function eventListJsonLd(name: string, upcoming: CalendarEvent[], past: CalendarEvent[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: upcoming.length + past.length,
    itemListElement: [
      ...upcoming.map((e, i) => ({ "@type": "ListItem", position: i + 1, item: eventNode(e) })),
      ...past.map((e, i) => ({ "@type": "ListItem", position: upcoming.length + i + 1, url: `${SITE}/eventos/${e.slug}` })),
    ],
  };
}

function eventNode(e: CalendarEvent, description?: string | null, hosts: { name: string; slug: string }[] = []) {
  const place = e.online
    ? { "@type": "VirtualLocation", url: e.url }
    : {
        "@type": "Place",
        name: placeLabel(e) || "LATAM",
        address: {
          "@type": "PostalAddress",
          streetAddress: e.address ?? undefined,
          addressLocality: eventMetro(e.metro) ?? undefined,
          addressCountry: e.country ?? undefined,
        },
      };
  return {
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
