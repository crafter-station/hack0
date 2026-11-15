import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { GALLERY } from "../gallery";
import { MaterialNav } from "../material-nav";
import { pieceBySlug, pieceHref } from "../pieces";
import { SLOP, VOCABULARY, VOCABULARY_INTRO } from "../vocabulario";
import { WordBench } from "../word-bench";
import { WORKSHOP } from "../workshop";

const TITLE = "Vocabulario de diseño web, animación y video en español";
const DESCRIPTION =
  "Los términos de diseño, animación y video que usamos en Taste hacking, cada uno en una línea y con un ejemplo medido en una pieza real.";
const PATH = "/taste-hacking/vocabulario";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: "article" },
};

const TERMS = VOCABULARY.flatMap((s) => s.groups.flatMap((g) => g.terms));

const TERMS_LD = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "El vocabulario de Taste hacking",
  description: DESCRIPTION,
  inLanguage: "es",
  url: `${SITE}${PATH}`,
  author: { "@type": "Person", name: "Railly Hugo" },
  hasDefinedTerm: TERMS.map((t) => ({ "@type": "DefinedTerm", name: t.term, description: `${t.term} ${t.text}` })),
};

const SECTIONS = [...VOCABULARY.map((s) => ({ id: s.id, label: s.title.replace("Cómo ", "") })), { id: "slop", label: "slop" }].map(
  (s) => ({
    id: s.id,
    label: s.label.charAt(0).toUpperCase() + s.label.slice(1),
  }),
);

/** The gallery's short name of each piece, for the links that follow a term. */
const SHORT_TITLE = new Map(GALLERY.map((g) => [g.slug, g.title]));

function termId(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

function Terms({ terms }: { terms: (typeof TERMS)[number][] }) {
  return (
    <dl className="th-terms">
      {terms.map((t) => (
        <div key={t.term} id={termId(t.term)}>
          <dt>{t.term}</dt>
          <dd>
            {t.text}
            {t.bench || t.pieces.length ? (
              <span className="th-term-links">
                {t.bench ? (
                  <a href={`#probar-${t.bench}`}>
                    probar <span aria-hidden="true">↑</span>
                  </a>
                ) : null}
                {t.pieces.map((slug) => {
                  const piece = pieceBySlug(slug);
                  return piece ? (
                    <Link key={slug} href={pieceHref(piece)} title={piece.title}>
                      {SHORT_TITLE.get(slug) ?? piece.title} <span aria-hidden="true">→</span>
                    </Link>
                  ) : null;
                })}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function VocabularioPage() {
  return (
    <main className="th-mat th-read">
      <JsonLd data={TERMS_LD} />
      <div className="th-mat-grid">
        <MaterialNav sections={SECTIONS} />
        <article className="th-mat-body">
          <header className="th-read-head">
            <p className="th-read-kicker">
              <Link href="/taste-hacking#indice">Taste hacking</Link>
              <span>01 · {TERMS.length} términos</span>
            </p>
            <h1>El vocabulario</h1>
            <p className="th-prose">{VOCABULARY_INTRO}</p>
          </header>

          <div className="th-read-bench">
            <WordBench />
          </div>

          {VOCABULARY.map((s) => (
            <section key={s.id} className="th-mat-section" id={s.id}>
              <h2>{s.title}</h2>
              {s.groups.map((g) => (
                <div key={g.title ?? s.id} className="th-term-group">
                  {g.title ? <h3>{g.title}</h3> : null}
                  <Terms terms={g.terms} />
                </div>
              ))}
            </section>
          ))}

          <section className="th-mat-section" id="slop">
            <h2>Slop</h2>
            {SLOP.map((p) => (
              <p key={p} className="th-prose">
                {p}
              </p>
            ))}
          </section>

          <section className="th-mat-section th-paid">
            <h2>Úsalo en vivo</h2>
            <p className="th-prose">
              El workshop del {WORKSHOP.day} recorre este vocabulario con tres casos en vivo. Early bird {WORKSHOP.earlyBird}, general{" "}
              {WORKSHOP.price}.
            </p>
            <div className="th-actions">
              <a className="th-cta" href={WORKSHOP.luma}>
                Inscríbete en Luma <span aria-hidden="true">→</span>
              </a>
              <Link className="th-ghost" href="/taste-hacking#indice">
                Volver al índice
              </Link>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
