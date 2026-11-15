type Layer = "look" | "motion" | "made" | "video" | "brand";

type GalleryEntry = {
  slug: string;
  title: string;
  layer: Layer;
  /** The piece that was taken apart. Absent for specimens built for the promo. */
  original?: string;
  /** Replay of the terminal session that rebuilt the piece. The plate keeps the slot until it exists. */
  session?: string;
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
];
