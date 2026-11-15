type Layer = "look" | "motion" | "made" | "video" | "brand";

type GalleryEntry = {
  slug: string;
  title: string;
  layer: Layer;
  /** The piece that was taken apart. Absent for specimens built for the promo. */
  original?: string;
  /** Paths under /public. Clips are muted loops; `sound` marks a video meant to be played with controls. */
  video: string;
  poster: string;
  sound?: boolean;
  note: string;
};

export const LAYER_LABEL: Record<Layer, string> = {
  look: "se ve",
  motion: "se mueve",
  made: "está hecho",
  video: "video",
  brand: "marca",
};

/** The workshop promises this many recreations; the grid says how many are up. */
export const GALLERY_TARGET = 20;

const dir = "/taste-hacking";

export const GALLERY: GalleryEntry[] = [
  {
    slug: "toast",
    title: "Toast",
    layer: "motion",
    video: `${dir}/toast.mp4`,
    poster: `${dir}/toast.webp`,
    note: "Entra desde abajo con ease-out y se apila. Antes salía desde scale(0) con ease-in.",
  },
  {
    slug: "button",
    title: "Botón",
    layer: "motion",
    video: `${dir}/button.mp4`,
    poster: `${dir}/button.webp`,
    note: "scale(0.97) al presionar, 150 ms. Antes no respondía y animaba con transition: all.",
  },
  {
    slug: "landing",
    title: "Landing",
    layer: "look",
    video: `${dir}/landing.mp4`,
    poster: `${dir}/landing.webp`,
    note: "A la grilla, leading 0.95, un solo acento. Antes todo centrado sobre un gradiente morado.",
  },
  {
    slug: "tabs",
    title: "Tabs",
    layer: "motion",
    video: `${dir}/tabs.mp4`,
    poster: `${dir}/tabs.webp`,
    note: "El indicador viaja con spring (layout animation). Antes saltaba de golpe.",
  },
  {
    slug: "promo",
    title: "El promo del workshop",
    layer: "video",
    video: `${dir}/promo.mp4`,
    poster: `${dir}/promo.webp`,
    sound: true,
    note: "38 segundos hechos en código, con cortes en el beat a 120 BPM.",
  },
];
