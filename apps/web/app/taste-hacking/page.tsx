import { statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { liveCasesOpen } from "@/lib/live-cases";
import { SITE } from "@/lib/site";
import { Bench } from "./bench";
import { ChapterIndex } from "./chapter-index";
import { GALLERY } from "./gallery";
import { GalleryGrid } from "./gallery-grid";
import { Ticket } from "./ticket";
import { WordBench } from "./word-bench";
import { AGENDA, LAYERS, TAKEAWAYS, WORKSHOP } from "./workshop";

const DESCRIPTION = `${WORKSHOP.subtitle}. Workshop online de 90 minutos con Railly Hugo, el jueves 19 de noviembre.`;

/** The live cases open on a date, so the page is rebuilt often enough to flip without a deploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Taste hacking · workshop de hack0",
  description: DESCRIPTION,
  alternates: { canonical: "/taste-hacking" },
  openGraph: { title: "Taste hacking", description: DESCRIPTION, url: "/taste-hacking", type: "website" },
  twitter: { card: "summary_large_image", title: "Taste hacking", description: DESCRIPTION },
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
  image: [`${SITE}/taste-hacking/opengraph-image`],
  description: DESCRIPTION,
  url: `${SITE}/taste-hacking`,
  offers: { "@type": "Offer", url: WORKSHOP.luma, price: "20", priceCurrency: "USD", availability: "https://schema.org/InStock" },
  organizer: { "@type": "Organization", name: "hack0", url: SITE },
  performer: { "@type": "Person", name: "Railly Hugo" },
};

const LOOPS = GALLERY.filter((g) => !g.sound);

/** Weight of the looping clips, read from disk; null where the page is rebuilt without the public folder beside it. */
function loopsWeight(): number | null {
  try {
    return LOOPS.reduce((sum, g) => sum + statSync(join(process.cwd(), "public", g.video)).size, 0);
  } catch {
    // The count still reads without the weight, and a rebuild must not fail over a figure.
    return null;
  }
}

/** What this page is made of, for the third layer. */
function madeOf(): string[] {
  const bytes = loopsWeight();
  return [
    "Next.js 16 y React 19",
    "CSS plano, sin librerías de animación",
    "JetBrains Mono en 500, 700 y 800",
    bytes === null ? `${LOOPS.length} clips en loop` : `${LOOPS.length} clips en loop, ${Math.round(bytes / 1024)} kB entre todos`,
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
          <p className="th-index">00 · la tesis</p>
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

      <section className="th-section" id="indice">
        <header>
          <p className="th-index">el índice</p>
          <h2>Piezas desarmadas y vueltas a armar</h2>
          <p className="th-lead">
            Cada pieza tiene su página con la referencia, las 3 capas nombradas, el clip, el antes y el después y los valores medidos. Hay{" "}
            {GALLERY.length} y se suman más antes del jueves.
          </p>
        </header>
        <div className="th-index-body">
          <ChapterIndex open={liveCasesOpen()} />
          <div id="galeria">
            <p className="th-label th-swipe">desliza para ver las {GALLERY.length}</p>
            <GalleryGrid more />
          </div>
        </div>
      </section>

      <section className="th-section" id="agenda">
        <header>
          <p className="th-index">el workshop</p>
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
          <p className="th-index">la entrada</p>
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
