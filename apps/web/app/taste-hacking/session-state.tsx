"use client";

import { clock, useSessionProgress } from "./session-progress";

/** "visto" or the minute the viewer stopped at; nothing for a session not started. */
export function SessionState({ slug }: { slug: string }) {
  const p = useSessionProgress()[slug];
  if (!p || (!p.done && p.t === 0)) return null;
  return <span className="th-session-state">{p.done ? "visto" : `vas en ${clock(p.t)}`}</span>;
}
