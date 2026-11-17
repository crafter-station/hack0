import { describe, expect, test } from "bun:test";
import { articleLd } from "./piece-ld";
import { PIECES } from "./pieces";

function referenceAuthor(slug: string) {
  const piece = PIECES.find((p) => p.slug === slug);
  if (!piece) throw new Error(`No piece ${slug}`);
  const about = articleLd(piece, "/poster.webp").about as { "@type": string; author?: { "@type": string; name: string } }[];
  return about.find((a) => a["@type"] === "CreativeWork")?.author;
}

describe("articleLd", () => {
  test("a reference made by a person is typed Person", () => {
    expect(referenceAuthor("look-lit-room")).toEqual({ "@type": "Person", name: "Felix Rieseberg" });
    expect(referenceAuthor("motion-family-morph")).toEqual({ "@type": "Person", name: "Benji Taylor" });
  });
  test("every other reference author stays an Organization", () => {
    expect(referenceAuthor("look-liquid-glass")).toEqual({ "@type": "Organization", name: "Apple" });
    expect(referenceAuthor("made-lando-stack")).toEqual({ "@type": "Organization", name: "OFF+BRAND" });
  });
});
