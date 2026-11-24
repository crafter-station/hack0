import type { CalendarEvent } from "./calendar";
import { eventMetro } from "./page-keys";
import type { SearchResult } from "./search";
import { LUMA, SITE } from "./site";

type Faq = { q: string; a: string }[];

export const faqJsonLd = (faq: Faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

/** schema.org WebSite with the /eventos search, so search engines can offer a search box for hack0. */
export const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  name: "hack0",
  url: SITE,
  inLanguage: "es",
  publisher: { "@id": `${SITE}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE}/eventos?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export function listEs(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** What the upcoming agenda covers, read from the unfiltered /eventos search. */
type Agenda = { total: number; countries: number; cities: string[]; next: CalendarEvent[] };

export function agendaFrom(result: SearchResult): Agenda {
  return {
    total: result.total,
    countries: result.facets.paises.length,
    cities: metroRanking(result.facets.ciudades),
    next: result.events,
  };
}

/** Facet cities merged into their metro hub ("Zapopan" counts for Guadalajara), busiest first. */
function metroRanking(cities: { label: string; count: number }[]) {
  const counts = new Map<string, number>();
  for (const c of cities) {
    const metro = eventMetro(c.label);
    if (metro) counts.set(metro, (counts.get(metro) ?? 0) + c.count);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/** One sentence with the agenda's real numbers, for intros. */
export function agendaSentence(a: Agenda) {
  const top = listEs(a.cities.slice(0, 5));
  const countries = a.countries === 1 ? "1 país" : `${a.countries} países`;
  const cities = a.cities.length === 1 ? "1 ciudad" : `${a.cities.length} ciudades`;
  return `Ahora mismo hay ${a.total} eventos tech próximos en ${countries} y ${cities}${top ? `, con más agenda en ${top}` : ""}.`;
}

/** Questions people search about tech events in LATAM, answered from the live catalog so the numbers stay true. */
export function homeFaq(agenda: Agenda, communities: number, orgs: number): Faq {
  const next = listEs(agenda.next.slice(0, 3).map((e) => e.name));
  return [
    {
      q: "¿Qué eventos tech hay en LATAM?",
      a: `hack0 reúne hackathones, meetups, workshops y conferencias de toda Latinoamérica. ${agendaSentence(agenda)}${next ? ` Los siguientes son ${next}.` : ""}`,
    },
    {
      q: "¿Dónde encuentro hackathones en Latinoamérica?",
      a: `En ${SITE}/tema/hackathon están los hackathones de LATAM, con fecha, lugar y registro. También puedes filtrar por ciudad, como ${SITE}/ciudad/lima o ${SITE}/ciudad/bogota.`,
    },
    {
      q: "¿Cómo publico mi evento tech en hack0?",
      a: `Súbelo al calendario de hack0 en Luma (${LUMA}). Aparece en hack0.dev con su página, su ciudad y su comunidad; ya hay ${communities} comunidades publicando.`,
    },
    {
      q: "¿hack0 es gratis?",
      a: "Sí. hack0 es un calendario abierto y gratuito de Crafter Station, y su código es público en GitHub.",
    },
    {
      q: "¿Qué más hay en hack0 además de eventos?",
      a: `Un directorio del ecosistema tech de LATAM con ${orgs} startups, inversionistas, incubadoras, universidades y coworkings, en ${SITE}/ecosistema.`,
    },
  ];
}
