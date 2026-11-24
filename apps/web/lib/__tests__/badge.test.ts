import { expect, test } from "bun:test";
import { badgeColors, badgeFonts, badgeStyle, communityCopy, orgCopy, renderBadge, shortDate } from "../badge";

const widthOf = (svg: string) => Number(svg.match(/^<svg[^>]* width="(\d+)"/)?.[1]);
const style = (qs = "") => badgeStyle(new URLSearchParams(qs));

test("query params pick each axis; unknown values keep the default", () => {
  expect(style()).toEqual({ tema: "claro", tinta: "color", logo: "icono", forma: "normal" });
  expect(style("tema=naranja&tinta=una&logo=simbolo&forma=compacto")).toEqual({
    tema: "naranja",
    tinta: "una",
    logo: "simbolo",
    forma: "compacto",
  });
  expect(style("tema=neon&logo=x")).toEqual(style());
  expect(style("tema=compacto")).toEqual({ ...style(), forma: "compacto" });
});

test("one ink drops the orange; the orange surface turns the accent paper", () => {
  expect(badgeColors({ tema: "claro", tinta: "una" }).accent).toBe("#111111");
  expect(JSON.stringify(badgeColors({ tema: "oscuro", tinta: "una" }))).not.toContain("#ff3d00");
  expect(badgeColors({ tema: "naranja", tinta: "color" }).accent).toBe("#f3f0e8");
  expect(badgeColors({ tema: "claro", tinta: "color" }).accent).toBe("#ff3d00");
});

const COMBINATIONS = ["claro", "oscuro", "naranja"].flatMap((tema) =>
  ["color", "una"].flatMap((tinta) =>
    ["icono", "simbolo"].flatMap((logo) => ["normal", "compacto"].map((forma) => ({ tema, tinta, logo, forma }))),
  ),
);

test("every combination renders a self-contained, labelled badge", async () => {
  const fonts = await badgeFonts();
  expect(COMBINATIONS).toHaveLength(24);
  for (const c of COMBINATIONS) {
    const svg = renderBadge(fonts, communityCopy("Cloud Experts", 266), style(new URLSearchParams(c).toString()));
    expect(svg).not.toContain("<text");
    expect(svg).toContain('aria-label="Cloud Experts publica sus eventos en hack0"');
    expect(svg).toContain(c.forma === "compacto" ? 'height="22"' : 'height="44"');
  }
});

test("the width follows the text, so a longer count never clips", async () => {
  const fonts = await badgeFonts();
  const small = widthOf(renderBadge(fonts, communityCopy("A", 7), style()));
  const large = widthOf(renderBadge(fonts, communityCopy("A", 12345), style()));
  expect(large).toBeGreaterThan(small);
  expect(widthOf(renderBadge(fonts, communityCopy("A", 266), style()))).toBeLessThanOrEqual(230);
});

test("copy reads naturally: singular, next date", () => {
  expect(communityCopy("A", 1).accent).toBe("1 evento");
  expect(communityCopy("A", 9, "3 dic").kicker).toBe("PRÓXIMO EVENTO EN");
  expect(shortDate("2026-12-03T23:00:00Z", "America/Lima")).toBe("3 dic");
});

test("names with markup are escaped in the label", async () => {
  const svg = renderBadge(await badgeFonts(), orgCopy('<Acme & "Co">'), style());
  expect(svg).toContain("&lt;Acme &amp; &quot;Co&quot;&gt;");
});
