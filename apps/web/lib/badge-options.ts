/** The badge builder's steps: each one sets one query parameter, with the route's default first. */
export const BADGE_STEPS = [
  {
    key: "tema",
    label: "Fondo",
    options: [
      { value: "claro", label: "Claro", swatch: "#f3f0e8" },
      { value: "oscuro", label: "Oscuro", swatch: "#111110" },
      { value: "naranja", label: "Naranja", swatch: "#ff3d00" },
      { value: "propio", label: "Tu marca", swatch: "conic-gradient(#7c3aed, #06b6d4, #22c55e, #f59e0b, #7c3aed)" },
    ],
  },
  {
    key: "logo",
    label: "Logo",
    options: [
      { value: "icono", label: "Ícono" },
      { value: "simbolo", label: "Símbolo" },
    ],
  },
  {
    key: "tinta",
    label: "Color",
    options: [
      { value: "color", label: "Con acento" },
      { value: "una", label: "Una tinta" },
    ],
  },
  {
    key: "forma",
    label: "Tamaño",
    options: [
      { value: "normal", label: "Normal" },
      { value: "compacto", label: "Compacto" },
    ],
  },
  {
    key: "dato",
    label: "Muestra",
    communityOnly: true,
    options: [
      { value: "eventos", label: "Eventos" },
      { value: "proximo", label: "Próximo evento" },
    ],
  },
] as const;

/** The host site's colors for "Tu marca", as #rrggbb. */
export const CUSTOM_COLORS = [
  { key: "fondo", label: "Fondo" },
  { key: "texto", label: "Texto" },
  { key: "acento", label: "Acento" },
  { key: "borde", label: "Borde" },
] as const;

export type BadgeColors = Record<(typeof CUSTOM_COLORS)[number]["key"], string>;

export type BadgeChoice = Record<(typeof BADGE_STEPS)[number]["key"], string> & { colors: BadgeColors };

export const DEFAULT_CHOICE: BadgeChoice = {
  ...(Object.fromEntries(BADGE_STEPS.map((s) => [s.key, s.options[0].value])) as Record<(typeof BADGE_STEPS)[number]["key"], string>),
  colors: { fondo: "#ffffff", texto: "#0a0a0a", acento: "#7c3aed", borde: "#0a0a0a" },
};

const stepParam = (choice: BadgeChoice, s: (typeof BADGE_STEPS)[number]) => {
  if (s.key === "tema" && choice.tema === "propio") return CUSTOM_COLORS.map((c) => `${c.key}=${choice.colors[c.key].replace("#", "")}`);
  return choice[s.key] === s.options[0].value ? [] : [`${s.key}=${choice[s.key]}`];
};

/** Only what differs from the defaults, so the common badge keeps a clean URL; "Tu marca" sends its four colors instead of a theme. */
export function badgeQuery(choice: BadgeChoice) {
  const params = BADGE_STEPS.flatMap((s) => stepParam(choice, s));
  return params.length > 0 ? `?${params.join("&")}` : "";
}

type Token = { text: string; kind: "tag" | "attr" | "punct" | "string" | "text" };

const HTML_TOKENS = /(<\/?[a-z]+|\/?>)|([a-z-]+)(=)|("[^"]*")|(\s+|[^<>"\s=]+)/gi;

/** Splits a snippet for highlighting: tags and brackets, attribute names, strings and the rest. */
export function snippetTokens(code: string, format: "html" | "markdown"): Token[] {
  if (format === "markdown") {
    const m = code.match(/^(\[!\[)(.*)(\]\()(.*)(\)\]\()(.*)(\))$/);
    if (!m) return [{ text: code, kind: "text" }];
    const kinds: Token["kind"][] = ["punct", "attr", "punct", "string", "punct", "string", "punct"];
    return m.slice(1).map((text, i) => ({ text, kind: kinds[i] }));
  }
  const out: Token[] = [];
  for (const m of code.matchAll(HTML_TOKENS)) {
    if (m[1]) out.push({ text: m[1], kind: "tag" });
    else if (m[2]) out.push({ text: m[2], kind: "attr" }, { text: m[3], kind: "punct" });
    else if (m[4]) out.push({ text: m[4], kind: "string" });
    else out.push({ text: m[0], kind: "text" });
  }
  return out;
}

type Snippet = { name: string; page: string; badge: string; choice: BadgeChoice };

/** The snippet to paste: the badge image linked to the org's hack0 page. */
export function badgeSnippet(format: "html" | "markdown", { name, page, badge, choice }: Snippet) {
  const query = badgeQuery(choice);
  const alt = `${name} en hack0`;
  if (format === "markdown") return `[![${alt}](${badge}${query})](${page})`;
  const height = choice.forma === "compacto" ? 22 : 44;
  return `<a href="${page}">\n  <img src="${badge}${query.replaceAll("&", "&amp;")}" alt="${alt.replaceAll('"', "&quot;")}" height="${height}">\n</a>`;
}
