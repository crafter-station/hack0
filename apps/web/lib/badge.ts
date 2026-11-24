import { readFile } from "node:fs/promises";
import { join } from "node:path";
import opentype, { type Font } from "opentype.js";

const SURFACES = ["claro", "oscuro", "naranja"] as const;

/** The brand's variants from /brand, picked independently: surface, one ink or color, app icon or bare symbol, full or compact. */
type BadgeStyle = {
  tema: (typeof SURFACES)[number];
  tinta: "color" | "una";
  logo: "icono" | "simbolo";
  forma: "normal" | "compacto";
};

const pick = <T extends string>(value: string | null, options: readonly T[], fallback: T): T =>
  options.find((o) => o === value) ?? fallback;

/** Reads ?tema=&tinta=&logo=&forma=; anything unknown keeps the default, and the older ?tema=compacto still means the compact form. */
export function badgeStyle(query: URLSearchParams): BadgeStyle {
  const tema = query.get("tema");
  return {
    tema: pick(tema, SURFACES, "claro"),
    tinta: pick(query.get("tinta"), ["color", "una"] as const, "color"),
    logo: pick(query.get("logo"), ["icono", "simbolo"] as const, "icono"),
    forma: tema === "compacto" ? "compacto" : pick(query.get("forma"), ["normal", "compacto"] as const, "normal"),
  };
}

/** What a badge says: a small kicker over a bold title, with an accent after it. */
type BadgeCopy = {
  label: string;
  kicker: string;
  title: string;
  accent: string;
  /** The accent continues the title as one phrase ("ecosistema tech LATAM") instead of standing apart as a figure. */
  inline?: boolean;
  /** The single line the compact form shows instead of kicker and title. */
  compact: { text: string; accent: string; after?: string };
};

type Fonts = { medium: Font; bold: Font; heavy: Font };

const INK = "#111111";
const NIGHT = "#111110";
const PAPER = "#f3f0e8";
const ACC = "#ff3d00";

type Colors = {
  bg: string;
  stroke: string;
  ink: string;
  mute: string;
  muteOpacity: number;
  accent: string;
  /** The app icon tile: its fill, the 0's ring, the gap around the bar and the bar. */
  tile: { bg: string; ring: string; gap: string; bar: string };
  /** The bare symbol drawn on the surface. */
  mark: { ring: string; gap: string; bar: string };
};

const SURFACE = {
  claro: { bg: PAPER, stroke: INK, ink: INK, mute: "#6b6b63", muteOpacity: 1 },
  oscuro: { bg: NIGHT, stroke: "#3a3a37", ink: PAPER, mute: "#9a988f", muteOpacity: 1 },
  naranja: { bg: ACC, stroke: INK, ink: INK, mute: INK, muteOpacity: 0.72 },
};

function tileColors(tema: BadgeStyle["tema"], one: boolean, s: (typeof SURFACE)[keyof typeof SURFACE]): Colors["tile"] {
  if (one) return { bg: s.ink, ring: s.bg, gap: s.ink, bar: s.bg };
  if (tema === "naranja") return { bg: INK, ring: PAPER, gap: INK, bar: ACC };
  return { bg: ACC, ring: "#fff", gap: ACC, bar: INK };
}

/** Colors per the brand's versions: orange is the accent unless the badge is one ink, and on the orange surface the accent turns paper. */
export function badgeColors(style: Pick<BadgeStyle, "tema" | "tinta">): Colors {
  const s = SURFACE[style.tema];
  const one = style.tinta === "una";
  const accent = one ? s.ink : style.tema === "naranja" ? PAPER : ACC;
  return { ...s, accent, tile: tileColors(style.tema, one, s), mark: { ring: s.ink, gap: s.bg, bar: accent } };
}

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

/** Room inside the app icon tile: the favicon's glyph runs edge to edge for 16 px, and at badge size its bar would touch the tile's corners. */
const TILE_PAD = 0.14;

/** The app icon (app/icon.svg) in a square of `size` at (x, y): the tile fills the square, the glyph sits inside with room around it. */
const icon = (x: number, y: number, size: number, t: Colors["tile"]) =>
  `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${t.bg}"/><g transform="translate(${x + size * TILE_PAD} ${y + size * TILE_PAD}) scale(${(size * (1 - TILE_PAD * 2)) / 64})"><rect x="19" y="9" width="26" height="46" rx="13" fill="none" stroke="${t.ring}" stroke-width="9"/><line x1="14" y1="57" x2="50" y2="7" stroke="${t.gap}" stroke-width="15"/><line x1="14" y1="57" x2="50" y2="7" stroke="${t.bar}" stroke-width="8" stroke-linecap="square"/></g>`;

/** The bare symbol (public/brand/hack0-mark-*.svg) in a square of `size` at (x, y). */
const symbol = (x: number, y: number, size: number, m: Colors["mark"]) =>
  `<g transform="translate(${x} ${y}) scale(${size / 64})"><rect x="17" y="6" width="30" height="52" rx="15" fill="none" stroke="${m.ring}" stroke-width="8"/><line x1="10" y1="60" x2="54" y2="4" stroke="${m.gap}" stroke-width="15"/><line x1="10" y1="60" x2="54" y2="4" stroke="${m.bar}" stroke-width="8" stroke-linecap="square"/></g>`;

const svg = (width: number, height: number, label: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}"><title>${escapeXml(label)}</title>${body}</svg>`;

/** The logo for a badge of `height`, and where its text starts. */
function logoFor(style: BadgeStyle, c: Colors, height: number) {
  if (style.logo === "simbolo") {
    const size = height > 30 ? 30 : 15;
    const x = height > 30 ? 9 : 5;
    return { markup: symbol(x, (height - size) / 2, size, c.mark), textX: x + size + (height > 30 ? 9 : 6) };
  }
  const inset = height > 30 ? 1 : 0;
  return { markup: icon(inset, inset, height - inset * 2, c.tile), textX: height + (height > 30 ? 10 : 8) };
}

function full(fonts: Fonts, copy: BadgeCopy, style: BadgeStyle) {
  const c = badgeColors(style);
  const logo = logoFor(style, c, 44);
  const kicker = run(fonts.medium, copy.kicker, logo.textX, 18, 9, 0.6);
  const title = run(fonts.heavy, copy.title, logo.textX, 33, copy.inline ? 12 : 13);
  const accent = copy.inline ? run(fonts.heavy, copy.accent, title.end, 33, 12) : run(fonts.bold, copy.accent, title.end + 10, 33, 11);
  const width = Math.ceil(Math.max(kicker.end, accent.end) + 12);
  return svg(
    width,
    44,
    copy.label,
    `<rect x=".5" y=".5" width="${width - 1}" height="43" fill="${c.bg}" stroke="${c.stroke}"/>${logo.markup}<path fill="${c.mute}" fill-opacity="${c.muteOpacity}" d="${kicker.d}"/><path fill="${c.ink}" d="${title.d}"/><path fill="${c.accent}" d="${accent.d}"/>`,
  );
}

function compact(fonts: Fonts, copy: BadgeCopy, style: BadgeStyle) {
  const c = badgeColors(style);
  const logo = logoFor(style, c, 22);
  const lead = run(fonts.bold, copy.compact.text, logo.textX, 15, 10.5);
  const accent = run(fonts.bold, copy.compact.accent, lead.end, 15, 10.5);
  const after = run(fonts.bold, copy.compact.after ?? "", accent.end, 15, 10.5);
  const width = Math.ceil(after.end + 10);
  return svg(
    width,
    22,
    copy.label,
    `<rect x=".5" y=".5" width="${width - 1}" height="21" fill="${c.bg}" stroke="${c.stroke}"/>${logo.markup}<path fill="${c.ink}" d="${lead.d}${after.d}"/><path fill="${c.accent}" d="${accent.d}"/>`,
  );
}

export function renderBadge(fonts: Fonts, copy: BadgeCopy, style: BadgeStyle) {
  return style.forma === "compacto" ? compact(fonts, copy, style) : full(fonts, copy, style);
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
