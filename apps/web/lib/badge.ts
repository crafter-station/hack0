import { readFile } from "node:fs/promises";
import { join } from "node:path";
import opentype, { type Font } from "opentype.js";

const BADGE_THEMES = ["claro", "oscuro", "compacto"] as const;
type BadgeTheme = (typeof BADGE_THEMES)[number];

export const badgeTheme = (value: string | null): BadgeTheme => BADGE_THEMES.find((t) => t === value) ?? "claro";

/** What a badge says: a small kicker over a bold title, with an orange accent after it. */
type BadgeCopy = {
  label: string;
  kicker: string;
  title: string;
  accent: string;
  /** The accent continues the title as one phrase ("ecosistema tech LATAM") instead of standing apart as a figure. */
  inline?: boolean;
  /** The single line the compact theme shows instead of kicker and title. */
  compact: { text: string; accent: string; after?: string };
};

type Fonts = { medium: Font; bold: Font; heavy: Font };

const INK = "#111";
const PAPER = "#f3f0e8";
const ACC = "#ff3d00";

const PALETTE = {
  claro: { bg: PAPER, stroke: INK, mute: "#6b6b63", ink: INK },
  oscuro: { bg: INK, stroke: "#3a3a37", mute: "#9a988f", ink: PAPER },
};

let loaded: Promise<Fonts> | null = null;

/** JetBrains Mono from the OG renderer's folder; glyphs become paths so the badge looks the same on any site, with no font to load. */
export function badgeFonts(): Promise<Fonts> {
  loaded ??= (async () => {
    const dir = join(process.cwd(), "app/taste-hacking/_og/fonts");
    const load = async (weight: number) => {
      const file = await readFile(join(dir, `JetBrainsMono-${weight}.ttf`));
      return opentype.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    };
    const [medium, bold, heavy] = await Promise.all([load(500), load(700), load(800)]);
    return { medium, bold, heavy };
  })();
  return loaded;
}

/** A run of text as one path, glyph by glyph so tracking works; returns the path and where the run ends. */
function run(font: Font, text: string, x: number, y: number, size: number, tracking = 0) {
  const scale = size / font.unitsPerEm;
  let cursor = x;
  const parts: string[] = [];
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    parts.push(glyph.getPath(cursor, y, size).toPathData(2));
    cursor += (glyph.advanceWidth ?? 0) * scale + tracking;
  }
  return { d: parts.join(""), end: cursor - (text.length > 0 ? tracking : 0) };
}

const escapeXml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** The hack0 mark from app/icon.svg, scaled to a square of `size` at (x, y). */
const logo = (x: number, y: number, size: number) =>
  `<g transform="translate(${x} ${y}) scale(${size / 64})"><rect width="64" height="64" fill="${ACC}"/><rect x="19" y="9" width="26" height="46" rx="13" fill="none" stroke="#fff" stroke-width="9"/><line x1="14" y1="57" x2="50" y2="7" stroke="${ACC}" stroke-width="15"/><line x1="14" y1="57" x2="50" y2="7" stroke="${INK}" stroke-width="8" stroke-linecap="square"/></g>`;

const svg = (width: number, height: number, label: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}"><title>${escapeXml(label)}</title>${body}</svg>`;

function full(fonts: Fonts, copy: BadgeCopy, theme: "claro" | "oscuro") {
  const p = PALETTE[theme];
  const kicker = run(fonts.medium, copy.kicker, 54, 18, 9, 0.6);
  const title = run(fonts.heavy, copy.title, 54, 33, copy.inline ? 12 : 13);
  const accent = copy.inline ? run(fonts.heavy, copy.accent, title.end, 33, 12) : run(fonts.bold, copy.accent, title.end + 10, 33, 11);
  const width = Math.ceil(Math.max(kicker.end, accent.end) + 12);
  return svg(
    width,
    44,
    copy.label,
    `<rect x=".5" y=".5" width="${width - 1}" height="43" fill="${p.bg}" stroke="${p.stroke}"/>${logo(1, 1, 42)}<path fill="${p.mute}" d="${kicker.d}"/><path fill="${p.ink}" d="${title.d}"/><path fill="${ACC}" d="${accent.d}"/>`,
  );
}

function compact(fonts: Fonts, copy: BadgeCopy) {
  const lead = run(fonts.bold, copy.compact.text, 30, 15, 10.5);
  const accent = run(fonts.bold, copy.compact.accent, lead.end, 15, 10.5);
  const after = run(fonts.bold, copy.compact.after ?? "", accent.end, 15, 10.5);
  const width = Math.ceil(after.end + 10);
  return svg(
    width,
    22,
    copy.label,
    `<rect width="${width}" height="22" fill="${INK}"/>${logo(0, 0, 22)}<path fill="${PAPER}" d="${lead.d}${after.d}"/><path fill="${ACC}" d="${accent.d}"/>`,
  );
}

export function renderBadge(fonts: Fonts, copy: BadgeCopy, theme: BadgeTheme) {
  return theme === "compacto" ? compact(fonts, copy) : full(fonts, copy, theme);
}

const eventos = (n: number) => (n === 1 ? "1 evento" : `${n.toLocaleString("es")} eventos`);

/** A community's badge: its event count, or its next date when asked for and one is set. */
export function communityCopy(name: string, count: number, next?: string | null): BadgeCopy {
  const label = `${name} publica sus eventos en hack0`;
  if (next) {
    return { label, kicker: "PRÓXIMO EVENTO EN", title: "hack0.dev", accent: `· ${next}`, compact: { text: "en hack0 · ", accent: next } };
  }
  return {
    label,
    kicker: "PUBLICAMOS EN",
    title: "hack0.dev",
    accent: eventos(count),
    compact: { text: "en hack0 · ", accent: String(count), after: count === 1 ? " evento" : " eventos" },
  };
}

export function orgCopy(name: string): BadgeCopy {
  return {
    label: `${name} está en el mapa del ecosistema tech de LATAM de hack0`,
    kicker: "EN EL MAPA DEL",
    title: "ecosistema tech ",
    accent: "LATAM",
    inline: true,
    compact: { text: "en hack0 · ecosistema ", accent: "LATAM" },
  };
}

/** "3 dic" in the event's own timezone. */
export function shortDate(iso: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: timeZone ?? "America/Lima" })
    .format(new Date(iso))
    .replace(".", "");
}

export function badgeResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
