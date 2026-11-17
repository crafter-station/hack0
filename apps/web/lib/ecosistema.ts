import { and, asc, desc, eq, inArray, or, type SQL, sql } from "drizzle-orm";
import { cache } from "react";
import type { CalendarEvent } from "@/lib/calendar";
import { slugify } from "@/lib/calendar";
import { rowToEvent } from "@/lib/catalog-db";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, organizationLogos, organizations } from "@/lib/db/schema";
import { LATAM_COUNTRIES } from "@/lib/latam";
import { countryName } from "@/lib/search";

type OrgType = (typeof organizations.$inferSelect)["type"];
export type Org = Pick<
  typeof organizations.$inferSelect,
  | "slug"
  | "name"
  | "type"
  | "description"
  | "country"
  | "city"
  | "websiteUrl"
  | "logoUrl"
  | "logoTone"
  | "logoAspect"
  | "hiringUrl"
  | "eventTerms"
  | "parentSlug"
  | "lat"
  | "lng"
  | "sourceUrl"
  | "verifiedAt"
>;

/** Directory types in display order, with the path segment that names each hub. */
export const ORG_TYPES: { type: OrgType; segment: string; plural: string; singular: string }[] = [
  { type: "startup", segment: "startups", plural: "Startups", singular: "Startup" },
  { type: "investor", segment: "inversionistas", plural: "Inversionistas", singular: "Inversionista" },
  { type: "incubator", segment: "incubadoras", plural: "Incubadoras y aceleradoras", singular: "Incubadora" },
  { type: "university", segment: "universidades", plural: "Universidades", singular: "Universidad" },
  { type: "coworking", segment: "coworkings", plural: "Coworkings", singular: "Coworking" },
];

export const typeBySegment = (segment: string) => ORG_TYPES.find((t) => t.segment === segment);
export const typeInfo = (type: OrgType) => ORG_TYPES.find((t) => t.type === type) ?? ORG_TYPES[0];

/** Map camera for each country hub: [lng, lat, zoom]. */
const COUNTRY_VIEW: Record<string, [number, number, number]> = {
  AR: [-64, -38, 3.2],
  BO: [-64.7, -16.7, 4.6],
  BR: [-52, -14, 3.2],
  CL: [-71, -35, 3.4],
  CO: [-73.5, 4.5, 4.6],
  CR: [-84, 9.8, 6.6],
  EC: [-78.4, -1.6, 5.6],
  GT: [-90.3, 15.6, 6.4],
  MX: [-102, 23.6, 3.8],
  PE: [-75, -9.4, 4.6],
  PY: [-58.4, -23.4, 5.2],
  UY: [-56, -32.6, 5.8],
  VE: [-66.6, 7, 4.8],
};

/** City centres for hubs whose orgs have no exact pin. Approximate, used only to place the city bubble. */
const CITY_CENTER: Record<string, [number, number]> = {
  lima: [-77.03, -12.06],
  arequipa: [-71.54, -16.41],
  trujillo: [-79.03, -8.11],
  cusco: [-71.97, -13.53],
  chiclayo: [-79.84, -6.77],
  piura: [-80.63, -5.19],
  huancayo: [-75.2, -12.07],
  tacna: [-70.25, -18.01],
  iquitos: [-73.25, -3.75],
  cajamarca: [-78.5, -7.16],
  tumbes: [-80.45, -3.57],
  tarapoto: [-76.36, -6.49],
  puno: [-70.02, -15.84],
  ica: [-75.73, -14.07],
  chachapoyas: [-77.87, -6.23],
  moquegua: [-70.94, -17.19],
  huanuco: [-76.24, -9.93],
  ayacucho: [-74.22, -13.16],
  "puerto-maldonado": [-69.19, -12.59],
  huaraz: [-77.53, -9.53],
  pucallpa: [-74.55, -8.38],
};

export const LATAM_VIEW: [number, number, number] = [-70, -12, 2.4];

type Place = { slug: string; name: string; count: number; lng: number; lat: number; zoom: number };

const countrySlug = (code: string) => slugify(countryName(code));
export const countryFromSlug = (slug: string) => LATAM_COUNTRIES.find((c) => countrySlug(c) === slug) ?? null;
export const countryPath = (code: string) => `/ecosistema/${countrySlug(code)}`;

export const listedOrgs = cache(async (): Promise<Org[]> => {
  if (!process.env.DATABASE_URL) return [];
  return getDb()
    .select({
      slug: organizations.slug,
      name: organizations.name,
      type: organizations.type,
      description: organizations.description,
      country: organizations.country,
      city: organizations.city,
      websiteUrl: organizations.websiteUrl,
      logoUrl: organizations.logoUrl,
      logoTone: organizations.logoTone,
      logoAspect: organizations.logoAspect,
      hiringUrl: organizations.hiringUrl,
      eventTerms: organizations.eventTerms,
      parentSlug: organizations.parentSlug,
      lat: organizations.lat,
      lng: organizations.lng,
      sourceUrl: organizations.sourceUrl,
      verifiedAt: organizations.verifiedAt,
    })
    .from(organizations)
    .where(eq(organizations.status, "listed"))
    .orderBy(asc(organizations.name));
});

export async function findOrg(slug: string): Promise<Org | null> {
  if (!process.env.DATABASE_URL) return null;
  const [row] = await getDb()
    .select()
    .from(organizations)
    .where(and(eq(organizations.slug, slug), eq(organizations.status, "listed")))
    .limit(1);
  return row ?? null;
}

function mean(list: Org[], key: "lat" | "lng") {
  const known = list.filter((o) => o[key] !== null);
  return known.length > 0 ? known.reduce((s, o) => s + (o[key] ?? 0), 0) / known.length : null;
}

/** Countries with at least one listed org, largest first, with their map camera. */
export function countryPlaces(orgs: Org[]): Place[] {
  const by = Map.groupBy(orgs, (o) => o.country);
  return [...by.entries()]
    .flatMap(([code, list]) => {
      const view = COUNTRY_VIEW[code];
      if (!view) return [];
      return [{ slug: countrySlug(code), name: countryName(code), count: list.length, lng: view[0], lat: view[1], zoom: view[2] }];
    })
    .sort((a, b) => b.count - a.count);
}

/** Cities in a country's orgs, placed at the mean of their pins or at the known city centre. */
export function cityPlaces(orgs: Org[]): Place[] {
  const by = Map.groupBy(
    orgs.filter((o) => o.city),
    (o) => slugify(o.city ?? ""),
  );
  return [...by.entries()]
    .flatMap(([slug, list]) => {
      const lng = mean(list, "lng") ?? CITY_CENTER[slug]?.[0];
      const lat = mean(list, "lat") ?? CITY_CENTER[slug]?.[1];
      if (lng === undefined || lat === undefined) return [];
      return [{ slug, name: list[0].city ?? slug, count: list.length, lng, lat, zoom: 11 }];
    })
    .sort((a, b) => b.count - a.count);
}

export const inCity = (orgs: Org[], citySlug: string) => orgs.filter((o) => o.city && slugify(o.city) === citySlug);

/** What the map needs per org; descriptions and sources stay on the server. */
export const pins = (orgs: Org[]) =>
  orgs.flatMap((o) =>
    o.lat !== null && o.lng !== null
      ? [
          {
            slug: o.slug,
            name: o.name,
            type: o.type,
            lat: o.lat,
            lng: o.lng,
            logoUrl: o.logoUrl,
            logoTone: o.logoTone,
            logoAspect: o.logoAspect,
          },
        ]
      : [],
  );

/** A phrase as a case-insensitive whole-word Postgres regex: `\m` and `\M` are word boundaries. */
const wholeWord = (term: string) => `\\m${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\M`;

/** Events on hack0 that name the org in their title or description, newest first. */
export async function orgEvents(terms: string[], limit = 8): Promise<CalendarEvent[]> {
  if (!process.env.DATABASE_URL || terms.length === 0) return [];
  const match = or(
    ...terms.flatMap((t) => [sql`${canonicalEvents.name} ~* ${wholeWord(t)}`, sql`${canonicalEvents.description} ~* ${wholeWord(t)}`]),
  ) as SQL;
  const rows = await getDb()
    .select()
    .from(canonicalEvents)
    .where(and(eq(canonicalEvents.listed, true), eq(canonicalEvents.active, true), match))
    .orderBy(desc(canonicalEvents.startAt))
    .limit(limit);
  return rows.map(rowToEvent);
}

type Summary = { paragraphs: string[]; faq: { q: string; a: string }[] };

const listEs = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`);

/** Cities with a hub of their own, largest first; an HQ abroad doesn't count as one of the country's cities. */
function topCities(orgs: Org[], n: number) {
  const by = Map.groupBy(
    orgs.filter((o) => o.city && CITY_CENTER[slugify(o.city)]),
    (o) => o.city ?? "",
  );
  return [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, n);
}

/** What a hub says about its own orgs, written from the data so every hub reads differently and stays true as rows change. */
export function hubSummary(orgs: Org[], place: string): Summary {
  const paragraphs: string[] = [];
  const faq: Summary["faq"] = [];
  const counts = ORG_TYPES.map((t) => ({ ...t, list: orgs.filter((o) => o.type === t.type) })).filter((t) => t.list.length > 0);
  if (counts.length === 0) return { paragraphs, faq };

  const kinds = listEs(counts.map((t) => `${t.list.length} ${(t.list.length === 1 ? t.singular : t.plural).toLowerCase()}`));
  paragraphs.push(`El directorio de hack0 reúne ${orgs.length} organizaciones del ecosistema tech de ${place}: ${kinds}.`);

  const cities = topCities(orgs, 3);
  if (cities.length > 1) {
    paragraphs.push(
      `La mayoría está en ${cities[0][0]} (${cities[0][1].length}), seguida de ${listEs(cities.slice(1).map(([c, l]) => `${c} (${l.length})`))}.`,
    );
  }
  const hiring = orgs.filter((o) => o.hiringUrl);
  if (hiring.length > 0) {
    paragraphs.push(
      `${hiring.length === 1 ? "Una está" : `${hiring.length} están`} contratando y enlazan su página de empleos: ${listEs(hiring.slice(0, 6).map((o) => o.name))}.`,
    );
  }
  const verified = orgs.filter((o) => o.verifiedAt).length;
  paragraphs.push(`Cada perfil guarda de dónde salió su dato; ${verified} de ${orgs.length} tienen la web verificada.`);

  const startups = orgs.filter((o) => o.type === "startup");
  if (startups.length > 0) {
    const where = topCities(startups, 2).map(([c, l]) => `${l.length} en ${c}`);
    faq.push({
      q: `¿Cuántas startups hay en ${place}?`,
      a: `hack0 lista ${startups.length} startups de ${place}${where.length ? `, ${listEs(where)}` : ""}. Entre ellas ${listEs(startups.slice(0, 5).map((o) => o.name))}.`,
    });
  }
  const investors = orgs.filter((o) => o.type === "investor");
  if (investors.length > 0) {
    faq.push({
      q: `¿Qué fondos invierten en startups de ${place}?`,
      a: `Hay ${investors.length} inversionistas en el directorio: ${listEs(investors.slice(0, 8).map((o) => o.name))}.`,
    });
  }
  const support = orgs.filter((o) => o.type === "incubator");
  if (support.length > 0) {
    faq.push({
      q: `¿Qué incubadoras y aceleradoras hay en ${place}?`,
      a: `${support.length} programas de incubación y aceleración, entre ellos ${listEs(support.slice(0, 6).map((o) => o.name))}.`,
    });
  }
  const spaces = orgs.filter((o) => o.type === "coworking" && !o.parentSlug);
  if (spaces.length > 0) {
    const sites = (o: Org) => orgs.filter((b) => b.parentSlug === o.slug).length;
    faq.push({
      q: `¿Dónde hay coworkings en ${place}?`,
      a: `${listEs(spaces.slice(0, 10).map((o) => (sites(o) > 0 ? `${o.name} (${sites(o)} sedes)` : o.city ? `${o.name} (${o.city})` : o.name)))}.`,
    });
  }
  return { paragraphs, faq };
}

/** Stored logos as data URIs for share images, in the order given; orgs without a logo are skipped. */
export async function logoDataUris(slugs: string[]): Promise<{ slug: string; uri: string; light: boolean }[]> {
  if (!process.env.DATABASE_URL || slugs.length === 0) return [];
  const rows = await getDb()
    .select({ slug: organizations.slug, bytes: organizationLogos.bytes, tone: organizations.logoTone })
    .from(organizationLogos)
    .innerJoin(organizations, eq(organizations.id, organizationLogos.organizationId))
    .where(inArray(organizations.slug, slugs));
  const by = new Map(rows.map((r) => [r.slug, r]));
  return slugs.flatMap((slug) => {
    const r = by.get(slug);
    return r ? [{ slug, uri: `data:image/png;base64,${Buffer.from(r.bytes).toString("base64")}`, light: r.tone === "light" }] : [];
  });
}
