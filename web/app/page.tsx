import { Wordmark } from "@/components/logo";
import { type CalendarEvent, upcomingEvents } from "@/lib/calendar";

const LUMA = "https://luma.com/hack0";

function formatDate(e: CalendarEvent) {
  const d = new Date(e.startAt);
  const day = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", timeZone: e.timezone }).format(d);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: e.timezone }).format(d);
  return { day, time };
}

export default async function Home() {
  const events = await upcomingEvents();
  return (
    <main>
      <header className="top">
        <a href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
          <Wordmark size={26} />
        </a>
        <nav>
          <a href="#workshops">workshops</a>
          <a href="#eventos">eventos</a>
          <a href={LUMA}>luma</a>
        </nav>
      </header>

      <div className="hero">
        <h1>
          Desarma.
          <br />
          Nombra. <em>Construye.</em>
        </h1>
        <p>El calendario de eventos tech de LATAM y workshops prácticos para construir con IA. Te llevas algo que funciona.</p>
        <div className="actions">
          <a className="btn primary" href={LUMA}>
            Suscríbete al calendario
          </a>
          <a className="btn" href="#workshops">
            Ver workshops
          </a>
        </div>
      </div>

      <section id="workshops">
        <div className="label">
          <span>workshops</span>
          <b>01</b>
        </div>
        <div className="workshop">
          <div>
            <span className="tag">online · 90 min · próximamente</span>
            <h2>Taste hacking</h2>
            <p>
              Desarma cualquier web, animación o video y reconstrúyelo con IA. Técnica en vivo, vocabulario para nombrar lo que ves y una
              skill para tu agente.
            </p>
            <code className="cmd">npx @crafter/hack0 list</code>
          </div>
          <a className="btn primary" href={LUMA}>
            Avísame
          </a>
        </div>
      </section>

      <section id="eventos">
        <div className="label">
          <span>próximos eventos</span>
          <span>{events ? `${events.length}` : ""}</span>
        </div>
        {events && events.length > 0 ? (
          <ul className="events">
            {events.map((e) => {
              const { day, time } = formatDate(e);
              return (
                <li key={e.id}>
                  <a href={e.url}>
                    <span className="date">
                      {day}
                      <span>{time}</span>
                    </span>
                    <span className="name">{e.name}</span>
                    <span className="where">{e.city ?? (e.online ? "online" : "")}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">
            La agenda vive en <a href={LUMA}>luma.com/hack0</a>.
          </p>
        )}
      </section>

      <footer>
        <span>hack0 by Crafter Station</span>
        <a href="https://github.com/crafter-station/hack0">github</a>
      </footer>
    </main>
  );
}
