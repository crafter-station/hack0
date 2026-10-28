import type { ReactNode } from "react";

type Art = "search" | "done" | "drafts" | "key" | "calendar" | "signal";

/** Blueprint-style line drawings: ink strokes, one orange accent, sized to the text. */
const ART: Record<Art, ReactNode> = {
  search: (
    <>
      <circle cx="26" cy="26" r="14" />
      <path d="M36 36l12 12" className="acc" />
      <path d="M20 26h12" />
    </>
  ),
  done: (
    <>
      <rect x="10" y="12" width="40" height="36" />
      <path d="M20 31l7 7 13-15" className="acc" />
    </>
  ),
  drafts: (
    <>
      <rect x="14" y="10" width="30" height="38" />
      <path d="M21 20h16M21 27h16M21 34h9" />
      <path d="M40 40l8-8 4 4-8 8h-4z" className="acc" />
    </>
  ),
  key: (
    <>
      <circle cx="20" cy="30" r="9" />
      <path d="M29 30h22M44 30v7M50 30v5" className="acc" />
    </>
  ),
  calendar: (
    <>
      <rect x="10" y="14" width="40" height="34" />
      <path d="M10 24h40M20 9v9M40 9v9" />
      <rect x="18" y="31" width="8" height="8" className="acc" />
    </>
  ),
  signal: (
    <>
      <circle cx="30" cy="30" r="4" className="acc" />
      <path d="M20 20a14 14 0 0 0 0 20M40 20a14 14 0 0 1 0 20M14 14a22 22 0 0 0 0 32M46 14a22 22 0 0 1 0 32" />
    </>
  ),
};

type Props = { art: Art; title: string; children?: ReactNode; action?: ReactNode };

/** Why the list is empty and what to do next, instead of a bare "no results". */
export function EmptyState({ art, title, children, action }: Props) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">
        {ART[art]}
      </svg>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-actions">{action}</div>}
    </div>
  );
}
