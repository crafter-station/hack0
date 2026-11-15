"use client";

import "asciinema-player/dist/bundle/asciinema-player.css";
import { useEffect, useRef, useState } from "react";

const SPEEDS = [1, 2, 4, 8];
const IDLE_LIMIT_S = 2;

type Player = { dispose(): void; getCurrentTime(): number };

/** A recorded session, fetched from the gated route when the buyer opens it. The player package loads on that click. */
export function SessionPlayer({ slug, title }: { slug: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState<string | null>(null);
  const resumeAt = useRef(0);

  useEffect(() => {
    if (!open || !host.current) return;
    const el = host.current;
    let gone = false;
    (async () => {
      const probe = await fetch(`/api/v1/sessions/${slug}`, { method: "HEAD" });
      if (!probe.ok) return setFailed(probe.status === 401 ? "Ingresa de nuevo para ver la sesión." : "No pudimos cargar la sesión.");
      const { create } = await import("asciinema-player");
      if (gone) return;
      player.current = create({ url: `/api/v1/sessions/${slug}` }, el, {
        speed,
        idleTimeLimit: IDLE_LIMIT_S,
        startAt: resumeAt.current,
        autoPlay: true,
        fit: "width",
        theme: "asciinema",
        terminalFontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
      });
    })();
    return () => {
      gone = true;
      resumeAt.current = player.current?.getCurrentTime() ?? resumeAt.current;
      player.current?.dispose();
      player.current = null;
    };
  }, [open, speed, slug]);

  return (
    <div className="th-cast">
      {open ? (
        <>
          <fieldset className="th-cast-bar">
            <legend className="sr-only">Velocidad de {title}</legend>
            <span>velocidad</span>
            {SPEEDS.map((s) => (
              <button key={s} type="button" aria-pressed={s === speed} onClick={() => setSpeed(s)}>
                {s}x
              </button>
            ))}
            <span>pausas de más de {IDLE_LIMIT_S} s se acortan</span>
          </fieldset>
          {failed ? <p className="th-cast-fail">{failed}</p> : <div ref={host} className="th-cast-host" />}
        </>
      ) : (
        <button type="button" className="th-cast-open" onClick={() => setOpen(true)}>
          reproducir la sesión <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
