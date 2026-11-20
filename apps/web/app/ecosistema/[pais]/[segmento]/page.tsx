import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EcoHub } from "@/components/eco-hub";
import { hubIndex } from "@/lib/catalog";
import { cityPlaces, countryFromSlug, countryPlaces, inCity, listedOrgs, ORG_TYPES, typeBySegment } from "@/lib/ecosistema";
import { countryName } from "@/lib/search";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ pais: string; segmento: string }> };

/** How each country's startups are searched, e.g. "startups peruanas". */
const STARTUP_DEMONYM: Record<string, string> = { PE: "peruanas", CO: "colombianas", MX: "mexicanas", CL: "chilenas", AR: "argentinas" };

/** Search titles under 60 characters, led by the phrase people type; the H1 stays the plain hub name. */
function seoTitle(segment: string, code: string, country: string, orgs: { city: string | null }[]) {
  const n = orgs.length;
  const byCity = Map.groupBy(
    orgs.filter((o) => o.city),
    (o) => o.city ?? "",
  );
  const [top] = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);
  // Search asks for the city ("coworking lima"); name it when most of the list sits there.
  const place = byCity.size === 1 ? top[0] : top && top[1].length * 2 > n ? `${top[0]} y ${country}` : country;
  if (segment === "startups") return `${n} startups ${STARTUP_DEMONYM[code] ?? `de ${country}`}: directorio y mapa`;
  if (segment === "inversionistas") return `Venture capital en ${country}: ${n} fondos e inversionistas`;
  if (segment === "incubadoras") return `Aceleradoras e incubadoras en ${country}: ${n} programas`;
  if (segment === "universidades") return `Universidades con incubadoras en ${country}`;
  return `Coworking en ${place}: espacios para startups`;
}

const TYPE_INTRO: Record<string, (country: string, n: number) => string> = {
  startups: (c, n) => `${n} startups de ${c}: qué construyen, dónde están y cuáles están contratando.`,
  inversionistas: (c, n) =>
    `${n} fondos de venture capital, redes de inversionistas ángeles y brazos de inversión corporativa que invierten en startups de ${c}.`,
  incubadoras: (c, n) => `${n} incubadoras, aceleradoras y hubs de innovación que apoyan a startups en ${c}.`,
  universidades: (c, n) => `${n} universidades de ${c} con programas, incubadoras y comunidades de tecnología.`,
  coworkings: (c, n) => `${n} espacios de coworking en ${c}, contando cada sede, donde trabajan startups y comunidades tech.`,
};

/** The segment after the country is a reserved type name or a city slug; types win. */
async function load(pais: string, segmento: string) {
  const code = countryFromSlug(pais);
  if (!code) return null;
  const country = (await listedOrgs()).filter((o) => o.country === code);
  const name = countryName(code);
  const type = typeBySegment(segmento);
  if (type) {
    const orgs = country.filter((o) => o.type === type.type);
    if (orgs.length === 0) return null;
    return {
      kind: "type" as const,
      name,
      country,
      orgs,
      title: `${type.plural} en ${name}`,
      seo: seoTitle(type.segment, code, name, orgs),
      intro: TYPE_INTRO[type.segment](name, orgs.length),
    };
  }
  const orgs = inCity(country, segmento);
  const city = cityPlaces(orgs)[0];
  if (!city) return null;
  return {
    kind: "city" as const,
    name,
    country,
    orgs,
    city,
    title: `Ecosistema tech de ${city.name}`,
    seo:
      orgs.length === 1
        ? `Startups y ecosistema tech de ${city.name}`
        : `Startups y ecosistema tech de ${city.name}: ${orgs.length} organizaciones`,
    intro:
      orgs.length === 1
        ? `Una organización del ecosistema tech de ${city.name}, ${name}.`
        : `${orgs.length} startups, inversionistas, incubadoras, universidades y coworkings de ${city.name}, ${name}.`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pais, segmento } = await params;
  const hub = await load(pais, segmento);
  if (!hub) return {};
  return {
    title: `${hub.seo} | hack0`,
    description: `${hub.intro} Con su web, su ciudad y su ubicación en el mapa.`,
    alternates: { canonical: `/ecosistema/${pais}/${segmento}` },
    // A city with a single org is a thinner copy of that org's profile.
    robots: hub.kind === "city" && hub.orgs.length === 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function Segment({ params }: Props) {
  const { pais, segmento } = await params;
  const hub = await load(pais, segmento);
  if (!hub) notFound();
  const crumbs = [
    { href: "/ecosistema", label: "ecosistema" },
    { href: `/ecosistema/${pais}`, label: hub.name.toLowerCase() },
  ];
  if (hub.kind === "type") {
    const c = countryPlaces(hub.country)[0];
    const cities = cityPlaces(hub.orgs);
    const others = ORG_TYPES.filter((t) => t.segment !== segmento)
      .map((t) => ({
        href: `/ecosistema/${pais}/${t.segment}`,
        label: t.plural,
        count: hub.country.filter((o) => o.type === t.type).length,
      }))
      .filter((t) => t.count > 0);
    return (
      <EcoHub
        path={`/ecosistema/${pais}/${segmento}`}
        place={hub.name}
        title={hub.title}
        intro={hub.intro}
        crumbs={crumbs}
        orgs={hub.orgs}
        places={cities}
        placeBase={`/ecosistema/${pais}`}
        view={[c.lng, c.lat, c.zoom]}
        chips={cities.map((x) => ({ href: `/ecosistema/${pais}/${x.slug}`, label: x.name, count: x.count }))}
        more={others}
      />
    );
  }
  const types = ORG_TYPES.map((t) => ({
    href: `/ecosistema/${pais}/${t.segment}`,
    label: `${t.plural} en ${hub.name}`,
    count: hub.country.filter((o) => o.type === t.type).length,
  })).filter((t) => t.count > 0);
  // The events hub for the same city targets "eventos"; this one the directory. They link, never duplicate.
  const events = (await hubIndex("ciudad")).find((h) => h.slug === segmento);
  if (events) types.push({ href: `/ciudad/${events.slug}`, label: `Eventos en ${hub.city.name}`, count: events.count });
  return (
    <EcoHub
      path={`/ecosistema/${pais}/${segmento}`}
      place={hub.city.name}
      title={hub.title}
      intro={hub.intro}
      crumbs={crumbs}
      orgs={hub.orgs}
      places={[]}
      placeBase={`/ecosistema/${pais}`}
      view={[hub.city.lng, hub.city.lat, hub.city.zoom]}
      chips={[]}
      more={types}
    />
  );
}
