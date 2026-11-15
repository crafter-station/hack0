import Link from "next/link";

const ENDS_AT = Date.parse("2026-11-20T01:30:00Z");

export function WorkshopBanner() {
  if (Date.now() >= ENDS_AT) return null;
  return (
    <Link className="promo" href="/taste-hacking">
      <span className="promo-kicker">workshop online · jue 19 nov</span>
      <span className="promo-title">Taste hacking</span>
      <span className="promo-sub">Desarma cualquier web, animación o video y reconstrúyelo con IA.</span>
      <span className="promo-meta">
        <span>19:00 Lima</span>
        <span>21:00 Buenos Aires</span>
        <span>US$20</span>
      </span>
      <span className="promo-cta" aria-hidden="true">
        Ver detalles →
      </span>
    </Link>
  );
}
