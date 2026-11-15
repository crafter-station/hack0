"use client";

import { useEffect, useState } from "react";

const FEEDBACK_MS = 1600;

/** Copies one command. The label flips to "copiado" and is announced to screen readers. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
  }

  return (
    <button type="button" className="th-copy" data-state={state} aria-label={`Copiar: ${text}`} onClick={copy}>
      <span aria-live="polite">{state === "done" ? "copiado" : state === "failed" ? "no se pudo" : "copiar"}</span>
    </button>
  );
}
