import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { EventList } from "@/components/event-list";
import { Globe } from "@/components/globe";
import { JsonLd } from "@/components/json-ld";
import { Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { eventSpots } from "@/lib/calendar";
import { mappedEvents, upcomingEvents } from "@/lib/catalog";
import { SITE } from "@/lib/site";

const LUMA = "https://luma.com/hack0";

export default async function Home() {
  const [events, mapped] = await Promise.all([upcomingEvents(60), mappedEvents()]);
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
      <header className="top">
        <Link href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
          <Wordmark size={26} />
        </Link>
        <nav>
          <Link href="/eventos">eventos</Link>
          <Link href="/comunidades">comunidades</Link>
          <a href={LUMA}>luma</a>
          <AccountNav />
          <ThemeToggle />
        </nav>
      </header>

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

      <section id="eventos">
        <div className="label">
          <span>próximos eventos</span>
          <Link href="/eventos">ver todos y el archivo</Link>
        </div>
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
          <Link href="/eventos">eventos</Link> · <Link href="/comunidades">comunidades</Link> · <Link href="/brand">brand</Link> ·{" "}
          <a href="https://github.com/crafter-station/hack0">github</a>
        </span>
      </footer>
    </main>
  );
}
