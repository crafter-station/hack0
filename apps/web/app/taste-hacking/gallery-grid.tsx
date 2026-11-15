import { Clip } from "./clip";
import { GALLERY, LAYER_LABEL } from "./gallery";

/** The catalogue of pieces taken apart. `more` adds the empty plate that says more are coming. */
export function GalleryGrid({ more = false }: { more?: boolean }) {
  return (
    <ul className="th-gallery">
      {GALLERY.map((g, i) => (
        <li key={g.slug} className="th-piece">
          <div className="th-piece-clip">
            <Clip src={g.video} poster={g.poster} label={g.title} sound={g.sound} />
          </div>
          <div className="th-piece-head">
            <span className="th-n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{g.title}</h3>
            <span className="th-tag">{LAYER_LABEL[g.layer]}</span>
          </div>
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
          </dl>
          <p className="th-piece-links">
            {g.session ? (
              <a href={g.session}>
                ver la sesión <span aria-hidden="true">→</span>
              </a>
            ) : (
              <span>sesión: después del workshop</span>
            )}
            {g.original ? (
              <a href={g.original} rel="noreferrer">
                original <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </p>
        </li>
      ))}
      {more ? (
        <li className="th-piece th-piece-next" aria-label="Se suman más piezas antes del jueves">
          <div className="th-piece-clip th-ticks">
            <p>
              <span className="th-n">{String(GALLERY.length + 1).padStart(2, "0")}</span>
              Se suman más antes del jueves.
            </p>
          </div>
        </li>
      ) : null}
    </ul>
  );
}
