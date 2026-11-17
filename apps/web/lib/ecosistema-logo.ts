import sharp, { type Sharp } from "sharp";

/** Twice the largest size a logo is drawn at (a 72px profile tile, up to 2x wide), for sharp retina rendering. */
const MAX = 288;
/** A channel above this (0 to 255) reads as white. */
const WHITE = 238;
/** Below this share of non-white visible pixels, the logo is white and disappears on a white tile. */
const INK_SHARE = 0.04;
/** Room kept around a trimmed mark, as a share of its longer side. */
const MARGIN = 0.06;

type LogoTone = "light" | "dark";
type PreparedLogo = { png: Buffer; tone: LogoTone; aspect: number };

const isWhite = (r: number, g: number, b: number) => r > WHITE && g > WHITE && b > WHITE;

/** Whether the corner pixel is empty margin (transparent or white) rather than a background that belongs to the logo. */
async function emptyCorner(img: Sharp) {
  const { data } = await img
    .clone()
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r = 0, g = 0, b = 0, a = 0] = data;
  return a < 26 || isWhite(r, g, b);
}

/**
 * Any image sharp reads, as the PNG the site serves plus how to show it. Empty margins are trimmed so the tile can
 * match the mark's shape; a coloured background is kept whole, since it is part of the logo. The aspect is the
 * stored file's own, so a wide tile never crops a square image. SVG is rasterised so no script reaches our origin.
 */
export async function prepareLogo(input: Buffer): Promise<PreparedLogo> {
  const base = sharp(input, { density: 300 }).ensureAlpha();
  let img = base;
  if (await emptyCorner(base)) {
    const trimmed = await base
      .clone()
      .trim({ threshold: 12 })
      .toBuffer({ resolveWithObject: true })
      .catch(() => null);
    if (trimmed) {
      const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * MARGIN);
      img = sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }
  }
  const png = await img.resize(MAX, MAX, { fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  let ink = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 38) continue;
    visible++;
    if (!isWhite(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0)) ink++;
  }
  const tone: LogoTone = visible > 0 && ink / visible < INK_SHARE ? "light" : "dark";
  return { png, tone, aspect: Math.round((info.width / info.height) * 100) / 100 };
}

/** A downloaded image as a PNG no larger than the largest tile, before it is prepared at import. */
export function toPng(input: Buffer): Promise<Buffer> {
  return sharp(input, { density: 300 })
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
