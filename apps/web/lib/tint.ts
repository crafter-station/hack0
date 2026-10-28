import { unstable_cache } from "next/cache";
import sharp from "sharp";
import { fetchEventTint } from "@/lib/ingest/luma-public";

type Rgb = [number, number, number];

const hex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

const rgbOf = (value: string): Rgb => [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16)) as Rgb;

function hsl([r, g, b]: Rgb) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s, l };
}

/**
 * The cover's accent: pixels grouped by hue, and the largest group of saturated, mid-light pixels wins.
 * An average would be the muddy mix of every color; a cover with no saturated area has no accent.
 */
export function accentOf(pixels: Uint8Array | Buffer): string | null {
  const buckets = new Map<number, { n: number; w: number; sum: Rgb }>();
  for (let i = 0; i + 2 < pixels.length; i += 3) {
    const rgb: Rgb = [pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0];
    const { h, s, l } = hsl(rgb);
    if (s < 0.25 || l < 0.15 || l > 0.85) continue;
    const key = Math.floor(h / 20);
    const bucket = buckets.get(key) ?? { n: 0, w: 0, sum: [0, 0, 0] };
    // Weighted by saturation cubed, so the vivid pixels set the color and the dull edges of the same hue do not wash it out.
    const weight = s ** 3;
    bucket.n++;
    bucket.w += weight;
    bucket.sum = [bucket.sum[0] + rgb[0] * weight, bucket.sum[1] + rgb[1] * weight, bucket.sum[2] + rgb[2] * weight];
    buckets.set(key, bucket);
  }
  const total = pixels.length / 3;
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  // Under 1% of the cover is a detail (a speaker's shirt, a logo dot), not the event's color.
  if (!best || best.n / total < 0.01) return null;
  return hex([best.sum[0] / best.w, best.sum[1] / best.w, best.sum[2] / best.w]);
}

async function coverAccent(coverUrl: string): Promise<string | null> {
  const res = await fetch(coverUrl);
  if (!res.ok) return null;
  const pixels = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(96, 96, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer();
  return accentOf(pixels);
}

async function resolveTint(url: string, coverUrl: string | null): Promise<string | null> {
  try {
    if (/^https:\/\/(luma\.com|lu\.ma)\//.test(url)) {
      const tint = await fetchEventTint(url);
      // Luma's default theme is white or black; only a picked color is the event's.
      const picked = tint && hsl(rgbOf(tint));
      if (tint && picked && picked.s >= 0.25 && picked.l >= 0.15 && picked.l <= 0.85) return tint;
    }
    return coverUrl ? await coverAccent(coverUrl) : null;
  } catch (error) {
    // A missing tint falls back to the site accent; the page must still render.
    console.warn("tint lookup failed", url, error);
    return null;
  }
}

/** The event's own color: the tint its host picked on Luma, otherwise its cover's accent. Cached a day. */
export const eventTint = unstable_cache(resolveTint, ["event-tint"], { revalidate: 86_400 });
