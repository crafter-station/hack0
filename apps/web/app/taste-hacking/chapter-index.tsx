import Link from "next/link";
import { chapterNumber, LIVE_CASES, PIECE_CHAPTERS } from "./chapters";
import { pieceHref } from "./pieces";

const BASE = "/taste-hacking";

function LiveCases({ open }: { open: boolean }) {
  return LIVE_CASES.map((c, i) => (
    <li key={c.chapter} data-wait={!open}>
      <span className="th-ch-n">{chapterNumber(c.chapter)}</span>
      <div>
        <h3>
          {open && c.path ? <Link href={`${BASE}/${c.path}`}>{c.title}</Link> : open ? c.title : `Caso en vivo ${i + 1}`}
          <span className="th-tag">{c.layer}</span>
        </h3>
        <p>{open ? (c.summary ?? "En edición.") : "Después del workshop."}</p>
      </div>
    </li>
  ));
}

/**
 * The workshop as chapters: the thesis, the vocabulary, the three live cases and the pieces by layer.
 * `open` says whether the live cases are published; `thesis` is where chapter 00 lives from the page that shows the index.
 */
export function ChapterIndex({ open, thesis = "#capas" }: { open: boolean; thesis?: string }) {
  return (
    <ol className="th-chapters">
      <li>
        <span className="th-ch-n">00</span>
        <div>
          <h3>
            <Link href={thesis}>La tesis</Link>
          </h3>
          <p>Las 3 capas y por qué nombrarlas cambia lo que le puedes pedir a un agente.</p>
        </div>
      </li>
      <li>
        <span className="th-ch-n">01</span>
        <div>
          <h3>
            <Link href={`${BASE}/vocabulario`}>El vocabulario</Link>
          </h3>
          <p>Los términos de cada capa, en una línea y con un ejemplo medido.</p>
        </div>
      </li>
      <LiveCases open={open} />
      {PIECE_CHAPTERS.map((ch) => (
        <li key={ch.chapter}>
          <span className="th-ch-n">{chapterNumber(ch.chapter)}</span>
          <div>
            <h3>{ch.label}</h3>
            <ul>
              {ch.pieces.map((p) => (
                <li key={p.slug}>
                  <Link href={pieceHref(p)}>{p.title}</Link>
                  <p>{p.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
