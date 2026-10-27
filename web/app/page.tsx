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
          <a href="#eventos">eventos</a>
          <a href="#organizadores">organizadores</a>
          <a href={LUMA}>luma</a>
        </nav>
      </header>

      <div className="hero">
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
        <span>hack0 by Crafter Station</span>
        <a href="https://github.com/crafter-station/hack0">github</a>
      </footer>
    </main>
  );
}
