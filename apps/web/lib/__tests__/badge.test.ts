import { expect, test } from "bun:test";
import { badgeFonts, badgeTheme, communityCopy, orgCopy, renderBadge, shortDate } from "../badge";

const widthOf = (svg: string) => Number(svg.match(/^<svg[^>]* width="(\d+)"/)?.[1]);

test("an unknown theme falls back to claro", () => {
  expect(badgeTheme("neon")).toBe("claro");
  expect(badgeTheme(null)).toBe("claro");
  expect(badgeTheme("oscuro")).toBe("oscuro");
});

test("the badge is self-contained: text drawn as paths, labelled for screen readers", async () => {
  const svg = renderBadge(await badgeFonts(), communityCopy("Cloud Experts Community", 266), "claro");
  expect(svg).not.toContain("<text");
  expect(svg).not.toContain("font-family");
  expect(svg).toContain('aria-label="Cloud Experts Community publica sus eventos en hack0"');
  expect(svg).toContain('height="44"');
});

test("the width follows the text, so a longer count never clips", async () => {
  const fonts = await badgeFonts();
  const small = widthOf(renderBadge(fonts, communityCopy("A", 7), "claro"));
  const large = widthOf(renderBadge(fonts, communityCopy("A", 12345), "claro"));
  expect(large).toBeGreaterThan(small);
  expect(widthOf(renderBadge(fonts, communityCopy("A", 266), "claro"))).toBeLessThanOrEqual(230);
});

test("themes swap the palette, compact is one 22px line", async () => {
  const fonts = await badgeFonts();
  expect(renderBadge(fonts, orgCopy("Endeavor Perú"), "oscuro")).toContain('fill="#111" stroke="#3a3a37"');
  const compact = renderBadge(fonts, communityCopy("A", 266), "compacto");
  expect(compact).toContain('height="22"');
});

test("copy reads naturally: singular, thousands, next date and names with markup", () => {
  expect(communityCopy("A", 1).accent).toBe("1 evento");
  expect(communityCopy("A", 1200).accent).toBe("1200 eventos");
  expect(communityCopy("A", 9, "3 dic").kicker).toBe("PRÓXIMO EVENTO EN");
  expect(shortDate("2026-12-03T23:00:00Z", "America/Lima")).toBe("3 dic");
});

test("names with markup are escaped in the label", async () => {
  const svg = renderBadge(await badgeFonts(), orgCopy('<Acme & "Co">'), "claro");
  expect(svg).toContain("&lt;Acme &amp; &quot;Co&quot;&gt;");
});
