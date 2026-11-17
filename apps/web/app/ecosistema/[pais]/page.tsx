import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EcoHub } from "@/components/eco-hub";
import { cityPlaces, countryFromSlug, countryPlaces, listedOrgs, ORG_TYPES } from "@/lib/ecosistema";
import { countryName } from "@/lib/search";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ pais: string }> };

const intro = (name: string, count: number) =>
  `${count} startups, inversionistas, incubadoras, universidades y coworkings del ecosistema tech de ${name}, con su web, su ciudad y los eventos en los que participan.`;

async function load(pais: string) {
  const code = countryFromSlug(pais);
  if (!code) return null;
  const orgs = (await listedOrgs()).filter((o) => o.country === code);
  return orgs.length > 0 ? { code, name: countryName(code), orgs } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pais } = await params;
  const hub = await load(pais);
  if (!hub) return {};
  return {
    title: `Startups y ecosistema tech de ${hub.name}: ${hub.orgs.length} organizaciones | hack0`,
    description: intro(hub.name, hub.orgs.length),
    alternates: { canonical: `/ecosistema/${pais}` },
  };
}

export default async function Country({ params }: Props) {
  const { pais } = await params;
  const hub = await load(pais);
  if (!hub) notFound();
  const view = countryPlaces(hub.orgs)[0];
  const types = ORG_TYPES.map((t) => ({ ...t, count: hub.orgs.filter((o) => o.type === t.type).length })).filter((t) => t.count > 0);
  const cities = cityPlaces(hub.orgs);
  return (
    <EcoHub
      path={`/ecosistema/${pais}`}
      place={hub.name}
      title={`Ecosistema tech de ${hub.name}`}
      intro={intro(hub.name, hub.orgs.length)}
      crumbs={[{ href: "/ecosistema", label: "ecosistema" }]}
      orgs={hub.orgs}
      places={cities}
      placeBase={`/ecosistema/${pais}`}
      view={[view.lng, view.lat, view.zoom]}
      chips={cities.map((c) => ({ href: `/ecosistema/${pais}/${c.slug}`, label: c.name, count: c.count }))}
      more={types.map((t) => ({ href: `/ecosistema/${pais}/${t.segment}`, label: `${t.plural} en ${hub.name}`, count: t.count }))}
    />
  );
}
