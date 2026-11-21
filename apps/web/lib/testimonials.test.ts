import { describe, expect, test } from "bun:test";
import { normalizeLink, parseTestimonial } from "./testimonials";

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const BODY = "Aprendí a nombrar lo que veo antes de pedírselo al agente.";

describe("normalizeLink", () => {
  test("an @ handle is an X profile", () => {
    expect(normalizeLink("@raillyhugo")).toBe("https://x.com/raillyhugo");
  });
  test("a bare domain gets https", () => {
    expect(normalizeLink("github.com/Railly")).toBe("https://github.com/Railly");
  });
  test("a full URL is kept without its trailing slash", () => {
    expect(normalizeLink("https://linkedin.com/in/ana/")).toBe("https://linkedin.com/in/ana");
  });
  test("other schemes and plain words are rejected", () => {
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("railly")).toBeNull();
  });
});

describe("parseTestimonial", () => {
  test("only body and name are required", () => {
    expect(parseTestimonial(form({ body: BODY, name: "  Ana   Pérez " }))).toEqual({
      ok: true,
      value: { body: BODY, name: "Ana Pérez", role: null, link: null },
    });
  });
  test("each bad field gets its own message", () => {
    const r = parseTestimonial(form({ body: "corto", name: "", link: "no es link" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["body", "link", "name"]);
  });
  test("an email typed into the form is ignored; it only comes from the account", () => {
    const r = parseTestimonial(form({ body: BODY, name: "Ana", email: "ana@mail.com", link: "@ana" }));
    expect(r.ok && r.value).toEqual({ body: BODY, name: "Ana", role: null, link: "https://x.com/ana" });
  });
});
