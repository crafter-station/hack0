/** Facts for workshop 01, shared by the public page and the gated material page. */
export const WORKSHOP = {
  id: "01-taste-hacking",
  title: "Taste hacking",
  subtitle: "Desarma cualquier web, animación o video y reconstrúyelo con IA",
  luma: "https://luma.com/hack0-lfc2",
  startAt: "2026-11-19T21:00:00-03:00",
  endAt: "2026-11-19T22:30:00-03:00",
  day: "jue 19 nov",
  times: [
    { zone: "GMT-3", place: "Buenos Aires", time: "9:00 p.m." },
    { zone: "GMT-5", place: "Perú", time: "7:00 p.m." },
  ],
  price: "US$20",
  earlyBird: "US$15",
  /** Sender of the email that carries the license key. */
  keySender: "workshops@updates.hack0.dev",
} as const;

export const LAYERS = [
  {
    n: "01",
    name: "Cómo se ve",
    ask: "Tipografía, espaciado y superficie.",
    words: ["jerarquía", "escala tipográfica", "tracking", "leading", "grid", "contraste", "densidad", "grain"],
  },
  {
    n: "02",
    name: "Cómo se mueve",
    ask: "Qué entra, cuándo y con qué curva.",
    words: ["easing", "spring", "stagger", "duration", "overshoot", "layout animation", "scroll-driven"],
  },
  {
    n: "03",
    name: "Cómo está hecho",
    ask: "Lo que hay debajo de lo que ves.",
    words: ["sources", "bundles", "librerías", "estilos computados", "tokens"],
  },
] as const;

/** The prompt from the promo: the vocabulary sits inside a sentence a person would write. */
export const PROMPT: { t: string; hl?: boolean }[] = [
  { t: "que la isla se abra con " },
  { t: "spring", hl: true },
  { t: ", " },
  { t: "sin rebote", hl: true },
  { t: ". el contenido que entre después con " },
  { t: "stagger", hl: true },
  { t: " y un " },
  { t: "blur", hl: true },
  { t: " que se va. letra mono con el " },
  { t: "tracking", hl: true },
  { t: " un toque más apretado" },
];

export const AGENDA = [
  { min: "0-10", title: "La tesis", note: "Tres capas y el mindset de «lo hice en una noche»." },
  { min: "10-25", title: "Vocabulario", note: "Ejemplos buenos contra slop, capa por capa." },
  { min: "25-70", title: "Tres casos en vivo", note: "Una animación viral de X, una landing premium y un estilo de edición de video." },
  { min: "70-80", title: "La skill y la galería", note: "Cómo usar la skill y cómo leer las sesiones reales." },
  { min: "80-90", title: "Preguntas", note: "" },
] as const;

export const TAKEAWAYS = [
  { title: "La skill taste-hacking", note: "El método de Railly, listo para instalar en tu agente." },
  { title: "Galería de 20 recreaciones", note: "El resultado y el video de cada una." },
  { title: "Sesiones reales de Claude Code", note: "Sin editar, con typos y todo. Solo se tapan keys, tokens y emails." },
  { title: "La grabación", note: "Los 90 minutos completos." },
  { title: "ojito.dev", note: "Acceso a la beta privada." },
] as const;

/**
 * Commands as the CLI on main accepts them (packages/cli/src/cli.ts): `login <key>` stores the key, `add <id>` installs.
 * `auth recover` rotates the key server-side and emails the new one (POST /api/v1/keys/recover).
 */
export const CLI = {
  login: "npx @crafter/hack0 login <tu key>",
  add: `npx @crafter/hack0 add ${WORKSHOP.id}`,
  recover: (email: string) => `npx @crafter/hack0 auth recover ${email}`,
} as const;
