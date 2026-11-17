import Link from "next/link";
import { EventList } from "@/components/event-list";
import { Globe } from "@/components/globe";
import { JsonLd } from "@/components/json-ld";
import { OrgLogo } from "@/components/org-logo";
import { SiteHeader } from "@/components/site-header";
import { WorkshopBanner } from "@/components/workshop-banner";
import { eventSpots } from "@/lib/calendar";
import { mappedEvents, upcomingEvents } from "@/lib/catalog";
import { listedOrgs, ORG_TYPES } from "@/lib/ecosistema";
import { SITE } from "@/lib/site";

const LUMA = "https://luma.com/hack0";

export const revalidate = 60;

export default async function Home() {
  const [events, mapped, orgs] = await Promise.all([upcomingEvents(60), mappedEvents(), listedOrgs()]);
  // The most recognisable faces first: orgs with a logo, universities and funds before the long tail of startups.
  const faces = orgs.filter((o) => o.logoUrl && o.logoTone !== "light").slice(0, 14);
  const byType = ORG_TYPES.map((t) => ({ ...t, count: orgs.filter((o) => o.type === t.type).length })).filter((t) => t.count > 0);
  const spots = await eventSpots(mapped);
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "hack0",
          url: SITE,
          logo: `${SITE}/icon.svg`,
          sameAs: [LUMA, "https://github.com/crafter-station/hack0"],
        }}
      />
      <SiteHeader />

      <div className="hero">
        <div className="hero-copy">
          <h1>
            Mapeando el ecosistema
            <br />
            tech de <em>LATAM.</em>
          </h1>
          <p>Damos visibilidad a comunidades y eventos tech. Hackathones, conferencias, workshops y meetups, todo en un solo lugar.</p>
          <div className="actions">
            <a className="btn primary" href={LUMA}>
              Suscríbete al calendario
            </a>
            <a className="btn" href="#eventos">
              Explorar eventos
            </a>
          </div>
        </div>
        {spots.length > 0 && (
          <figure className="hero-globe">
            <Globe spots={spots} />
            <figcaption>
              <b>●</b> próximos · <span>●</span> realizados · {spots.length} lugares
            </figcaption>
          </figure>
        )}
      </div>

      {orgs.length > 0 && (
        <section id="ecosistema">
          <div className="label">
            <span>ecosistema</span>
            <b>{orgs.length}</b>
          </div>
          <Link href="/ecosistema" className="home-eco">
            <div className="home-eco-copy">
              <h2>Quién construye tech en LATAM</h2>
              <p>
                {byType.map((t) => `${t.count} ${t.plural.toLowerCase()}`).join(", ")}. En un mapa, con su web, su ciudad y si están
                contratando.
              </p>
              <span className="btn primary">Abrir el mapa</span>
            </div>
            <ul className="home-eco-faces" aria-hidden="true">
              {faces.map((o) => (
                <li key={o.slug}>
                  <OrgLogo org={o} size={44} square />
                </li>
              ))}
            </ul>
          </Link>
          <p className="chips home-eco-links">
            {byType.map((t) => (
              <Link key={t.type} href={`/ecosistema/peru/${t.segment}`}>
                {t.plural} en Perú <span>{t.count}</span>
              </Link>
            ))}
          </p>
        </section>
      )}

      <section id="eventos">
        <div className="label">
          <span>próximos eventos</span>
          <Link href="/eventos">ver todos y el archivo</Link>
        </div>
        <WorkshopBanner />
        {events && events.length > 0 ? (
          <EventList events={events} />
        ) : (
          <p className="empty">
            La agenda vive en <a href={LUMA}>luma.com/hack0</a>.
          </p>
        )}
      </section>

      <section id="organizadores">
        <div className="label">
          <span>organizadores</span>
        </div>
        <div className="workshop">
          <div>
            <h2>¿Organizas eventos tech?</h2>
            <p>Súmalos al calendario para que más gente se entere y el ecosistema tenga continuidad.</p>
          </div>
          <a className="btn primary" href={LUMA}>
            Subir evento
          </a>
        </div>
      </section>

      <section id="workshops">
        <div className="label">
          <span>workshops online</span>
          <b>pronto</b>
        </div>
        <p className="soon">Workshops prácticos con lo mejor que pueda contar el ponente de turno. Te llevas algo que funciona.</p>
      </section>

      <footer>
        <span>
          hack0 by <a href="https://crafter.run">Crafter Station</a>
        </span>
        <span>
          <Link href="/eventos">eventos</Link> · <Link href="/comunidades">comunidades</Link> · <Link href="/ecosistema">ecosistema</Link> ·{" "}
          <Link href="/brand">brand</Link> · <a href="https://github.com/crafter-station/hack0">github</a>
        </span>
      </footer>
    </main>
  );
}
