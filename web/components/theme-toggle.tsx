"use client";

import { useEffect, useState } from "react";

const MODES = ["system", "light", "dark"] as const;
type Mode = (typeof MODES)[number];

/** Sets `data-theme` on <html>; "system" removes it so prefers-color-scheme decides. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {}
  }, []);

  function choose(next: Mode) {
    setMode(next);
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <div className="theme" role="radiogroup" aria-label="Tema">
      {MODES.map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => choose(m)}>
          {m === "system" ? "auto" : m === "light" ? "claro" : "oscuro"}
        </button>
      ))}
    </div>
  );
}
