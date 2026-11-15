"use client";

import { useEffect, useState } from "react";
import { useSessionProgress } from "./session-progress";

type Section = { id: string; label: string };
type SessionLink = { slug: string; title: string };

const NO_SESSIONS: SessionLink[] = [];

/** A block counts as current once its top passes this share of the viewport. */
const READ_LINE = 0.35;

function currentOf(ids: string[]): number {
  const line = window.innerHeight * READ_LINE;
  let current = -1;
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) current = i;
  });
  return current;
}

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The page's contents: a rail beside the column on desktop, a bar pinned to the top on small screens.
 * It marks the section in view and, on a page with sessions, how far each was watched; j and k step through them.
 */
export function MaterialNav({ sections, sessions = NO_SESSIONS }: { sections: Section[]; sessions?: SessionLink[] }) {
  const [section, setSection] = useState(-1);
  const [session, setSession] = useState(-1);
  const progress = useSessionProgress();

  useEffect(() => {
    const sectionIds = sections.map((s) => s.id);
    const sessionIds = sessions.map((s) => s.slug);
    let frame = 0;
    const measure = () => {
      frame = 0;
      setSection(currentOf(sectionIds));
      setSession(currentOf(sessionIds));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const step = e.key === "j" ? 1 : e.key === "k" ? -1 : 0;
      if (!step) return;
      const at = currentOf(sessionIds);
      const target = document.getElementById(sessionIds[Math.min(sessionIds.length - 1, Math.max(0, at + step))] ?? "");
      if (!target) return;
      e.preventDefault();
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [sections, sessions]);

  const inSessions = sections[section]?.id === "sesiones";

  return (
    <nav className="th-rail" aria-label="Contenido">
      <ol>
        {sections.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={i === section ? "location" : undefined}>
              <span className="th-rail-n">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </a>
            {s.id === "sesiones" ? (
              <ol className="th-rail-sub">
                {sessions.map((x, j) => {
                  const p = progress[x.slug];
                  const state = p?.done ? "done" : p && p.t > 0 ? "part" : "new";
                  return (
                    <li key={x.slug}>
                      <a href={`#${x.slug}`} data-state={state} aria-current={inSessions && j === session ? "location" : undefined}>
                        <i aria-hidden="true" />
                        {x.title}
                        {state === "new" ? null : <span className="sr-only">{state === "done" ? " (visto)" : " (a medias)"}</span>}
                      </a>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
      {sessions.length > 0 ? (
        <p className="th-rail-keys">
          <kbd>j</kbd>
          <kbd>k</kbd> entre sesiones
        </p>
      ) : null}
    </nav>
  );
}
