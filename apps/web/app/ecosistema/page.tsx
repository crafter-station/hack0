import type { Metadata } from "next";
import { EcoHub } from "@/components/eco-hub";
import { countryPlaces, LATAM_VIEW, listedOrgs } from "@/lib/ecosistema";

export const revalidate = 3600;

const INTRO =
  "Startups, inversionistas, incubadoras, universidades y coworkings que construyen tecnología en Latinoamérica. Elige un país para ver sus ciudades y quién está detrás de cada evento.";

export const metadata: Metadata = {
  title: "Ecosistema tech de LATAM: startups, inversionistas e incubadoras | hack0",
  description: INTRO,
  alternates: { canonical: "/ecosistema" },
};

export default async function Ecosistema() {
  const orgs = await listedOrgs();
  const countries = countryPlaces(orgs);
  return (
    <EcoHub
      title="Ecosistema tech de LATAM"
      intro={INTRO}
      crumbs={[{ href: "/", label: "hack0" }]}
      orgs={orgs}
      places={countries}
      placeBase="/ecosistema"
      view={LATAM_VIEW}
      chips={countries.map((c) => ({ href: `/ecosistema/${c.slug}`, label: c.name, count: c.count }))}
    />
  );
}
