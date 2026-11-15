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
    { place: "Perú", time: "7:00 p.m." },
    { place: "Buenos Aires", time: "9:00 p.m." },
  ],
  price: "US$20",
  /** Sender of the email that carries the license key. */
  keySender: "workshops@updates.hack0.dev",
} as const;

export type LayerId = "look" | "motion" | "made";

/** The thesis: three layers, and the words that ask for each one. */
export const LAYERS: { id: LayerId; n: string; name: string; short: string; ask: string; words: { w: string; d: string }[] }[] = [
  {
    id: "look",
    n: "01",
    name: "Cómo se ve",
    short: "se ve",
    ask: "Tipografía, espaciado y superficie.",
    words: [
      { w: "jerarquía", d: "qué se lee primero" },
      { w: "escala tipográfica", d: "los tamaños y la razón entre ellos" },
      { w: "tracking", d: "el espacio entre letras" },
      { w: "leading", d: "el espacio entre líneas" },
      { w: "grid", d: "a qué se alinea cada cosa" },
      { w: "contraste", d: "cuánto se separa la letra del fondo" },
      { w: "densidad", d: "cuánto entra en una pantalla" },
      { w: "grain", d: "ruido fino sobre una superficie plana" },
    ],
  },
  {
    id: "motion",
    n: "02",
    name: "Cómo se mueve",
    short: "se mueve",
    ask: "Qué entra, cuándo y con qué curva.",
    words: [
      { w: "easing", d: "la curva de velocidad" },
      { w: "spring", d: "movimiento con masa y resorte" },
      { w: "stagger", d: "el retraso entre un elemento y el siguiente" },
      { w: "duration", d: "cuánto dura" },
      { w: "overshoot", d: "pasarse un poco y volver" },
      { w: "layout animation", d: "animar un cambio de posición o tamaño" },
      { w: "scroll-driven", d: "el scroll hace de reloj" },
    ],
  },
  {
    id: "made",
    n: "03",
    name: "Cómo está hecho",
    short: "está hecho",
    ask: "Lo que hay debajo de lo que ves.",
    words: [
      { w: "sources", d: "el código que llega al navegador" },
      { w: "bundles", d: "cómo viene empaquetado" },
      { w: "librerías", d: "qué usa por debajo" },
      { w: "estilos computados", d: "el valor final de cada propiedad" },
      { w: "tokens", d: "los valores que tienen nombre" },
    ],
  },
];

/** `min` is the block's length; the agenda draws each row at a height proportional to it. */
export const AGENDA: { from: number; min: number; title: string; note?: string; cases?: { layer: string; title: string }[] }[] = [
  { from: 0, min: 10, title: "La tesis", note: "Tres capas y el mindset de «lo hice en una noche»." },
  { from: 10, min: 15, title: "Vocabulario", note: "Ejemplos buenos contra slop, capa por capa." },
  {
    from: 25,
    min: 45,
    title: "Tres casos en vivo",
    note: "Van preparados. Si algo falla, el debugging es parte de la clase.",
    cases: [
      { layer: "se mueve", title: "Una animación viral de X" },
      { layer: "se ve", title: "Una landing premium" },
      { layer: "video", title: "Un estilo de edición de video" },
    ],
  },
  { from: 70, min: 10, title: "La skill y la galería", note: "Cómo usar la skill y cómo leer las sesiones reales." },
  { from: 80, min: 10, title: "Preguntas" },
];

export const TAKEAWAYS = [
  { title: "La skill taste-hacking", note: "El método de Railly, listo para instalar en tu agente." },
  { title: "La galería de recreaciones", note: "El antes, el después y el video de cada pieza." },
  { title: "Sesiones reales de Claude Code", note: "Sin editar, con typos y todo. Solo se tapan keys, tokens y emails." },
  { title: "La grabación", note: "Los 90 minutos completos." },
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
