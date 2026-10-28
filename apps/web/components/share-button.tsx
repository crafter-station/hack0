"use client";

import { useState } from "react";

/** Native share sheet where there is one (phones), otherwise copies the link. */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ghost"
      onClick={async () => {
        if (navigator.share) {
          await navigator.share({ title, url }).catch((error: unknown) => {
            // Closing the share sheet rejects with AbortError; that is the user's choice, not a failure.
            if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
          });
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? "Link copiado" : "Compartir"}
    </button>
  );
}
