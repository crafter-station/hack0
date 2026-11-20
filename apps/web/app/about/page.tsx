import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import { communityIndex, hubEvents, hubIndex } from "@/lib/catalog";
import { listedOrgs } from "@/lib/ecosistema";
import { AUTHORS, CRAFTER, GITHUB, LUMA, ORGANIZATION_LD, SITE, TAGLINE } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sobre hack0, el calendario de Crafter Station",
  description: `${TAGLINE} Creado por Railly Hugo e Ignacio Velásquez.`,
  alternates: { canonical: "/about" },
};

const n = (x: number) => x.toLocaleString("es");

export default async function About() {
  const [catalog, communities, cities, orgs] = await Promise.all([
    hubEvents(null, null),
    communityIndex(),
    hubIndex("ciudad"),
    listedOrgs(),
  ]);
  const events = catalog ? catalog.upcoming.length + catalog.pastTotal : 0;
  return (
    <Shell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE}/about`,
          name: "Sobre hack0",
          inLanguage: "es",
          about: { "@id": ORGANIZATION_LD["@id"] },
          mainEntity: ORGANIZATION_LD,
        }}
      />
      <div className="hero-copy hub">
        <p className="crumbs">
          <Link href="/">hack0</Link>
        </p>
        <h1>Sobre hack0</h1>
        <p>{TAGLINE}</p>
      </div>

      <section>
        <div className="label">
          <span>qué es</span>
        </div>
        <div className="prose">
          <p>
            hack0 junta en un solo lugar los hackathones, meetups, workshops y conferencias de tecnología de Latinoamérica. Lee los
            calendarios de Luma, Meetup y Eventbrite de cada comunidad, une el mismo evento cuando aparece en varios lugares y publica una
            página por evento, ciudad, tema y comunidad.
          </p>
          {events > 0 && (
            <p>
              Hoy el catálogo tiene {n(events)} eventos de {n(communities.length)} comunidades en {n(cities.length)} ciudades, y un mapa del
              ecosistema con {n(orgs.length)} startups, fondos, incubadoras, universidades y coworkings.
            </p>
          )}
          <p>
            También damos <Link href="/taste-hacking">workshops online</Link> en español, y la agenda se puede seguir en el{" "}
            <a href={LUMA}>calendario de Luma</a>.
          </p>
        </div>
      </section>

      <section>
        <div className="label">
          <span>quién lo hace</span>
        </div>
        <div className="prose">
          <p>
            hack0 es parte de <a href={CRAFTER}>Crafter Station</a>, la comunidad open source de builders de Perú y Latinoamérica. Lo
            crearon y lo mantienen:
          </p>
          <ul>
            {AUTHORS.map((a) => (
              <li key={a.name}>
                <a href={a.url}>{a.name}</a>, {a.role.charAt(0).toLowerCase() + a.role.slice(1)}.
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="label">
          <span>código abierto</span>
        </div>
        <div className="prose">
          <p>
            El código está en <a href={GITHUB}>GitHub</a> bajo licencia Apache-2.0. Apps y agentes pueden leer el mismo catálogo con la API
            REST y el servidor MCP.
          </p>
          <p>hack0 no tiene relación con el nodo Hack0 de BTCPay Server.</p>
        </div>
      </section>
    </Shell>
  );
}
