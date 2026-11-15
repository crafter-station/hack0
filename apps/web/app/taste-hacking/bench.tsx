"use client";

import { useEffect, useState } from "react";
import { Ticket } from "./ticket";
import { LAYERS, type LayerId } from "./workshop";

type Layers = Record<LayerId, boolean>;
type Seg = { t: string; hl?: boolean };

/** The prompt that asks for the ticket as it is right now: a layer that is on is named, the rest is left to luck. */
function promptFor({ look, motion, made }: Layers): Seg[] {
  const segs: Seg[] = [{ t: "hazme la entrada del workshop." }];
  if (look) {
    segs.push(
      { t: " letra " },
      { t: "mono en 800", hl: true },
      { t: ", " },
      { t: "tracking -0.06em", hl: true },
      { t: ". todo a la " },
      { t: "grilla", hl: true },
      { t: ", papel y tinta, " },
      { t: "un solo acento", hl: true },
      { t: "." },
    );
  }
  if (motion) {
    segs.push(
      { t: " que entre desde abajo con " },
      { t: "ease-out", hl: true },
      { t: " y las filas con " },
      { t: "stagger", hl: true },
      { t: " de 40 ms. el botón, " },
      { t: "scale(0.97)", hl: true },
      { t: " al presionar." },
    );
  }
  if (!look && !motion) segs.push({ t: " hazlo bonito." });
  else if (!look || !motion) segs.push({ t: " lo demás, hazlo bonito." });
  if (made) segs.push({ t: " y muéstrame los " }, { t: "estilos computados", hl: true }, { t: " de cada parte." });
  return segs;
}

function hex(color: string): string {
  const m = color.match(/\d+/g);
  if (!m || m.length < 3) return color;
  return `#${m
    .slice(0, 3)
    .map((v) => Number(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

type Readout = { n: string; part: string; value: string }[];

/** Computed styles of the live ticket, read from the DOM so the readout cannot disagree with the piece. */
function measure(root: HTMLElement): Readout {
  const style = (probe: string) => {
    const el = root.querySelector<HTMLElement>(`[data-probe="${probe}"]`);
    return el ? getComputedStyle(el) : null;
  };
  const title = style("1");
  const card = style("2");
  const button = style("4");
  const rows = [...root.querySelectorAll<HTMLElement>('[data-probe="3"] > div')].map((el) => getComputedStyle(el));
  const row = rows[0];
  if (!title || !card || !button || !row) return [];
  const family = (title.fontFamily.split(",")[0] ?? "").replaceAll('"', "").replace(/ Fallback$/, "");
  const em = Number.parseFloat(title.letterSpacing) / Number.parseFloat(title.fontSize);
  const tracking = Number.isFinite(em) ? `${em.toFixed(2)}em` : "normal";
  const fill = card.backgroundImage === "none" ? hex(card.backgroundColor) : "linear-gradient, 3 colores";
  // Named motion staggers the rows; unnamed motion pops the whole card. The readout follows whichever is running.
  const step = Math.round((Number.parseFloat(rows[1]?.animationDelay ?? "0") - Number.parseFloat(row.animationDelay)) * 1000);
  const enter =
    row.animationName !== "none"
      ? `${row.animationDuration} · ${row.animationTimingFunction} · stagger ${step}ms`
      : card.animationName !== "none"
        ? `${card.animationDuration} · ${card.animationTimingFunction}`
        : "sin animación";
  return [
    { n: "1", part: "letra", value: `${family} ${title.fontWeight} · tracking ${tracking}` },
    { n: "2", part: "tarjeta", value: `${fill} · radio ${card.borderTopLeftRadius}` },
    { n: "3", part: "entrada", value: enter },
    { n: "4", part: "botón", value: `transition ${button.transitionProperty} · ${button.transitionDuration}` },
  ];
}

const EMPTY: Readout = ["letra", "tarjeta", "entrada", "botón"].map((part, i) => ({ n: String(i + 1), part, value: "" }));

/**
 * The bench: the workshop's own ticket with its three layers on switches. Turning one off hands that layer
 * back to "hazlo bonito"; the prompt on the left always matches what is on the plate.
 */
export function Bench() {
  // `run` counts replays: each one remounts the ticket so its entrance plays again.
  const [state, setState] = useState<Layers & { run: number }>({ look: true, motion: true, made: false, run: 0 });
  const [readout, setReadout] = useState<Readout>(EMPTY);
  const [plate, setPlate] = useState<HTMLDivElement | null>(null);
  const { run, ...layers } = state;

  useEffect(() => {
    setReadout(plate && state.made ? measure(plate) : EMPTY);
  }, [plate, state]);

  const replay = () => setState((s) => ({ ...s, run: s.run + 1 }));
  const toggle = (id: LayerId) => setState((s) => ({ ...s, [id]: !s[id], run: id === "made" ? s.run : s.run + 1 }));

  return (
    <>
      <div className="th-switchbox">
        <p className="th-label">Esta entrada tiene tres capas. Apaga una y esa capa vuelve a «hazlo bonito».</p>
        <ul className="th-switches">
          {LAYERS.map((l) => (
            <li key={l.id}>
              <button type="button" role="switch" aria-checked={state[l.id]} onClick={() => toggle(l.id)}>
                <span className="th-n">{l.n}</span>
                <b>{l.short}</b>
                <span className="th-switch-ask">{l.id === "made" ? "Abre el inspector." : l.ask}</span>
                <i aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="th-label th-rm">Tu sistema pide menos movimiento, así que la capa «se mueve» está en pausa.</p>
      </div>

      <div
        className="th-plate th-ticks"
        ref={setPlate}
        data-look={layers.look ? "on" : "off"}
        data-motion={layers.motion ? "on" : "off"}
        data-made={layers.made ? "on" : "off"}
      >
        <p className="th-plate-head">
          <span>
            <b className="th-n">00</b> la entrada
          </span>
          <span>en vivo, en HTML y CSS</span>
        </p>
        <div className="th-plate-stage">
          <Ticket key={run} />
          {run > 0 ? <i key={`scan-${run}`} className="th-scan" aria-hidden="true" /> : null}
        </div>
        <dl className="th-readout" aria-live="polite">
          {readout.map((r) => (
            <div key={r.n}>
              <dt>
                <i>{r.n}</i>
                {r.part}
              </dt>
              <dd>{r.value || <span aria-hidden="true">· · ·</span>}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="th-prompt">
        <p className="th-label">
          <span>el prompt de lo que ves</span>
          <button type="button" onClick={replay}>
            repetir entrada
          </button>
        </p>
        <p className="th-prompt-text">
          <i aria-hidden="true">› </i>
          {promptFor(layers).map((seg) => (seg.hl ? <mark key={seg.t}>{seg.t}</mark> : <span key={seg.t}>{seg.t}</span>))}
        </p>
      </div>
    </>
  );
}
