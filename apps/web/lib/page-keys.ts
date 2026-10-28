import { metroOf, slugify } from "@/lib/calendar";

/** Path of the source URL after the host, e.g. "1z4no5h8" for luma.com/1z4no5h8. */
function urlCode(url: string) {
  return url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/+$/, "");
}

/** Public slug: the event name plus the source URL code, which keeps it unique and stable across renames. */
export function eventSlug(name: string, url: string) {
  return `${slugify(name)}-${slugify(urlCode(url))}`.replace(/^-+/, "");
}

/** Luma's `city_state` is "District, Region" and other providers send a bare city; both resolve to a metro. */
export function splitCity(raw: string | null | undefined): { city: string | null; region: string | undefined } {
  if (!raw) return { city: null, region: undefined };
  const [city, region] = raw.split(",").map((p) => p.trim());
  return { city: city || null, region: region || undefined };
}

export function eventMetro(rawCity: string | null | undefined, region?: string | null) {
  const split = splitCity(rawCity);
  if (!split.city) return null;
  return metroOf(split.city, split.region ?? region ?? undefined);
}
