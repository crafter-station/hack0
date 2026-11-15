"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

// cobe angle that centres LATAM (lng -68), as on the home globe.
const HOME = Math.PI - ((-68 * Math.PI) / 180 - Math.PI / 2);
const ACCENT: [number, number, number] = [1, 0.24, 0];

// LATAM tech hubs (lat, lng) and the net between them. Decoration, not a claim about events.
const CITIES: [number, number][] = [
  [-12.05, -77.04],
  [4.71, -74.07],
  [19.43, -99.13],
  [-34.6, -58.38],
  [-33.45, -70.67],
  [-23.55, -46.63],
  [-0.18, -78.47],
  [-16.5, -68.15],
  [-34.9, -56.16],
  [10.48, -66.9],
  [14.63, -90.51],
];
const ARCS: [number, number][] = [
  [0, 1],
  [0, 3],
  [0, 4],
  [1, 2],
  [3, 5],
  [0, 7],
  [2, 10],
  [3, 8],
];

/** The promo's backdrop: a dotted globe with an orange net, swaying around LATAM. Still under reduced motion. */
export function ScanGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const size = canvas.offsetWidth;
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: HOME,
      theta: 0.15,
      dark: 1,
      diffuse: 0.4,
      mapSamples: 16000,
      mapBrightness: 8,
      mapBaseBrightness: 0,
      baseColor: [0.42, 0.41, 0.39],
      markerColor: ACCENT,
      glowColor: [0.07, 0.07, 0.07],
      markers: CITIES.map((location, i) => ({ location, size: i === 0 ? 0.05 : 0.025, color: ACCENT })),
      arcs: ARCS.map(([a, b]) => ({ from: CITIES[a] ?? [0, 0], to: CITIES[b] ?? [0, 0], color: ACCENT })),
      arcColor: ACCENT,
      arcWidth: 0.6,
      arcHeight: 0.25,
      opacity: 0.9,
    });
    canvas.style.opacity = "1";

    let raf = 0;
    let t = 0;
    const frame = () => {
      t += 0.004;
      globe.update({ phi: HOME + Math.sin(t) * 0.35 });
      raf = requestAnimationFrame(frame);
    };
    if (!reduced) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
    };
  }, []);

  return (
    <div className="th-globe" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
