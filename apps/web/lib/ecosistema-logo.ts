import sharp from "sharp";

/** Twice the largest size a logo is drawn at (a 72px profile tile, up to 2x wide), for sharp retina rendering. */
const MAX = 288;
/** Mean luminance above this, over the logo's visible pixels, means it disappears on white. */
const LIGHT = 0.8;

type LogoTone = "light" | "dark";

/** Any image sharp reads, as a PNG no larger than the largest tile. SVG is rasterised so no script ever reaches our origin. */
export function toPng(input: Buffer): Promise<Buffer> {
  return sharp(input, { density: 300 })
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** How the logo should sit: on ink when it is light, and how wide its trimmed mark is. */
export async function measureLogo(png: Buffer): Promise<{ tone: LogoTone; aspect: number } | null> {
  // Trim the empty margin first, so the aspect is the mark's own and not its canvas.
  const trimmed = await sharp(png)
    .ensureAlpha()
    .trim()
    .toBuffer({ resolveWithObject: true })
    .catch(() => sharp(png).ensureAlpha().toBuffer({ resolveWithObject: true }));
  const { data } = await sharp(trimmed.data).resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let weight = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const alpha = (data[i + 3] ?? 0) / 255;
    if (alpha < 0.15) continue;
    const [r, g, b] = [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0].map((v) => v / 255);
    sum += (0.2126 * r + 0.7152 * g + 0.0722 * b) * alpha;
    weight += alpha;
  }
  if (weight === 0) return null;
  return { tone: sum / weight > LIGHT ? "light" : "dark", aspect: Math.round((trimmed.info.width / trimmed.info.height) * 100) / 100 };
}
