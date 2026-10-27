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
  geo_address_json?: { city?: string; country?: string } | null;
};

/** Luma returns flat events; older responses wrapped them as `{ event }`. */
type Entry = LumaEvent & { status?: string; event?: LumaEvent };

export function toEvent(entry: Entry): CalendarEvent | null {
  const e = entry.event ?? entry;
  if (!e?.name || !e.url || !e.start_at) return null;
  if (entry.status && entry.status !== "approved") return null;
  const geo = e.geo_address_json;
  return {
    id: e.api_id ?? e.id ?? e.url,
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
