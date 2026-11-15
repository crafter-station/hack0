import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { chapterNumber } from "../chapters";
import { Clip } from "../clip";
import { GALLERY } from "../gallery";
import { MaterialNav } from "../material-nav";
import { PieceAccess } from "../piece-access";
import { CHAPTER_BY_LAYER, PIECES, PIECES_PUBLISHED, type Piece, pieceByPath, pieceBySlug, pieceHref } from "../pieces";
import { WORKSHOP } from "../workshop";

export const dynamicParams = false;

export function generateStaticParams() {
  return PIECES.map((p) => ({ piece: p.path }));
}

type Props = { params: Promise<{ piece: string }> };

function mediaOf(piece: Piece) {
  const media = GALLERY.find((g) => g.slug === piece.slug);
  if (!media) throw new Error(`No gallery entry for ${piece.slug}`);
  return media;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const piece = pieceByPath((await params).piece);
  if (!piece) return {};
  const url = pieceHref(piece);
  const image = { url: mediaOf(piece).poster, width: 720, height: 900, alt: piece.title };
  return {
    title: piece.seoTitle,
    description: piece.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: piece.seoTitle,
      description: piece.metaDescription,
      url,
      type: "article",
      publishedTime: PIECES_PUBLISHED,
      authors: ["Railly Hugo"],
      images: [image],
    },
    twitter: { card: "summary", title: piece.seoTitle, description: piece.metaDescription, images: [image.url] },
  };
}

const LAYER_ROWS = [
  { key: "seVe", name: "Cómo se ve" },
  { key: "seMueve", name: "Cómo se mueve" },
  { key: "estaHecho", name: "Cómo está hecho" },
] as const;

function articleLd(piece: Piece, poster: string) {
  const url = `${SITE}${pieceHref(piece)}`;
  const layers = LAYER_ROWS.filter((l) => piece.layers[l.key]).map((l) => ({ "@type": "Thing", name: l.name }));
  const reference = piece.reference
    ? [
        {
          "@type": "CreativeWork",
          name: piece.reference.name,
          url: piece.reference.url,
          author: { "@type": "Organization", name: piece.reference.author },
        },
      ]
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: piece.title,
    description: piece.metaDescription,
    inLanguage: "es",
    image: [`${SITE}${poster}`],
    url,
    mainEntityOfPage: url,
    datePublished: PIECES_PUBLISHED,
    author: { "@type": "Person", name: "Railly Hugo", url: "https://railly.dev" },
    publisher: { "@type": "Organization", name: "hack0", url: SITE },
    about: [...reference, ...layers],
    isPartOf: {
      "@type": "Event",
      name: `${WORKSHOP.title}: ${WORKSHOP.subtitle}`,
      startDate: WORKSHOP.startAt,
      endDate: WORKSHOP.endAt,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: { "@type": "VirtualLocation", url: WORKSHOP.luma },
      url: `${SITE}/taste-hacking`,
    },
  };
}

function faqLd(piece: Piece) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: piece.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

function sectionsOf(piece: Piece) {
  return [
    { id: "capas", label: "Capas" },
    ...(piece.measured.length ? [{ id: "medido", label: "Medido" }] : []),
    { id: "desarme", label: "Desarme" },
    { id: "preguntas", label: "Preguntas" },
    { id: "sesion", label: "Sesión" },
  ];
}

function Reference({ piece }: { piece: Piece }) {
  if (!piece.reference) return <p className="th-read-ref">Espécimen hecho para el promo del workshop, sin referencia externa.</p>;
  return (
    <p className="th-read-ref">
      Referencia:{" "}
      <a href={piece.reference.url} rel="noreferrer">
        {piece.reference.name} <span aria-hidden="true">↗</span>
      </a>
      , de {piece.reference.author}.
    </p>
  );
}

function Diff({ piece }: { piece: Piece }) {
  return (
    <dl className="th-read-diff">
      {piece.antes ? (
        <div>
          <dt>antes</dt>
          <dd>
            <s>{piece.antes}</s>
          </dd>
        </div>
      ) : null}
      <div>
        <dt>{piece.antes ? "después" : "pieza"}</dt>
        <dd>{piece.despues}</dd>
      </div>
    </dl>
  );
}

function Measured({ piece }: { piece: Piece }) {
  if (!piece.measured.length) return null;
  return (
    <section className="th-mat-section" id="medido">
      <h2>Lo medido</h2>
      <table className="th-spec">
        <tbody>
          {piece.measured.map((m) => (
            <tr key={m.label}>
              <th scope="row">{m.label}</th>
              <td>
                {m.value}
                {m.note ? <small>{m.note}</small> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Related({ piece }: { piece: Piece }) {
  return (
    <section className="th-mat-section">
      <h2>Comparten vocabulario</h2>
      <ul className="th-related">
        {piece.related.map((r) => {
          const other = pieceBySlug(r.slug);
          return other ? (
            <li key={r.slug}>
              <span>{r.term}</span>
              <Link href={pieceHref(other)}>{other.title}</Link>
            </li>
          ) : null;
        })}
        <li>
          <span>todos</span>
          <Link href="/taste-hacking/vocabulario">El vocabulario, término por término</Link>
        </li>
      </ul>
    </section>
  );
}

function Offer({ piece }: { piece: Piece }) {
  return (
    <>
      <p className="th-prose">{piece.paidTeaser}</p>
      <p className="th-prose">
        La sesión y la skill son parte del workshop del {WORKSHOP.day}, online y en vivo. Early bird {WORKSHOP.earlyBird}, general{" "}
        {WORKSHOP.price}.
      </p>
      <div className="th-actions">
        <a className="th-cta" href={WORKSHOP.luma}>
          Inscríbete en Luma <span aria-hidden="true">→</span>
        </a>
      </div>
    </>
  );
}

function Around({ piece }: { piece: Piece }) {
  const at = PIECES.indexOf(piece);
  const prev = PIECES[at - 1];
  const next = PIECES[at + 1];
  return (
    <nav className="th-read-nav" aria-label="Otras piezas">
      {prev ? (
        <Link href={pieceHref(prev)} rel="prev">
          <span>
            <span aria-hidden="true">←</span> anterior
          </span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={pieceHref(next)} rel="next">
          <span>
            siguiente <span aria-hidden="true">→</span>
          </span>
          {next.title}
        </Link>
      ) : (
        <span />
      )}
      <Link className="th-read-up" href="/taste-hacking#indice">
        <span aria-hidden="true">↑</span> Volver al índice
      </Link>
    </nav>
  );
}

export default async function PiecePage({ params }: Props) {
  const piece = pieceByPath((await params).piece);
  if (!piece) notFound();
  const media = mediaOf(piece);
  const chapter = CHAPTER_BY_LAYER[piece.layer];
  return (
    <main className="th-mat th-read">
      <JsonLd data={articleLd(piece, media.poster)} />
      <JsonLd data={faqLd(piece)} />
      <div className="th-mat-grid">
        <MaterialNav sections={sectionsOf(piece)} />
        <article className="th-mat-body">
          <header className="th-read-head">
            <p className="th-read-kicker">
              <Link href="/taste-hacking#indice">Taste hacking</Link>
              <span>
                {chapterNumber(chapter.chapter)} · {chapter.label.toLowerCase()}
              </span>
            </p>
            <h1>{piece.title}</h1>
            <Reference piece={piece} />
          </header>

          <div className="th-read-figure">
            <div className="th-piece-clip">
              <Clip src={media.video} poster={media.poster} label={piece.title} sound={media.sound} />
            </div>
            <Diff piece={piece} />
          </div>

          <section className="th-mat-section" id="capas">
            <h2>Las 3 capas</h2>
            <dl className="th-read-layers">
              {LAYER_ROWS.map((l) => (
                <div key={l.key} data-empty={!piece.layers[l.key]}>
                  <dt>{l.name}</dt>
                  <dd>{piece.layers[l.key] ?? "Las fuentes de esta pieza no la cubren."}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Measured piece={piece} />

          <section className="th-mat-section" id="desarme">
            <h2>El desarme</h2>
            {piece.breakdown.map((p) => (
              <p key={p} className="th-prose">
                {p}
              </p>
            ))}
            <p className="th-lesson">
              <span>la lección</span>
              {piece.lesson}
            </p>
          </section>

          <section className="th-mat-section" id="preguntas">
            <h2>Preguntas</h2>
            {piece.faq.map((f) => (
              <div key={f.q} className="th-faq">
                <h3>{f.q}</h3>
                <p className="th-prose">{f.a}</p>
              </div>
            ))}
          </section>

          <Related piece={piece} />

          <section className="th-mat-section th-paid" id="sesion">
            <h2>La sesión completa</h2>
            <PieceAccess slug={piece.slug} title={piece.title} path={pieceHref(piece)}>
              <Offer piece={piece} />
            </PieceAccess>
          </section>

          <Around piece={piece} />
        </article>
      </div>
    </main>
  );
}
