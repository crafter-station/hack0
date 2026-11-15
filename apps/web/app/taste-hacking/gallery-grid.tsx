import { Clip } from "./clip";
import { GALLERY, LAYER_LABEL } from "./gallery";

/** The catalogue of pieces taken apart: the clip and one line each, with the rest behind "detalle". `more` adds the plate that says more are coming. */
export function GalleryGrid({ more = false }: { more?: boolean }) {
  return (
    <ul className="th-gallery">
      {GALLERY.map((g) => (
        <li key={g.slug} className="th-piece">
          <div className="th-piece-clip">
            <Clip src={g.video} poster={g.poster} label={g.title} sound={g.sound} />
          </div>
          <details name="th-piece">
            <summary>
              <h3>{g.title}</h3>
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
