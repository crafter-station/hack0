import { statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { Bench } from "./bench";
import { GALLERY } from "./gallery";
import { GalleryGrid } from "./gallery-grid";
import { Ticket } from "./ticket";
import { WordBench } from "./word-bench";
import { AGENDA, LAYERS, TAKEAWAYS, WORKSHOP } from "./workshop";

const DESCRIPTION = `${WORKSHOP.subtitle}. Workshop online de 90 minutos con Railly Hugo, el jueves 19 de noviembre.`;

export const metadata: Metadata = {
  title: "Taste hacking · workshop de hack0",
  description: DESCRIPTION,
  alternates: { canonical: "/taste-hacking" },
  openGraph: { title: "Taste hacking", description: DESCRIPTION, url: "/taste-hacking", type: "website" },
};

const EVENT_LD = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: `${WORKSHOP.title}: ${WORKSHOP.subtitle}`,
  startDate: WORKSHOP.startAt,
  endDate: WORKSHOP.endAt,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: { "@type": "VirtualLocation", url: WORKSHOP.luma },
  image: [`${SITE}/taste-hacking/opengraph-image.jpg`],
  description: DESCRIPTION,
  url: `${SITE}/taste-hacking`,
  offers: { "@type": "Offer", url: WORKSHOP.luma, price: "20", priceCurrency: "USD", availability: "https://schema.org/InStock" },
  organizer: { "@type": "Organization", name: "hack0", url: SITE },
  performer: { "@type": "Person", name: "Railly Hugo" },
};

/** What this page is made of, for the third layer. The clip weight is read from disk at build time. */
function madeOf(): string[] {
  const loops = GALLERY.filter((g) => !g.sound);
  const bytes = loops.reduce((sum, g) => sum + statSync(join(process.cwd(), "public", g.video)).size, 0);
  return [
    "Next.js 16 y React 19",
    "CSS plano, sin librerías de animación",
    "JetBrains Mono en 500, 700 y 800",
    `${loops.length} clips en loop, ${Math.round(bytes / 1024)} kB entre todos`,
  ];
}

function MadeFigure() {
  return (
    <div className="th-fig th-fig-made">
      <span className="th-fig-note">esta página, por debajo</span>
      <ul>
        {madeOf().map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

export default function TasteHackingPage() {
  return (
    <main>
      <JsonLd data={EVENT_LD} />

      <section className="th-hero">
        <div className="th-intro">
          <p className="th-by">
            con <b>Railly Hugo</b>, MTS en Vercel y founder de Crafter Station
          </p>
          <h1>Taste hacking</h1>
          <p className="th-sub">{WORKSHOP.subtitle}.</p>
        </div>
        <Bench />
      </section>

      <section className="th-section" id="capas">
        <header>
          <p className="th-index">01 · la tesis</p>
          <h2>Todo lo que ves tiene tres capas</h2>
          <p className="th-lead">Si nombras cada capa, se la puedes pedir a un agente. Estas son las palabras, y tres se pueden tocar.</p>
        </header>
        <div className="th-thesis">
          <WordBench />
          <ol className="th-layers">
            {LAYERS.map((l) => (
              <li key={l.id}>
                <h3>
                  <span className="th-n">{l.n}</span>
                  {l.name}
                </h3>
                <p>{l.ask}</p>
                <div>
                  <dl>
                    {l.words.map((w) => (
                      <div key={w.w}>
                        <dt>
                          {w.probe ? (
                            <a href={`#probar-${w.w}`}>
                              {w.w}
                              <i className="th-probe">{w.probe}</i>
                            </a>
                          ) : (
                            w.w
                          )}
                        </dt>
                        <dd>{w.d}</dd>
                      </div>
                    ))}
                  </dl>
                  {l.id === "made" ? <MadeFigure /> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="th-section" id="galeria">
        <header>
          <p className="th-index">02 · la galería</p>
          <h2>Piezas desarmadas y vueltas a armar</h2>
          <p className="th-lead">
            Hay {GALLERY.length} en la galería. Cada una dice qué capa cambió y con qué palabras. Se suman más antes del jueves.
          </p>
          <p className="th-label th-swipe">desliza para ver las {GALLERY.length}</p>
        </header>
        <GalleryGrid more />
      </section>

      <section className="th-section" id="agenda">
        <header>
          <p className="th-index">03 · el workshop</p>
          <h2>90 minutos, en vivo</h2>
          <p className="th-lead">La mitad del tiempo se va en tres casos reales.</p>
        </header>
        <div className="th-plan">
          <ol className="th-agenda">
            {AGENDA.map((a) => (
              <li key={a.from} style={{ "--min": a.min } as React.CSSProperties}>
                <span className="th-min">
                  {a.from}-{a.from + a.min} min
                </span>
                <div>
                  <h3>{a.title}</h3>
                  {a.note ? <p>{a.note}</p> : null}
                  {a.cases ? (
                    <ul>
                      {a.cases.map((c) => (
                        <li key={c.title}>
                          <span className="th-tag">{c.layer}</span>
                          {c.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          <div className="th-take">
            <h3>Te llevas</h3>
            <ol>
              {TAKEAWAYS.map((t, i) => (
                <li key={t.title}>
                  <span className="th-n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{t.title}</h4>
                    <p>{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="th-section th-close">
        <header>
          <p className="th-index">04 · la entrada</p>
          <h2>
            Nombra lo que ves.
            <br />
            Pídeselo a tu agente.
          </h2>
          <p className="th-lead">
            ¿Ya compraste? <Link href="/taste-hacking/material">Entra al material</Link>
          </p>
        </header>
        <div className="th-plate th-ticks">
          <div className="th-plate-stage">
            <Ticket />
          </div>
        </div>
      </section>
    </main>
  );
}
