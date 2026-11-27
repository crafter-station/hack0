import { LUMA, SITE } from "./site";

export interface FlagshipEvent {
  slug: string;
  name: string;
  startDate: string;
  endDate?: string;
  dateLabel: string;
  month: string;
  city: string;
  country: string;
  countryCode: string;
  focus: string;
  url: string;
  confirmed: boolean;
}

export const FLAGSHIP_2027_UPDATED = "2026-11-27";

export const FLAGSHIP_2027: FlagshipEvent[] = [
  {
    slug: "devconverge-latam-2026",
    name: "DevConverge LATAM",
    startDate: "2026-12-03",
    dateLabel: "3 dic 2026",
    month: "Diciembre 2026",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    focus: "Developers, ingeniería de software y arquitectura",
    url: "https://devconverge.lat",
    confirmed: true,
  },
  {
    slug: "punta-tech-meetup-2027",
    name: "Punta Tech Meetup",
    startDate: "2027-01-11",
    dateLabel: "11 ene 2027",
    month: "Enero 2027",
    city: "Punta del Este",
    country: "Uruguay",
    countryCode: "UY",
    focus: "Founders, inversores y startups de LATAM",
    url: "https://puntatech.com",
    confirmed: true,
  },
  {
    slug: "gitex-ai-latam-2027",
    name: "GITEX AI LATAM",
    startDate: "2027-03-16",
    endDate: "2027-03-17",
    dateLabel: "16–17 mar 2027",
    month: "Marzo 2027",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    focus: "Inteligencia artificial, cloud, agentes y startups",
    url: "https://es.gitexlatam.com",
    confirmed: true,
  },
  {
    slug: "gisec-latam-2027",
    name: "GISEC LATAM",
    startDate: "2027-03-16",
    endDate: "2027-03-17",
    dateLabel: "16–17 mar 2027",
    month: "Marzo 2027",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    focus: "Ciberseguridad e infraestructura crítica",
    url: "https://es.gitexlatam.com",
    confirmed: true,
  },
  {
    slug: "south-summit-brazil-2027",
    name: "South Summit Brazil",
    startDate: "2027-04-14",
    endDate: "2027-04-16",
    dateLabel: "14–16 abr 2027",
    month: "Abril 2027",
    city: "Porto Alegre",
    country: "Brasil",
    countryCode: "BR",
    focus: "Startups, VC e innovación abierta",
    url: "https://www.southsummit.io/brazil",
    confirmed: true,
  },
  {
    slug: "talent-land-mexico-2027",
    name: "Talent Land México",
    startDate: "2027-04-27",
    endDate: "2027-04-29",
    dateLabel: "27–29 abr 2027",
    month: "Abril 2027",
    city: "Ciudad de México",
    country: "México",
    countryCode: "MX",
    focus: "Developers, hackathones, IA y talento tech",
    url: "https://www.talent-land.mx",
    confirmed: true,
  },
  {
    slug: "web-summit-rio-2027",
    name: "Web Summit Rio",
    startDate: "2027-06-14",
    endDate: "2027-06-17",
    dateLabel: "14–17 jun 2027",
    month: "Junio 2027",
    city: "Río de Janeiro",
    country: "Brasil",
    countryCode: "BR",
    focus: "Startups, IA, producto, ingeniería y VC",
    url: "https://rio.websummit.com",
    confirmed: true,
  },
  {
    slug: "icml-2027",
    name: "ICML 2027",
    startDate: "2027-07-31",
    endDate: "2027-08-06",
    dateLabel: "31 jul–6 ago 2027",
    month: "Julio–Agosto 2027",
    city: "Río de Janeiro",
    country: "Brasil",
    countryCode: "BR",
    focus: "Investigación en machine learning e IA",
    url: "https://icml.cc",
    confirmed: true,
  },
  {
    slug: "interspeech-2027",
    name: "Interspeech 2027",
    startDate: "2027-08-29",
    endDate: "2027-09-02",
    dateLabel: "29 ago–2 sep 2027",
    month: "Agosto–Septiembre 2027",
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    focus: "Procesamiento de voz, audio e IA",
    url: "https://www.interspeech2027.org",
    confirmed: true,
  },
  {
    slug: "lsc-space-congress-2027",
    name: "Congreso Espacial Latinoamericano (LSC)",
    startDate: "2027-09-01",
    endDate: "2027-09-03",
    dateLabel: "1–3 sep 2027",
    month: "Septiembre 2027",
    city: "San José",
    country: "Costa Rica",
    countryCode: "CR",
    focus: "Deep tech, espacio e ingeniería aeroespacial",
    url: "https://lscspace.org",
    confirmed: true,
  },
];

export function flagshipItemListJsonLd(events: FlagshipEvent[] = FLAGSHIP_2027) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Calendario de eventos tech en LATAM 2026-2027",
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: e.name,
        startDate: e.startDate,
        ...(e.endDate ? { endDate: e.endDate } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        url: e.url,
        description: e.focus,
        location: {
          "@type": "Place",
          name: `${e.city}, ${e.country}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: e.city,
            addressCountry: e.countryCode,
          },
        },
      },
    })),
  };
}

export function flagshipFaq(liveUpcomingCount: number) {
  return [
    {
      q: "¿Cuáles son los principales eventos tech en LATAM en 2026 y 2027?",
      a: "Entre las conferencias y encuentros tech más grandes de Latinoamérica para 2026-2027 están DevConverge LATAM (Buenos Aires, dic 2026), Punta Tech Meetup (Uruguay, ene 2027), GITEX AI LATAM (São Paulo, mar 2027), South Summit Brazil (Porto Alegre, abr 2027), Talent Land México (CDMX, abr 2027), Web Summit Rio (jun 2027), ICML 2027 (Río de Janeiro, jul-ago 2027) e Interspeech 2027 (São Paulo, ago-sep 2027).",
    },
    {
      q: "¿Dónde ver también los meetups, workshops y hackathones de cada semana en LATAM?",
      a: `Además de las conferencias anuales de esta guía, el calendario vivo de hack0 (${SITE}/eventos) agrega hoy ${liveUpcomingCount} eventos próximos de comunidades en Luma, Meetup y Eventbrite en toda la región.`,
    },
    {
      q: "¿Qué eventos de inteligencia artificial hay en Latinoamérica en 2027?",
      a: "En 2027 destacan GITEX AI LATAM en São Paulo (16-17 mar), Web Summit Rio (14-17 jun), ICML 2027 en Río de Janeiro (31 jul-6 ago) e Interspeech 2027 en São Paulo (29 ago-2 sep), además de hackathones y meetups locales de IA listados en hack0.dev/tema/ia.",
    },
    {
      q: "¿Cómo sumar una conferencia o hackathon al calendario 2027 de hack0?",
      a: `Publica tu evento en el calendario de hack0 en Luma (${LUMA}) o abre un issue en github.com/crafter-station/hack0 para conferencias regionales con fechas confirmadas.`,
    },
  ];
}
