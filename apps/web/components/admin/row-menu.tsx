"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** A disclosure menu that closes on an outside click, on Escape, and once an option is picked. */
export function RowMenu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const menu = ref.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <details
      ref={ref}
      className="menu"
      onSubmit={() => {
        if (ref.current) ref.current.open = false;
      }}
    >
      <summary aria-label={label}>⋯</summary>
      <div className="menu-panel">{children}</div>
    </details>
  );
}
