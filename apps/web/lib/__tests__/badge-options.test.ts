import { expect, test } from "bun:test";
import { badgeQuery, badgeSnippet, DEFAULT_CHOICE, snippetTokens } from "../badge-options";

const base = { name: 'Comunidad "X"', page: "https://hack0.dev/comunidades/x", badge: "https://hack0.dev/badge/comunidades/x.svg" };

test("the defaults add no query; each change adds only its own parameter", () => {
  expect(badgeQuery(DEFAULT_CHOICE)).toBe("");
  expect(badgeQuery({ ...DEFAULT_CHOICE, tema: "oscuro", logo: "simbolo" })).toBe("?tema=oscuro&logo=simbolo");
  expect(badgeQuery({ ...DEFAULT_CHOICE, dato: "proximo" })).toBe("?dato=proximo");
});

test("the HTML snippet links the badge to the hack0 page, escaping & and quotes", () => {
  const html = badgeSnippet("html", { ...base, choice: { ...DEFAULT_CHOICE, tema: "oscuro", logo: "simbolo" } });
  expect(html).toContain('<a href="https://hack0.dev/comunidades/x">');
  expect(html).toContain('src="https://hack0.dev/badge/comunidades/x.svg?tema=oscuro&amp;logo=simbolo"');
  expect(html).toContain('alt="Comunidad &quot;X&quot; en hack0"');
  expect(html).toContain('height="44"');
});

test("markdown keeps a raw query, and the compact form is 22 px tall", () => {
  const choice = { ...DEFAULT_CHOICE, tema: "oscuro", forma: "compacto" };
  expect(badgeSnippet("markdown", { ...base, choice })).toBe(
    '[![Comunidad "X" en hack0](https://hack0.dev/badge/comunidades/x.svg?tema=oscuro&forma=compacto)](https://hack0.dev/comunidades/x)',
  );
  expect(badgeSnippet("html", { ...base, choice })).toContain('height="22"');
});

test("'Tu marca' sends its four colors instead of a theme", () => {
  const q = badgeQuery({ ...DEFAULT_CHOICE, tema: "propio", logo: "simbolo" });
  expect(q).toBe("?fondo=ffffff&texto=0a0a0a&acento=7c3aed&borde=0a0a0a&logo=simbolo");
});

test("highlighting splits the snippet without losing a character", () => {
  for (const format of ["html", "markdown"] as const) {
    const code = badgeSnippet(format, { ...base, choice: { ...DEFAULT_CHOICE, tema: "oscuro" } });
    const tokens = snippetTokens(code, format);
    expect(tokens.map((t) => t.text).join("")).toBe(code);
    expect(tokens.some((t) => t.kind === "string")).toBe(true);
  }
  expect(snippetTokens('<a href="x">', "html").map((t) => t.kind)).toEqual(["tag", "text", "attr", "punct", "string", "tag"]);
});
