import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/jpeg";

/** The poster fills the right of a piece's card, edge to edge. */
export const POSTER_SIZE = { width: 504, height: 630 };

const WEIGHTS = [500, 700, 800] as const;

/** JetBrains Mono as TTF, latin subset: the renderer cannot read the WOFF2 files the site itself serves. */
async function fonts() {
  const dir = join(process.cwd(), "app/taste-hacking/_og/fonts");
  return Promise.all(
    WEIGHTS.map(async (weight) => {
      const file = await readFile(join(dir, `JetBrainsMono-${weight}.ttf`));
      return {
        name: "JetBrains Mono",
        data: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
        weight,
        style: "normal" as const,
      };
    }),
  );
}

/** A file under /public as a JPEG data URI at the poster's size. The renderer does not take WebP. */
export async function posterData(publicPath: string): Promise<string> {
  const jpeg = await sharp(join(process.cwd(), "public", publicPath))
    .resize({ ...POSTER_SIZE, fit: "cover", position: "top" })
    .jpeg({ quality: 92 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/** Renders a card and re-encodes it as JPEG: the renderer only writes PNG, which is several times heavier for a photo. */
export async function renderOg(card: ReactElement): Promise<Response> {
  const png = await new ImageResponse(card, { ...OG_SIZE, fonts: await fonts() }).arrayBuffer();
  const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 88, chromaSubsampling: "4:4:4" }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": OG_TYPE } });
}
