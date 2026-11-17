"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MapLibre, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ecoStyle, type Theme } from "@/components/eco-map-style";
import { separate } from "@/components/eco-repel";

type Pin = {
  slug: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  logoUrl: string | null;
  logoTone: "light" | "dark" | null;
  logoAspect: number | null;
};
export type MapPlace = { slug: string; name: string; count: number; lng: number; lat: number; zoom: number };

type Props = {
  pins: Pin[];
  places: MapPlace[];
  /** Path a place opens, e.g. `/ecosistema` for countries or `/ecosistema/peru` for cities. */
  placeBase: string;
  view: [number, number, number];
  selected?: string | null;
  onSelect?: (slug: string | null) => void;
};

/** Hub squares show until this zoom; past it the orgs take over, so the two never stack. */
const PLACES_UNTIL = 9;
/** Org names show from this zoom, when pins are far enough apart to read. */
const NAMES_FROM = 14;
/** Vertical room each org marker keeps, in pixels; taller once names show under the logos. */
const GAP_Y = 52;
const GAP_Y_NAMED = 76;
/** Horizontal breathing room between two markers' widest parts. */
const GAP_X_PAD = 12;
const FAN = 3;
/** A marker that appears within this many pixels of one that left is treated as its split or merge. */
const KIN = 140;
const MOTION_MS = 320;

function theme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const fc = <T extends { lng: number; lat: number }>(items: T[], props: (i: T) => Record<string, unknown>) => ({
  type: "FeatureCollection" as const,
  features: items.map((i) => ({
    type: "Feature" as const,
    properties: props(i),
    geometry: { type: "Point" as const, coordinates: [i.lng, i.lat] },
  })),
});

const pinData = (pins: Pin[]) => fc(pins, (p) => ({ slug: p.slug }));

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** The org's logo tile, or its initials. Shared by single pins and the cards in a cluster's fan. */
function logoTile(pin: Pin | undefined, className: string) {
  const tile = el("span", className);
  if (pin?.logoUrl && pin.logoTone) tile.dataset.tone = pin.logoTone;
  // Wide marks get a wider tile on single pins; the fan keeps square cards so they stack.
  if (pin?.logoUrl && pin.logoAspect && pin.logoAspect > 1.4 && !className.includes("eco-fan-tile")) tile.dataset.wide = "";
  if (pin?.logoUrl) {
    const img = el("img", "");
    img.src = pin.logoUrl;
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => img.replaceWith(document.createTextNode(initials(pin.name)));
    tile.append(img);
  } else tile.textContent = pin ? initials(pin.name) : "";
  return tile;
}

/** Room taken by the floating panel: beside the map on wide screens, under it on phones. */
function panelPadding(host: HTMLElement) {
  const panel = host.parentElement?.querySelector<HTMLElement>(".eco-panel");
  if (!panel) return { top: 0, left: 0, right: 0, bottom: 0 };
  const box = panel.getBoundingClientRect();
  const map = host.getBoundingClientRect();
  const beside = box.height > map.height * 0.75;
  return beside ? { top: 0, bottom: 0, right: 0, left: box.right - map.left } : { top: 0, left: 0, right: 0, bottom: map.bottom - box.top };
}

/** Invisible layers so the clustered sources load; every visible marker is HTML on top. */
function addSources(map: MapLibre, pins: Pin[], places: MapPlace[]) {
  map.addSource("places", {
    type: "geojson",
    data: fc(places, (p) => ({ slug: p.slug, name: p.name, count: p.count })),
    cluster: true,
    clusterRadius: 40,
    clusterProperties: { total: ["+", ["get", "count"]] },
  });
  map.addSource("pins", { type: "geojson", data: pinData(pins), cluster: true, clusterRadius: 52, clusterMaxZoom: 13 });
  for (const source of ["places", "pins"]) {
    map.addLayer({ id: `${source}-load`, type: "circle", source, paint: { "circle-radius": 1, "circle-opacity": 0 } });
  }
}

type Spec =
  | { kind: "place"; slug: string; name: string; count: number; at: [number, number] }
  | { kind: "places"; id: number; count: number; at: [number, number] }
  | { kind: "cluster"; id: number; count: number; at: [number, number] }
  | { kind: "org"; slug: string; at: [number, number] };

type SourceFeature = ReturnType<MapLibre["querySourceFeatures"]>[number];

function specOf(source: "places" | "pins", f: SourceFeature): [string, Spec] | null {
  if (f.geometry.type !== "Point") return null;
  const at = f.geometry.coordinates as [number, number];
  const p = f.properties ?? {};
  if (typeof p.cluster_id === "number") {
    return source === "places"
      ? [`places-${p.cluster_id}`, { kind: "places", id: p.cluster_id, count: Number(p.total), at }]
      : [`cluster-${p.cluster_id}`, { kind: "cluster", id: p.cluster_id, count: Number(p.point_count), at }];
  }
  return source === "places"
    ? [`place-${p.slug}`, { kind: "place", slug: String(p.slug), name: String(p.name), count: Number(p.count), at }]
    : [`org-${p.slug}`, { kind: "org", slug: String(p.slug), at }];
}

/** Full-bleed directory map. Places fly in and open their hub; clusters fan out their logos and zoom apart; orgs select into the panel. */
export function EcoMap({ pins, places, placeBase, view, selected = null, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const router = useRouter();
  // Read by map handlers that outlive a render, so they always see the current filter, selection and callback.
  const live = useRef({ pins, onSelect, selected });
  live.current = { pins, onSelect, selected };
  const viewKey = view.join(",");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const host: HTMLDivElement = node;
    const [lng, lat, zoom] = viewKey.split(",").map(Number);
    let map: MapLibre | null = null;
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    const scheme = matchMedia("(prefers-color-scheme: dark)");

    Promise.all([import("maplibre-gl"), ecoStyle(theme())]).then(([lib, style]) => {
      if (cancelled) return;
      // The worker ships as its own module; bundling the library breaks its import.meta.url lookup.
      lib.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
      let t = theme();
      const m = new lib.Map({
        container: host,
        style,
        center: [lng, lat],
        zoom,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      map = m;
      mapRef.current = m;
      m.touchZoomRotate.disableRotation();
      m.addControl(new lib.NavigationControl({ showCompass: false }), "bottom-right");

      // Layout can settle after the map mounts (fonts, the panel, a parent's height), so size and pad on every change.
      const fit = () => {
        m.resize();
        m.setPadding(panelPadding(host));
      };
      fit();
      const sizer = new ResizeObserver(fit);
      sizer.observe(host);
      cleanups.push(() => sizer.disconnect());

      const markers = new Map<string, { marker: Marker; spec: Spec }>();
      const bySlug = () => new Map(live.current.pins.map((p) => [p.slug, p]));

      const zoomInto = async (source: "places" | "pins", id: number, at: [number, number]) => {
        const next = await (m.getSource(source) as GeoJSONSource).getClusterExpansionZoom(id);
        m.easeTo({ center: at, zoom: next + 0.5, duration: 600 });
      };

      function build(spec: Spec): HTMLElement {
        const pin = spec.kind === "org" ? bySlug().get(spec.slug) : undefined;
        const node = el("button", `eco-marker eco-${spec.kind}`);
        node.type = "button";
        // Outer layer for split and merge motion; the org body inside carries the repel offset.
        const fly = el("span", "eco-fly");
        node.append(fly);
        if (spec.kind === "org") {
          node.dataset.slug = spec.slug;
          node.setAttribute("aria-label", pin?.name ?? spec.slug);
          const body = el("span", "eco-org-body");
          body.append(logoTile(pin, "eco-tile"), el("span", "eco-org-name", pin?.name));
          fly.append(body);
          node.onclick = () => live.current.onSelect?.(spec.slug);
        } else if (spec.kind === "cluster") {
          node.setAttribute("aria-label", `${spec.count} organizaciones, acercar`);
          const fan = el("span", "eco-fan");
          fly.append(fan, el("span", "eco-badge", String(spec.count)));
          (m.getSource("pins") as GeoJSONSource).getClusterLeaves(spec.id, FAN, 0).then((leaves) => {
            const map = bySlug();
            for (const leaf of leaves) fan.append(logoTile(map.get(String(leaf.properties?.slug)), "eco-tile eco-fan-tile"));
          });
          node.onclick = () => zoomInto("pins", spec.id, spec.at);
        } else if (spec.kind === "places") {
          node.setAttribute("aria-label", `${spec.count} organizaciones, acercar`);
          fly.append(el("span", "eco-place-count", String(spec.count)));
          node.onclick = () => zoomInto("places", spec.id, spec.at);
        } else {
          node.setAttribute("aria-label", `${spec.name}: ${spec.count} organizaciones`);
          fly.append(el("span", "eco-place-count", String(spec.count)), el("span", "eco-place-name", spec.name));
          const place = places.find((p) => p.slug === spec.slug);
          node.onclick = () => {
            if (!place) return;
            m.flyTo({ center: [place.lng, place.lat], zoom: place.zoom, duration: 1400, essential: true });
            m.once("moveend", () => router.push(`${placeBase}/${place.slug}`));
          };
        }
        return node;
      }

      /** Pushes overlapping org markers apart in screen space; the CSS transition makes it read as a repel. */
      function repel() {
        const orgs = [...markers.values()].filter((x) => x.spec.kind === "org");
        const pts = orgs.map((x) => m.project(x.spec.at));
        const named = m.getZoom() >= NAMES_FROM;
        // Each marker is as wide as its logo, or its name once names show, so long names never cover a neighbour.
        const widths = orgs.map((x) => {
          const node = x.marker.getElement();
          const tile = node.querySelector<HTMLElement>(".eco-tile")?.offsetWidth ?? 36;
          return named ? Math.max(tile, node.querySelector<HTMLElement>(".eco-org-name")?.offsetWidth ?? 0) : tile;
        });
        const off = separate(pts, widths, named ? GAP_Y_NAMED : GAP_Y, GAP_X_PAD);
        orgs.forEach((x, i) => {
          const body = x.marker.getElement().querySelector<HTMLElement>(".eco-org-body");
          if (body) body.style.transform = `translate(${off[i].x.toFixed(1)}px, ${off[i].y.toFixed(1)}px)`;
        });
      }

      type Moving = { marker: Marker; spec: Spec; at: { x: number; y: number } };
      const grouped = (spec: Spec) => spec.kind === "cluster" || spec.kind === "places";
      const nearest = (at: { x: number; y: number }, list: Moving[]) => {
        let best: Moving | null = null;
        let bestD = KIN;
        for (const x of list) {
          const d = Math.hypot(x.at.x - at.x, x.at.y - at.y);
          if (d < bestD) {
            best = x;
            bestD = d;
          }
        }
        return best;
      };
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      /** Splits grow out of the group that left; merges slide into the group that formed; anything else fades. */
      function animate(gone: Moving[], born: Moving[]) {
        const parents = gone.filter((x) => grouped(x.spec));
        const groups = born.filter((x) => grouped(x.spec));
        for (const b of born) {
          const fly = b.marker.getElement().querySelector<HTMLElement>(".eco-fly");
          if (!fly || reduced) continue;
          const from = nearest(b.at, parents);
          fly.style.transition = "none";
          fly.style.opacity = "0";
          fly.style.transform = from ? `translate(${from.at.x - b.at.x}px, ${from.at.y - b.at.y}px) scale(0.6)` : "scale(0.7)";
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              fly.style.transition = "";
              fly.style.opacity = "";
              fly.style.transform = "";
            }),
          );
        }
        for (const g of gone) {
          const fly = g.marker.getElement().querySelector<HTMLElement>(".eco-fly");
          if (!fly || reduced) {
            g.marker.remove();
            continue;
          }
          const into = nearest(g.at, groups);
          g.marker.getElement().style.pointerEvents = "none";
          fly.style.opacity = "0";
          fly.style.transform = into ? `translate(${into.at.x - g.at.x}px, ${into.at.y - g.at.y}px) scale(0.6)` : "scale(0.7)";
          setTimeout(() => g.marker.remove(), MOTION_MS);
        }
      }

      function sync() {
        if (!m.getSource("pins") || !m.getSource("places")) return;
        const z = m.getZoom();
        host.toggleAttribute("data-names", z >= NAMES_FROM);
        const showPlaces = places.length > 0 && z < PLACES_UNTIL;
        const want = new Map<string, Spec>();
        const read = (source: "places" | "pins") => {
          for (const f of m.querySourceFeatures(source)) {
            const entry = specOf(source, f);
            if (entry) want.set(entry[0], entry[1]);
          }
        };
        if (showPlaces) read("places");
        else read("pins");
        const gone: { marker: Marker; spec: Spec; at: { x: number; y: number } }[] = [];
        for (const [key, x] of markers) {
          if (want.has(key)) continue;
          gone.push({ ...x, at: m.project(x.spec.at) });
          markers.delete(key);
        }
        const born: { marker: Marker; spec: Spec; at: { x: number; y: number } }[] = [];
        for (const [key, spec] of want) {
          if (markers.has(key)) continue;
          const marker = new lib.Marker({ element: build(spec), anchor: "center" }).setLngLat(spec.at).addTo(m);
          markers.set(key, { marker, spec });
          born.push({ marker, spec, at: m.project(spec.at) });
        }
        animate(gone, born);
        for (const x of markers.values()) {
          if (x.spec.kind === "org") x.marker.getElement().classList.toggle("is-on", x.spec.slug === live.current.selected);
        }
        repel();
      }
      syncRef.current = () => {
        for (const x of markers.values()) x.marker.remove();
        markers.clear();
        sync();
      };

      let frame = 0;
      const soon = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(sync);
      };
      m.on("style.load", () => {
        addSources(m, live.current.pins, places);
        soon();
      });
      m.on("move", soon);
      m.on("sourcedata", (e) => {
        if (e.isSourceLoaded) soon();
      });
      // A city hub opens framed on its pins rather than on the city centre.
      m.once("load", () => {
        const list = live.current.pins;
        if (places.length > 0 || list.length < 2 || live.current.selected) return;
        const b = new lib.LngLatBounds();
        for (const p of list) b.extend([p.lng, p.lat]);
        m.fitBounds(b, { padding: 72, maxZoom: 14, duration: 0 });
      });
      cleanups.push(() => cancelAnimationFrame(frame));

      const swap = () => {
        const next = theme();
        if (next === t) return;
        t = next;
        ecoStyle(t).then((s) => m.setStyle(s));
      };
      const observer = new MutationObserver(swap);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      scheme.addEventListener("change", swap);
      cleanups.push(() => {
        observer.disconnect();
        scheme.removeEventListener("change", swap);
      });
    });

    return () => {
      cancelled = true;
      for (const c of cleanups) c();
      map?.remove();
      mapRef.current = null;
      syncRef.current = null;
    };
  }, [places, placeBase, viewKey, router]);

  // Filters change which pins exist, so the clustered source is replaced and its markers rebuilt.
  useEffect(() => {
    const source = mapRef.current?.getSource("pins") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(pinData(pins)).then(() => syncRef.current?.());
  }, [pins]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    for (const node of m.getContainer().querySelectorAll<HTMLElement>(".eco-org"))
      node.classList.toggle("is-on", node.dataset.slug === selected);
    const pin = pins.find((p) => p.slug === selected);
    if (pin) m.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(m.getZoom(), 15.5), duration: 900, essential: true });
  }, [selected, pins]);

  return <div ref={ref} className="eco-map" />;
}
