const LIST_URL = "https://public-api.luma.com/v1/calendars/events/list";

export type CalendarEvent = {
  id: string;
  name: string;
  url: string;
  startAt: string;
  timezone: string;
  city: string | null;
  online: boolean;
  coverUrl: string | null;
  location: [number, number] | null;
  slug: string;
  endAt: string | null;
  country: string | null;
  /** Metro area the event belongs to, e.g. Lima for an event in Barranco. */
  metro: string | null;
  /** Street address, only when the host made the location public. */
  address: string | null;
  tags: string[];
};

type LumaEvent = {
  id?: string;
  api_id?: string;
  name?: string;
  url?: string;
  start_at?: string;
  timezone?: string;
  cover_url?: string | null;
  meeting_url?: string | null;
  coordinate?: { latitude?: number; longitude?: number } | null;
  geo_address_json?: { city?: string; region?: string; country?: string; full_address?: string } | null;
  end_at?: string;
  visibility?: string;
  location_visibility?: string;
  tags?: { name: string }[];
};

/** Luma returns flat events; older responses wrapped them as `{ event }`. */
type Entry = LumaEvent & { status?: string; event?: LumaEvent };

export function toEvent(entry: Entry): CalendarEvent | null {
  const e = entry.event ?? entry;
  if (!e?.name || !e.url || !e.start_at) return null;
  if (entry.status && entry.status !== "approved") return null;
  if (e.visibility && e.visibility !== "public") return null;
  const geo = e.geo_address_json;
  const id = e.api_id ?? e.id ?? e.url;
  const code = e.url.replace(/^https?:\/\/[^/]+\//, "").replace(/^\/+/, "");
  return {
    id,
    slug: `${slugify(e.name)}-${slugify(code)}`.replace(/^-+/, ""),
    endAt: e.end_at ?? null,
    country: geo?.country ?? null,
    metro: geo?.city ? metroOf(geo.city, geo.region) : null,
    address: e.location_visibility === "public" ? (geo?.full_address ?? null) : null,
    tags: (e.tags ?? []).map((t) => cleanTag(t.name)).filter((t): t is string => Boolean(t)),
    name: e.name,
    url: e.url.startsWith("http") ? e.url : `https://luma.com/${e.url.replace(/^\/+/, "")}`,
    startAt: e.start_at,
    timezone: e.timezone ?? "America/Lima",
    city: geo?.city ? [geo.city, geo.country].filter(Boolean).join(", ") : null,
    online: !geo?.city && Boolean(e.meeting_url),
    coverUrl: e.cover_url ?? null,
    location:
      typeof e.coordinate?.latitude === "number" && typeof e.coordinate.longitude === "number"
        ? [e.coordinate.latitude, e.coordinate.longitude]
        : null,
  };
}

/** Regions whose events cluster in one metro area. */
const REGION_METROS: Record<string, string> = {
  "La Libertad": "Trujillo",
  Lambayeque: "Chiclayo",
  Arequipa: "Arequipa",
  Cusco: "Cusco",
  "Región Metropolitana": "Santiago",
  Mendoza: "Mendoza",
  "New York": "New York",
};

/** Luma stores the district as the city; districts must roll up to one hub per metro. */
export function metroOf(city: string, region?: string): string {
  if (!region) return city;
  const province = region.match(/^Provincia(?: Constitucional)? del? (.+)$/) ?? region.match(/^(.+) Province$/);
  if (province) return province[1];
  if (REGION_METROS[region]) return REGION_METROS[region];
  // Some addresses carry a postal code or "Capital" where the city should be.
  if (/\d/.test(city) || city === "Capital") return region;
  return city;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Drops emoji and location tags ("📍 Online", "🇵🇪 Perú"); cities come from the address. */
function cleanTag(name: string): string | null {
  if (/^\p{Extended_Pictographic}|^\p{Regional_Indicator}/u.test(name)) return null;
  return name.trim() || null;
}

async function listEvents(params: { after?: string; limit: number }): Promise<CalendarEvent[] | null> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) return null;
  const events: CalendarEvent[] = [];
  let cursor: string | undefined;
  while (events.length < params.limit) {
    const url = new URL(LIST_URL);
    url.searchParams.set("pagination_limit", "50");
    url.searchParams.set("status", "approved");
    for (const p of ["luma", "external"]) url.searchParams.append("platforms", p);
    for (const a of ["manage", "view"]) url.searchParams.append("access", a);
    url.searchParams.set("sort_column", "start_at");
    url.searchParams.set("sort_direction", "asc");
    if (params.after) url.searchParams.set("after", params.after);
    if (cursor) url.searchParams.set("pagination_cursor", cursor);
    const res = await fetch(url, { headers: { "x-luma-api-key": apiKey }, next: { revalidate: 3600 } });
    if (!res.ok) return events.length ? events : null;
    const data = (await res.json()) as { entries?: Entry[]; has_more?: boolean; next_cursor?: string };
    for (const entry of data.entries ?? []) {
      const event = toEvent(entry);
      if (event) events.push(event);
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return events.slice(0, params.limit);
}

/** Every public event the calendar has ever listed, oldest first. */
export function allEvents(limit = 1000) {
  return listEvents({ limit });
}

/** Markdown description from the event endpoint, or null when Luma does not share it. */
export async function eventDescription(id: string): Promise<string | null> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey || !id.startsWith("evt-")) return null;
  const res = await fetch(`https://public-api.luma.com/v1/event/get?id=${encodeURIComponent(id)}`, {
    headers: { "x-luma-api-key": apiKey },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { event?: { description_md?: string | null } };
  return data.event?.description_md?.trim() || null;
}

export function cityKey(e: CalendarEvent) {
  return e.metro ? slugify(e.metro) : null;
}

/** "Barranco, Lima" for a district, "Lima" when the event is in the metro itself. */
export function placeLabel(e: CalendarEvent) {
  const district = e.city?.split(",")[0];
  if (!e.metro) return e.online ? "online" : "";
  return district && district !== e.metro ? `${district}, ${e.metro}` : e.metro;
}

/** Upcoming approved events of the hack0 Luma calendar, cached for an hour. */
export function upcomingEvents(limit = 60) {
  return listEvents({ after: new Date().toISOString(), limit });
}

export type Spot = { location: [number, number]; count: number; upcoming: boolean };

/** Every event the calendar has mapped, grouped by place, for the globe. */
export async function eventSpots(limit = 1000): Promise<Spot[]> {
  const events = (await listEvents({ limit })) ?? [];
  return groupSpots(events, Date.now());
}

export function groupSpots(events: CalendarEvent[], now: number): Spot[] {
  const spots = new Map<string, Spot>();
  for (const e of events) {
    if (!e.location) continue;
    const key = e.location.map((n) => n.toFixed(1)).join(",");
    const spot = spots.get(key) ?? { location: e.location, count: 0, upcoming: false };
    spot.count++;
    if (new Date(e.startAt).getTime() > now) spot.upcoming = true;
    spots.set(key, spot);
  }
  return [...spots.values()];
}
