import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { prepareLogo } from "@/lib/ecosistema-logo";

/** A square canvas with a wide bar in the middle, like a logo saved with empty margins. */
async function canvas(background: { r: number; g: number; b: number; alpha: number }, bar: { r: number; g: number; b: number }) {
  const mark = await sharp({ create: { width: 200, height: 50, channels: 4, background: { ...bar, alpha: 1 } } })
    .png()
    .toBuffer();
  return sharp({ create: { width: 300, height: 300, channels: 4, background } })
    .composite([{ input: mark, left: 50, top: 125 }])
    .png()
    .toBuffer();
}

async function size(png: Buffer) {
  const m = await sharp(png).metadata();
  return { width: m.width ?? 0, height: m.height ?? 0 };
}

describe("prepareLogo", () => {
  test("the stored aspect is the stored file's, so a wide tile never crops a square image", async () => {
    for (const input of [
      await canvas({ r: 0, g: 0, b: 0, alpha: 0 }, { r: 20, g: 20, b: 200 }),
      await canvas({ r: 255, g: 255, b: 255, alpha: 1 }, { r: 20, g: 20, b: 200 }),
      await canvas({ r: 30, g: 0, b: 60, alpha: 1 }, { r: 250, g: 200, b: 0 }),
    ]) {
      const logo = await prepareLogo(input);
      const { width, height } = await size(logo.png);
      expect(logo.aspect).toBeCloseTo(width / height, 1);
    }
  });

  test("empty margins are trimmed to the mark", async () => {
    const logo = await prepareLogo(await canvas({ r: 255, g: 255, b: 255, alpha: 1 }, { r: 20, g: 20, b: 200 }));
    expect(logo.aspect).toBeGreaterThan(2.5);
  });

  test("a coloured background belongs to the logo and is kept whole", async () => {
    const logo = await prepareLogo(await canvas({ r: 30, g: 0, b: 60, alpha: 1 }, { r: 250, g: 200, b: 0 }));
    expect(logo.aspect).toBe(1);
  });

  test("a white mark is light and a dark mark on a white background is not", async () => {
    expect((await prepareLogo(await canvas({ r: 0, g: 0, b: 0, alpha: 0 }, { r: 255, g: 255, b: 255 }))).tone).toBe("light");
    expect((await prepareLogo(await canvas({ r: 255, g: 255, b: 255, alpha: 1 }, { r: 20, g: 20, b: 20 }))).tone).toBe("dark");
  });
});
