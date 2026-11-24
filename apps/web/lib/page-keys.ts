import { metroOf, slugify } from "@/lib/calendar";

/** Path of the source URL after the host, e.g. "1z4no5h8" for luma.com/1z4no5h8. */
function urlCode(url: string) {
  return url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/+$/, "");
}

/** Public slug: the event name plus the source URL code, which keeps it unique and stable across renames. */
export function eventSlug(name: string, url: string) {
  return `${slugify(name)}-${slugify(urlCode(url))}`.replace(/^-+/, "");
}

/** Luma's `city_state` is "District, Region" and other providers send a bare city; both resolve to a metro. */
export function splitCity(raw: string | null | undefined): { city: string | null; region: string | undefined } {
  if (!raw) return { city: null, region: undefined };
  const [city, region] = raw.split(",").map((p) => p.trim());
  return { city: city || null, region: region || undefined };
}

/** Names providers use for places that are not cities. */
const NOT_A_PLACE = /\b(online|virtual|remot[oa]|sesi[oó]n online|webinar)\b/i;

/** Lima districts that venues send as a bare city, with no region to place them. */
const LIMA_DISTRICTS = [
  "ate",
  "barranco",
  "brena",
  "callao",
  "cercado-de-lima",
  "chorrillos",
  "jesus-maria",
  "la-molina",
  "la-victoria",
  "lince",
  "los-olivos",
  "magdalena-del-mar",
  "miraflores",
  "pueblo-libre",
  "rimac",
  "san-borja",
  "san-isidro",
  "san-juan-de-lurigancho",
  "san-juan-de-miraflores",
  "san-martin-de-porres",
  "san-miguel",
  "santiago-de-surco",
  "surco",
  "surquillo",
  "villa-el-salvador",
  "villa-maria-del-triunfo",
];

/** Abbreviations, official names, English names and suburbs that name a metro, keyed by slug. */
const ALIASES: Record<string, string> = {
  caba: "Buenos Aires",
  "ciudad-autonoma-de-buenos-aires": "Buenos Aires",
  "capital-federal": "Buenos Aires",
  palermo: "Buenos Aires",
  "mexico-city": "Ciudad de México",
  cuauhtemoc: "Ciudad de México",
  "miguel-hidalgo": "Ciudad de México",
  "benito-juarez": "Ciudad de México",
  coyoacan: "Ciudad de México",
  "alvaro-obregon": "Ciudad de México",
  cdmx: "Ciudad de México",
  "guatemala-city": "Ciudad de Guatemala",
  zapopan: "Guadalajara",
  "san-pedro-garza-garcia": "Monterrey",
  "godoy-cruz": "Mendoza",
  providencia: "Santiago",
  "santa-tecla": "San Salvador",
  soyapango: "San Salvador",
  samborondon: "Guayaquil",
  sangolqui: "Quito",
  "jose-luis-bustamante": "Arequipa",
  "jose-luis-bustamante-y-rivero": "Arequipa",
  "la-punta": "Lima",
  yucatan: "Mérida",
  ...Object.fromEntries(LIMA_DISTRICTS.map((d) => [d, "Lima"])),
};

/** Countries and states that providers send in the city field; a hub named after one is not a city. */
const NOT_A_CITY = new Set([
  "argentina",
  "bolivia",
  "brasil",
  "brazil",
  "chile",
  "chiapas",
  "colombia",
  "ecuador",
  "latam",
  "latinoamerica",
  "paraguay",
  "peru",
  "uruguay",
  "venezuela",
]);

export function eventMetro(rawCity: string | null | undefined, region?: string | null) {
  const split = splitCity(rawCity);
  if (!split.city || NOT_A_PLACE.test(split.city) || NOT_A_CITY.has(slugify(split.city))) return null;
  const alias = ALIASES[slugify(split.city)];
  if (alias) return alias;
  return metroOf(split.city, split.region ?? region ?? undefined);
}
