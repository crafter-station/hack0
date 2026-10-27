/** hack0 mark: a stadium 0 broken by a slash. `bg` must match the surface behind it. */
export function Mark({ size = 32, bg = "var(--paper)", ink = "currentColor", accent = "var(--acc)" }: { size?: number; bg?: string; ink?: string; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="17" y="6" width="30" height="52" rx="15" fill="none" stroke={ink} strokeWidth="8" />
      <line x1="10" y1="60" x2="54" y2="4" stroke={bg} strokeWidth="15" />
      <line x1="10" y1="60" x2="54" y2="4" stroke={accent} strokeWidth="8" strokeLinecap="square" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      hack
      <Mark size={size * 0.86} />
    </span>
  );
}
