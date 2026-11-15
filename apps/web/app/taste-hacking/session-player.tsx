"use client";

import "asciinema-player/dist/bundle/asciinema-player.css";
import type { Player } from "asciinema-player";
import { useEffect, useRef, useState } from "react";
import { readSessionProgress, saveSessionProgress } from "./session-progress";

const SPEEDS = [1, 2, 4, 8];
const IDLE_LIMIT_S = 2;
/** Mount a little before the card scrolls in. */
const NEAR_MARGIN = "240px 0px";

/**
 * A session preview. Loads from the gated route when the card nears the viewport and stays on `poster` until played.
 * It remembers where the viewer stopped and opens there next time.
 */
export function SessionPlayer({ slug, title, poster }: { slug: string; title: string; poster: string }) {
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const cast = useRef<string | null>(null);
  const resumeAt = useRef(0);
  const wasPlaying = useRef(false);
  const watched = useRef(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: NEAR_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !host.current) return;
    const el = host.current;
    let gone = false;
    const stored = readSessionProgress(slug);
    if (resumeAt.current === 0 && stored && !stored.done) resumeAt.current = stored.t;
    let finished = false;
    const save = (ended: boolean) => {
      if (ended) finished = true;
      else if (finished || !watched.current) return;
      const t = player.current?.getCurrentTime();
      if (typeof t === "number" && (ended || t > 0)) saveSessionProgress(slug, t, ended);
    };
    const onHide = () => save(false);
    window.addEventListener("pagehide", onHide);
    (async () => {
      if (cast.current === null) {
        const res = await fetch(`/api/v1/sessions/${slug}`);
        if (gone) return;
        if (!res.ok) return setFailed(res.status === 401 ? "Ingresa de nuevo para ver la sesión." : "No pudimos cargar la sesión.");
        cast.current = await res.text();
      }
      const { create } = await import("asciinema-player");
      if (gone) return;
      const p = create({ data: cast.current }, el, {
        speed,
        idleTimeLimit: IDLE_LIMIT_S,
        ...(resumeAt.current > 0 ? { startAt: resumeAt.current } : { poster }),
        autoPlay: wasPlaying.current,
        fit: "width",
        theme: "asciinema",
        terminalFontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
      });
      p.addEventListener("play", () => {
        finished = false;
        watched.current = true;
        setPlaying(true);
      });
      p.addEventListener("playing", () => setPlaying(true));
      p.addEventListener("pause", () => {
        setPlaying(false);
        save(false);
      });
      p.addEventListener("ended", () => {
        setPlaying(false);
        save(true);
      });
      player.current = p;
      setReady(true);
    })().catch(() => {
      if (!gone) setFailed("No pudimos cargar la sesión.");
    });
    return () => {
      gone = true;
      window.removeEventListener("pagehide", onHide);
      resumeAt.current = player.current?.getCurrentTime() ?? resumeAt.current;
      player.current?.dispose();
      player.current = null;
    };
  }, [near, speed, slug, poster]);

  function toggle() {
    if (playing) player.current?.pause();
    else player.current?.play();
  }

  function changeSpeed(next: number) {
    wasPlaying.current = playing;
    setSpeed(next);
  }

  return (
    <div className="th-cast" ref={root}>
      <fieldset className="th-cast-bar" disabled={!ready}>
        <legend className="sr-only">Reproducción de {title}</legend>
        <button
          type="button"
          className="th-cast-play"
          aria-label={`${playing ? "Pausar" : "Reproducir"} la sesión ${title}`}
          onClick={toggle}
        >
          <i aria-hidden="true" data-playing={playing} />
          {playing ? "pausar" : "reproducir"}
        </button>
        {SPEEDS.map((s) => (
          <button key={s} type="button" aria-label={`Velocidad ${s}x`} aria-pressed={s === speed} onClick={() => changeSpeed(s)}>
            {s}x
          </button>
        ))}
      </fieldset>
      {failed ? <p className="th-cast-fail">{failed}</p> : <div ref={host} className="th-cast-host" data-ready={ready} />}
    </div>
  );
}
