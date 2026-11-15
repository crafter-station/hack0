import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { GALLERY, GALLERY_TARGET } from "./gallery";
import { GalleryGrid } from "./gallery-grid";
import { ScanGlobe } from "./globe";
import { AGENDA, LAYERS, PROMPT, TAKEAWAYS, WORKSHOP } from "./workshop";

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

export default function TasteHackingPage() {
  return (
    <main>
      <JsonLd data={EVENT_LD} />

      <section className="th-hero">
        <ScanGlobe />
        <p className="th-by">
          <b>Railly Hugo</b>
          <span>MTS en Vercel · founder de Crafter Station</span>
        </p>
        <h1>
          Taste
          <br />
          hacking
        </h1>
        <p className="th-sub">{WORKSHOP.subtitle}.</p>
        <dl className="th-facts">
          <div>
            <dt>fecha</dt>
            <dd>{WORKSHOP.day}</dd>
            <dd className="th-dim">90 minutos, en vivo</dd>
          </div>
          <div>
            <dt>hora</dt>
            {WORKSHOP.times.map((t) => (
              <dd key={t.zone} className={t.zone === "GMT-3" ? undefined : "th-dim"}>
                {t.time} {t.zone === "GMT-3" ? "GMT-3" : t.place}
              </dd>
            ))}
          </div>
          <div>
            <dt>lugar</dt>
            <dd>online</dd>
            <dd className="th-dim">Google Meet</dd>
          </div>
          <div>
            <dt>entrada</dt>
            <dd>{WORKSHOP.price}</dd>
            <dd className="th-dim">early bird {WORKSHOP.earlyBird}</dd>
          </div>
        </dl>
        <a className="th-cta" href={WORKSHOP.luma}>
          Inscríbete en Luma <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="th-section" id="capas">
        <h2>Todo lo que ves tiene tres capas</h2>
        <p className="th-lead">Si nombras cada capa, se la puedes pedir a un agente.</p>
        <ol className="th-layers">
          {LAYERS.map((l) => (
            <li key={l.n}>
              <span className="th-n">{l.n}</span>
              <div>
                <h3>{l.name}</h3>
                <p>{l.ask}</p>
              </div>
              <ul>
                {l.words.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="th-prompt">
          <p className="th-prompt-before">
            <span>antes</span>
            <s>hazlo bonito</s>
          </p>
          <p className="th-prompt-after">
            <span>después</span>
            <span>
              <i aria-hidden="true">› </i>
              {PROMPT.map((seg) => (seg.hl ? <mark key={seg.t}>{seg.t}</mark> : seg.t))}
            </span>
          </p>
        </div>
      </section>

      <section className="th-section" id="agenda">
        <h2>90 minutos</h2>
        <p className="th-lead">Los casos van preparados. Si algo falla en vivo, el debugging es parte de la clase.</p>
        <ol className="th-agenda">
          {AGENDA.map((a) => (
            <li key={a.min}>
              <span className="th-min">{a.min} min</span>
              <h3>{a.title}</h3>
              {a.note ? <p>{a.note}</p> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="th-section" id="te-llevas">
        <h2>Lo que te llevas</h2>
        <ol className="th-take">
          {TAKEAWAYS.map((t, i) => (
            <li key={t.title}>
              <span className="th-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{t.title}</h3>
              <p>{t.note}</p>
            </li>
          ))}
        </ol>
        <p className="th-lead">Con tu entrada tienes todo esto, más las recreaciones nuevas que sigamos haciendo.</p>
      </section>

      <section className="th-section" id="galeria">
        <h2>Galería</h2>
        <p className="th-lead">
          {GALLERY.length} de {GALLERY_TARGET} recreaciones. El resto se suma antes del jueves 19.
        </p>
        <GalleryGrid />
      </section>

      <section className="th-close">
        <h2>Nombra lo que ves. Pídeselo a tu agente.</h2>
        <a className="th-cta" href={WORKSHOP.luma}>
          Inscríbete en Luma <span aria-hidden="true">→</span>
        </a>
        <p>
          ¿Ya compraste? <Link href="/taste-hacking/material">Entra al material</Link>
        </p>
      </section>
    </main>
  );
}
