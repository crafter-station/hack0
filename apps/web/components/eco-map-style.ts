import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export type Theme = "light" | "dark";

const BASE = "https://tiles.openfreemap.org/styles/positron";

/** hack0's paper, ink and blueprint line, mapped onto the basemap's layer families. */
const PALETTE: Record<Theme, Record<string, string>> = {
  light: {
    bg: "#f3f0e8",
    water: "#d6dcec",
    green: "#ebe7db",
    built: "#e8e3d6",
    minor: "#e2dccd",
    major: "#d3cbb8",
    boundary: "#1c3faa66",
    text: "#6b6b63",
    halo: "#f3f0e8",
  },
  dark: {
    bg: "#111110",
    water: "#151b2c",
    green: "#151514",
    built: "#191918",
    minor: "#1f1f1d",
    major: "#2b2a27",
    boundary: "#7f9bff55",
    text: "#9a988f",
    halo: "#111110",
  },
};

/** Spanish place names first: the directory is for LATAM, and the basemap defaults to English. */
const NAME = ["coalesce", ["get", "name:es"], ["get", "name"]];

function fillTone(id: string) {
  if (id === "water") return "water";
  if (id.startsWith("park") || id.includes("wood") || id.includes("glacier") || id.includes("ice")) return "green";
  return "built";
}

function lineTone(id: string) {
  if (id.startsWith("boundary")) return "boundary";
  if (id.startsWith("waterway")) return "water";
  if (id.includes("major") || id.includes("motorway")) return "major";
  return "minor";
}

let base: Promise<StyleSpecification> | null = null;

/** The basemap repainted for a theme; fetched once per page and recoloured locally on theme changes. */
export async function ecoStyle(theme: Theme): Promise<StyleSpecification> {
  base ??= fetch(BASE).then((r) => r.json() as Promise<StyleSpecification>);
  const style = structuredClone(await base);
  const c = PALETTE[theme];
  style.layers = style.layers.flatMap((layer): LayerSpecification[] => {
    const paint = { ...(layer.paint ?? {}) } as Record<string, unknown>;
    if (layer.type === "background") paint["background-color"] = c.bg;
    else if (layer.type === "fill") {
      paint["fill-color"] = c[fillTone(layer.id)];
      delete paint["fill-outline-color"];
    } else if (layer.type === "line") paint["line-color"] = c[lineTone(layer.id)];
    else if (layer.type === "symbol") {
      if (layer.id.includes("shield")) return [];
      paint["text-color"] = c.text;
      paint["text-halo-color"] = c.halo;
      paint["text-halo-width"] = 1.2;
      const layout = { ...(layer.layout ?? {}), "text-field": NAME } as typeof layer.layout;
      return [{ ...layer, paint, layout } as LayerSpecification];
    }
    return [{ ...layer, paint } as LayerSpecification];
  });
  return style;
}
