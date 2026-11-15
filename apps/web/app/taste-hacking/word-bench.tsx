"use client";

import { useId, useRef, useState } from "react";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const REVEAL_MS = 600;

/** The graph's box in px: progress 0 sits at `GRAPH.zero`, progress 1 at `GRAPH.one`, the rest is headroom for overshoot. */
const GRAPH = { h: 84, zero: 70, one: 22 };
const y = (p: number) => GRAPH.zero - p * (GRAPH.zero - GRAPH.one);

/** The dot stops at this share of its track, marked by a tick, so an overshoot has room to show. */
const TRAVEL = 0.84;

const SPRING = { stiffness: 170, damping: 14, mass: 1 };

/** Positions of a spring going from 0 to 1, one per 60 Hz frame, until it settles. */
function springFrames({ stiffness, damping, mass }: typeof SPRING): number[] {
  const frames = [0];
  const dt = 1 / 600;
  let x = 0;
  let v = 0;
  for (let step = 1; step <= 6000; step++) {
    v += ((stiffness * (1 - x) - damping * v) / mass) * dt;
    x += v * dt;
    if (step % 10 === 0) {
      frames.push(x);
      if (Math.abs(1 - x) < 0.001 && Math.abs(v) < 0.01) break;
    }
  }
  frames[frames.length - 1] = 1;
  return frames;
}

const SPRING_FRAMES = springFrames(SPRING);
const SPRING_MS = Math.round(((SPRING_FRAMES.length - 1) * 1000) / 60);

type Curve = { id: string; value: string; note: string; ms: number; easing: string; path: string; frames?: number[] };

function bezier(id: string, note: string, [x1, y1, x2, y2]: [number, number, number, number]): Curve {
  const value = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  return {
    id,
    value,
    note,
    ms: REVEAL_MS,
    easing: value,
    path: `M0,${y(0)} C${x1 * 100},${y(y1)} ${x2 * 100},${y(y2)} 100,${y(1)}`,
  };
}

const CURVES: Curve[] = [
  bezier("ease-in", "Arranca lento y llega de golpe.", [0.42, 0, 1, 1]),
  bezier("linear", "Velocidad constante, como una máquina.", [0, 0, 1, 1]),
  bezier("ease-out", "Sale rápido y frena al llegar.", [0.16, 1, 0.3, 1]),
  {
    id: "spring",
    value: `stiffness ${SPRING.stiffness} · damping ${SPRING.damping}`,
    note: "Se pasa y vuelve: eso es overshoot.",
    ms: SPRING_MS,
    easing: "linear",
    path: `M${SPRING_FRAMES.map((p, i) => `${((i / (SPRING_FRAMES.length - 1)) * 100).toFixed(2)},${y(p).toFixed(2)}`).join(" L")}`,
    frames: SPRING_FRAMES,
  },
];

const TRACKING = { min: -0.1, max: 0.1, step: 0.01, start: -0.05 };
const STAGGER = { min: 0, max: 200, step: 10, start: 40 };
const ROWS = [0, 1, 2, 3, 4];

function trackingNote(em: number): string {
  if (em <= -0.03) return "Apretado: para titulares grandes.";
  if (em >= 0.03) return "Abierto: para etiquetas en mayúsculas.";
  return "Neutro: para texto corrido.";
}

function staggerNote(ms: number): string {
  if (ms === 0) return "Sin stagger: todo entra junto.";
  if (ms <= 60) return "Se lee como una sola ola.";
  return "Cada fila se hace esperar.";
}

/** With reduced motion a demo only runs from its own button, never as a side effect of changing a value. */
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function restart(el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  if (!el) return;
  for (const a of el.getAnimations()) a.cancel();
  el.animate(keyframes, options);
}

/**
 * The word bench: three glossary words with a control each. The specimen changes as the control moves
 * and the exact value is printed under it, so the word and the number arrive together.
 */
export function WordBench() {
  const [tracking, setTracking] = useState<number>(TRACKING.start);
  const [curveId, setCurveId] = useState("ease-out");
  const [stagger, setStagger] = useState<number>(STAGGER.start);
  const dot = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  const name = useId();
  const curve = CURVES.find((c) => c.id === curveId) ?? CURVES[0];

  const runCurve = (c: Curve) => {
    const frames = c.frames ?? [0, 1];
    const timing: KeyframeAnimationOptions = { duration: c.ms, easing: c.easing, fill: "forwards" };
    restart(
      dot.current,
      frames.map((p) => ({ transform: `translateX(calc((100cqw - 12px) * ${p * TRAVEL}))` })),
      timing,
    );
    // The graph's marker: time moves it across at a constant rate, the curve moves it up.
    restart(head.current, [{ transform: "translateX(0)" }, { transform: "translateX(100cqw)" }], {
      duration: c.ms,
      easing: "linear",
      fill: "forwards",
    });
    restart(
      head.current?.firstElementChild ?? null,
      frames.map((p) => ({ transform: `translateY(${y(p) - y(0)}px)` })),
      timing,
    );
  };

  const runStagger = (ms: number) => {
    [...(rows.current?.children ?? [])].forEach((el, i) => {
      restart(
        el,
        [
          { transform: "translateY(10px)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        {
          duration: REVEAL_MS,
          delay: i * ms,
          easing: EASE_OUT,
          fill: "backwards",
        },
      );
    });
  };

  const em = `${tracking.toFixed(2)}em`;

  return (
    <div className="th-plate th-ticks th-words">
      <p className="th-plate-head">
        <span>
          <b className="th-n">01</b> tres palabras, a mano
        </span>
        <span>mueve un control</span>
      </p>
      <p className="th-label th-rm">Tu sistema pide menos movimiento: easing y stagger corren solo cuando tocas «probar».</p>

      <div className="th-stations">
        <section className="th-station" id="probar-tracking" aria-labelledby={`${name}-t`}>
          <h3 id={`${name}-t`}>
            <i className="th-probe">1</i>tracking
          </h3>
          <div className="th-station-stage" aria-hidden="true">
            <span className="th-fig-word" style={{ letterSpacing: em }}>
              Taste
            </span>
          </div>
          <div className="th-station-ctl">
            <input
              className="th-range"
              type="range"
              aria-labelledby={`${name}-t`}
              aria-valuetext={em}
              min={TRACKING.min}
              max={TRACKING.max}
              step={TRACKING.step}
              value={tracking}
              onChange={(e) => setTracking(Number(e.target.value))}
            />
            <p className="th-scale" aria-hidden="true">
              <span>{TRACKING.min.toFixed(2)}</span>
              <span>0</span>
              <span>{TRACKING.max.toFixed(2)}</span>
            </p>
          </div>
          <p className="th-station-out">
            <output>letter-spacing: {em}</output>
            <span>{trackingNote(tracking)}</span>
          </p>
        </section>

        <section className="th-station" id="probar-easing" aria-labelledby={`${name}-e`}>
          <h3 id={`${name}-e`}>
            <i className="th-probe">2</i>easing
            <button type="button" onClick={() => runCurve(curve)}>
              probar
            </button>
          </h3>
          <div className="th-station-stage th-ease" aria-hidden="true">
            <span className="th-ease-track">
              <span ref={dot} />
            </span>
            <span className="th-ease-graph">
              <svg viewBox={`0 0 100 ${GRAPH.h}`} preserveAspectRatio="none">
                <title>{curve.id}</title>
                <path className="th-ease-rule" d={`M0,${y(1)} H100 M0,${y(0)} H100`} />
                <path d={curve.path} />
              </svg>
              <span ref={head}>
                <i />
              </span>
            </span>
          </div>
          <div className="th-station-ctl th-curves" role="radiogroup" aria-labelledby={`${name}-e`}>
            {CURVES.map((c) => (
              <label key={c.id}>
                <input
                  type="radio"
                  name={name}
                  checked={c.id === curveId}
                  onChange={() => {
                    setCurveId(c.id);
                    if (!calm()) runCurve(c);
                  }}
                />
                <span>{c.id}</span>
              </label>
            ))}
          </div>
          <p className="th-station-out">
            <output>
              {curve.value} · {curve.ms}ms
            </output>
            <span>{curve.note}</span>
          </p>
        </section>

        <section className="th-station" id="probar-stagger" aria-labelledby={`${name}-s`}>
          <h3 id={`${name}-s`}>
            <i className="th-probe">3</i>stagger
            <button type="button" onClick={() => runStagger(stagger)}>
              probar
            </button>
          </h3>
          <div className="th-station-stage th-rows" ref={rows} aria-hidden="true">
            {ROWS.map((i) => (
              <span key={i} />
            ))}
          </div>
          <div className="th-station-ctl">
            <input
              className="th-range"
              type="range"
              aria-labelledby={`${name}-s`}
              aria-valuetext={`${stagger}ms`}
              min={STAGGER.min}
              max={STAGGER.max}
              step={STAGGER.step}
              value={stagger}
              onChange={(e) => {
                const ms = Number(e.target.value);
                setStagger(ms);
                if (!calm()) runStagger(ms);
              }}
            />
            <p className="th-scale" aria-hidden="true">
              <span>{STAGGER.min}</span>
              <span>{STAGGER.max / 2}</span>
              <span>{STAGGER.max}</span>
            </p>
          </div>
          <p className="th-station-out">
            <output>
              stagger {stagger}ms · total {REVEAL_MS + stagger * (ROWS.length - 1)}ms
            </output>
            <span>{staggerNote(stagger)}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
