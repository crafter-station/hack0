import Link from "next/link";
import { Clip } from "./clip";
import { GALLERY, LAYER_LABEL } from "./gallery";
import { pieceBySlug, pieceHref } from "./pieces";

function PieceTitle({ slug, title }: { slug: string; title: string }) {
  const piece = pieceBySlug(slug);
  return <h3>{piece ? <Link href={pieceHref(piece)}>{title}</Link> : title}</h3>;
}

/** The catalogue of pieces taken apart: the clip and one line each. The title opens the piece's page; the rest sits behind the disclosure. `more` adds the plate that says more are coming. */
export function GalleryGrid({ more = false }: { more?: boolean }) {
  return (
    <ul className="th-gallery">
      {GALLERY.map((g) => (
        <li key={g.slug} className="th-piece">
          <div className="th-piece-clip">
            <Clip src={g.video} poster={g.poster} label={g.title} sound={g.sound} />
          </div>
          <div className="th-piece-body">
            <PieceTitle slug={g.slug} title={g.title} />
            <details name="th-piece">
              <summary aria-label={`Detalle de ${g.title}`}>
                <span className="th-piece-layer">{LAYER_LABEL[g.layer]}</span>
                <i aria-hidden="true" />
              </summary>
              <dl className="th-piece-diff">
                {g.before ? (
                  <div>
                    <dt>antes</dt>
                    <dd>
                      <s>{g.before}</s>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>{g.before ? "después" : "pieza"}</dt>
                  <dd>{g.after}</dd>
                </div>
                {g.credit ? (
                  <div>
                    <dt>ref</dt>
                    <dd>{g.credit}</dd>
                  </div>
                ) : null}
              </dl>
              {g.session || g.original ? (
                <p className="th-piece-links">
                  {g.session ? (
                    <a href={g.session}>
                      ver la sesión <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
                  {g.original ? (
                    <a href={g.original} rel="noreferrer">
                      original <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </p>
              ) : null}
            </details>
          </div>
        </li>
      ))}
      {more ? (
        <li className="th-piece th-piece-next" aria-label="Se suman más piezas antes del jueves">
          <div className="th-piece-clip th-ticks">
            <p>Se suman más antes del jueves.</p>
          </div>
        </li>
      ) : null}
    </ul>
  );
}
