import { Clip } from "./clip";
import { GALLERY, LAYER_LABEL } from "./gallery";

export function GalleryGrid() {
  return (
    <ul className="th-gallery">
      {GALLERY.map((g, i) => (
        <li key={g.slug}>
          <Clip src={g.video} poster={g.poster} label={g.title} sound={g.sound} />
          <div className="th-gallery-meta">
            <span className="th-n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{g.title}</h3>
            <span className="th-tag">{LAYER_LABEL[g.layer]}</span>
          </div>
          <p>{g.note}</p>
          {g.original ? (
            <a href={g.original} rel="noreferrer">
              ver el original ↗
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
