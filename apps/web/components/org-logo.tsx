/** Logo from the org's own site, or its initials when there is none. Safe in client and server components. */
type LogoOrg = { name: string; logoUrl: string | null; logoTone?: "light" | "dark" | null; logoAspect?: number | null };

/** Wide marks get a tile up to this many times wider than tall, so they don't shrink to a sliver. */
const MAX_WIDE = 2;

export function OrgLogo({ org, size = 40 }: { org: LogoOrg; size?: number }) {
  const width = org.logoUrl && org.logoAspect && org.logoAspect > 1.4 ? Math.round(size * Math.min(org.logoAspect * 0.75, MAX_WIDE)) : size;
  const initials = org.name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="org-logo"
      data-tone={org.logoUrl ? (org.logoTone ?? undefined) : undefined}
      style={{ width, height: size }}
      aria-hidden="true"
    >
      {org.logoUrl ? (
        // biome-ignore lint/performance/noImgElement: logos come from each org's own domain, outside the image optimizer's allowlist.
        <img src={org.logoUrl} alt="" width={width} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  );
}
