type Layer = "look" | "motion" | "made" | "video" | "brand";

type GalleryEntry = {
  slug: string;
  title: string;
  layer: Layer;
  /** The piece that was taken apart. Absent for specimens built for the promo. */
  original?: string;
  /** Who made the original, as text. */
  credit?: string;
  /** Replay of the terminal session that rebuilt the piece, for buyers. Absent when the piece has none. */
  session?: string;
  /** Still shown before the session is played. Set with `session`. */
  sessionPoster?: string;
  /** Paths under /public. Clips are muted loops; `sound` marks a video meant to be played with controls. */
  video: string;
  poster: string;
  sound?: boolean;
  /** What the piece did before it was named. Absent when there is no "before". */
  before?: string;
  after: string;
};

export const LAYER_LABEL: Record<Layer, string> = {
  look: "se ve",
  motion: "se mueve",
  made: "está hecho",
  video: "video",
  brand: "marca",
};

const dir = "/taste-hacking";
const material = "/taste-hacking/material";

export const GALLERY: GalleryEntry[] = [
  {
    slug: "toast",
    title: "Toast",
    layer: "motion",
    video: `${dir}/toast.mp4`,
    poster: `${dir}/toast.webp`,
    before: "Salía desde scale(0) con ease-in.",
    after: "Entra desde abajo con ease-out y se apila.",
  },
  {
    slug: "button",
    title: "Botón",
    layer: "motion",
    video: `${dir}/button.mp4`,
    poster: `${dir}/button.webp`,
    before: "No respondía y animaba con transition: all.",
    after: "scale(0.97) al presionar, en 150 ms.",
  },
  {
    slug: "landing",
    title: "Landing",
    layer: "look",
    video: `${dir}/landing.mp4`,
    poster: `${dir}/landing.webp`,
    before: "Todo centrado sobre un gradiente morado.",
    after: "A la grilla, leading 0.95, un solo acento.",
  },
  {
    slug: "tabs",
    title: "Tabs",
    layer: "motion",
    video: `${dir}/tabs.mp4`,
    poster: `${dir}/tabs.webp`,
    before: "El indicador saltaba de golpe.",
    after: "El indicador viaja con spring (layout animation).",
  },
  {
    slug: "promo",
    title: "El promo del workshop",
    layer: "video",
    video: `${dir}/promo.mp4`,
    poster: `${dir}/promo.webp`,
    sound: true,
    after: "38 segundos hechos en código, con cortes en el beat a 120 BPM.",
  },
  {
    slug: "look-liquid-glass",
    title: "Liquid Glass",
    layer: "look",
    original: "https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/",
    credit: "Apple, nuevo diseño de software (2025)",
    session: `${material}#look-liquid-glass`,
    sessionPoster: "npt:35:00",
    video: `${dir}/look-liquid-glass.mp4`,
    poster: `${dir}/look-liquid-glass.webp`,
    after: "Refracción en el borde, no solo blur: la barra de tabs curva la grilla que tiene detrás y un lente se levanta entre pestañas.",
  },
  {
    slug: "motion-family-morph",
    title: "Continue a Confirm",
    layer: "motion",
    original: "https://benji.org/family-values",
    credit: "Benji Taylor, Family Values",
    session: `${material}#motion-family-morph`,
    sessionPoster: "npt:4:00",
    video: `${dir}/motion-family-morph.mp4`,
    poster: `${dir}/motion-family-morph.webp`,
    after: "Un botón que cambia de texto con letras compartidas y una bandeja que crece desde él, con springs medidos cuadro a cuadro.",
  },
  {
    slug: "made-lando-stack",
    title: "Un sitio premiado por dentro",
    layer: "made",
    original: "https://landonorris.com",
    credit: "OFF+BRAND, landonorris.com",
    session: `${material}#made-lando-stack`,
    sessionPoster: "npt:2:00",
    video: `${dir}/made-lando-stack.mp4`,
    poster: `${dir}/made-lando-stack.webp`,
    after: "El stack identificado en vivo (Lenis, GSAP, three.js) y un mecanismo rehecho: un busto 3D que gira con el scroll.",
  },
  {
    slug: "video-nothing-film",
    title: "Film de producto",
    layer: "video",
    original: "https://www.youtube.com/watch?v=oRZ6PX8abfo",
    credit: "Nothing, film de producto de 30 s",
    session: `${material}#video-nothing-film`,
    sessionPoster: "npt:40:00",
    video: `${dir}/video-nothing-film.mp4`,
    poster: `${dir}/video-nothing-film.webp`,
    after: "El oficio del film aplicado a un CLI: 18 segundos en Remotion con la salida real del comando.",
  },
  {
    slug: "brand-nubank-system",
    title: "Sistema de marca",
    layer: "brand",
    original: "https://nubank.com.br",
    credit: "Koto y el equipo de Nubank, refresh 2026",
    session: `${material}#brand-nubank-system`,
    sessionPoster: "npt:8:00",
    video: `${dir}/brand-nubank-system.mp4`,
    poster: `${dir}/brand-nubank-system.webp`,
    after: "El sistema medido en vivo y traducido a una plantilla de marca para hack0: reglas copiadas, colores no.",
  },
];
