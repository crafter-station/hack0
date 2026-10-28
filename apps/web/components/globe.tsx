"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import type { Spot } from "@/lib/calendar";

type Theme = "light" | "dark";

type Rgb = [number, number, number];
const CONFIG: Record<Theme, { dark: number; baseColor: Rgb; glowColor: Rgb; mapBrightness: number; mapBaseBrightness: number }> = {
  light: { dark: 0, baseColor: [0.95, 0.94, 0.91], glowColor: [0.95, 0.94, 0.91], mapBrightness: 5, mapBaseBrightness: 0 },
  dark: { dark: 1, baseColor: [0.32, 0.31, 0.29], glowColor: [0.1, 0.1, 0.1], mapBrightness: 7, mapBaseBrightness: 0.04 },
};
const ACCENT: [number, number, number] = [1, 0.24, 0];
const PAST: Record<Theme, [number, number, number]> = { light: [0.07, 0.07, 0.07], dark: [0.95, 0.94, 0.91] };

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// cobe angles for lng -68, lat -12: phi = π - (lng·π/180 - π/2), theta = |lat| tilt
const HOME = Math.PI - ((-68 * Math.PI) / 180 - Math.PI / 2);

/** Rotating globe of every place the calendar has an event, centred on LATAM. */
export function Globe({ spots }: { spots: Spot[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; phi: number } | null>(null);
  const phi = useRef(HOME);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let theme = currentTheme();
    let size = canvas.offsetWidth;
    const markers = () =>
      spots.map((s) => ({
        location: s.location,
        size: Math.min(0.025 + s.count * 0.005, 0.07),
        color: s.upcoming ? ACCENT : PAST[theme],
      }));
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: phi.current,
      theta: 0.15,
      diffuse: 1.6,
      mapSamples: 16000,
      markerColor: ACCENT,
      markers: markers(),
      scale: 1,
      opacity: 0.9,
      ...CONFIG[theme],
    });

    let raf = 0;
    let t = 0;
    const frame = () => {
      // Sway around LATAM instead of spinning it out of view.
      if (!drag.current && !reduced) {
        t += 0.004;
        phi.current += (HOME + Math.sin(t) * 0.45 - phi.current) * 0.02;
      }
      const next = currentTheme();
      if (next !== theme) theme = next;
      globe.update({ phi: phi.current, width: size * dpr, height: size * dpr, markers: markers(), ...CONFIG[theme] });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => {
      size = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [spots]);

  return (
    <canvas
      ref={canvasRef}
      className="globe"
      aria-label={`Mapa con ${spots.length} lugares con eventos`}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, phi: phi.current };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) phi.current = drag.current.phi + (e.clientX - drag.current.x) / 150;
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    />
  );
}
