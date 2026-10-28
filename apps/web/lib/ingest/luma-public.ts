import { RetryableError } from "workflow";

const LUMA_ORIGIN = "https://luma.com";
const LUMA_API = "https://api.lu.ma";

export type PublicLumaEvent = {
  apiId: string;
  name: string;
  url: string;
  coverUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  city: string | null;
  hostNames: string[];
};

type RawEntry = {
  event?: {
    api_id?: string;
    name?: string;
    url?: string;
    cover_url?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    geo_address_info?: { city_state?: string | null } | null;
  };
  hosts?: { name?: string }[];
};

type Page = { entries?: RawEntry[]; has_more?: boolean; next_cursor?: string };

/** Finds the `cal-` id behind a public calendar URL; Luma embeds it in the page. */
export async function resolveCalendarId(url: string): Promise<string | null> {
  const direct = url.match(/(cal-[A-Za-z0-9]+)/)?.[1];
  if (direct) return direct;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", accept: "text/html" }, redirect: "follow" });
  if (!res.ok) return null;
  return (await res.text()).match(/"api_id"\s*:\s*"(cal-[A-Za-z0-9]+)"/)?.[1] ?? null;
}

function toPublicEvent(entry: RawEntry): PublicLumaEvent | null {
  const ev = entry.event;
  if (!ev?.api_id || !ev.name) return null;
  const slug = ev.url ?? ev.api_id;
  return {
    apiId: ev.api_id,
    name: ev.name,
    url: `${LUMA_ORIGIN}/${slug}`,
    coverUrl: ev.cover_url ?? null,
    startAt: ev.start_at ?? null,
    endAt: ev.end_at ?? null,
    city: ev.geo_address_info?.city_state ?? null,
    hostNames: (entry.hosts ?? []).flatMap((h) => (h.name ? [h.name] : [])),
  };
}

async function fetchPage(calendarId: string, period: "future" | "past", cursor?: string): Promise<Page> {
  const qs = new URLSearchParams({ calendar_api_id: calendarId, period, pagination_limit: "50" });
  if (cursor) qs.set("pagination_cursor", cursor);
  const res = await fetch(`${LUMA_API}/calendar/get-items?${qs}`, { headers: { accept: "application/json" } });
  if (res.status === 429) {
    const seconds = Number(res.headers.get("retry-after"));
    const message = `Luma rate limited get-items for ${calendarId}`;
    throw Number.isFinite(seconds) && seconds > 0
      ? new RetryableError(message, { retryAfter: seconds * 1000 })
      : new RetryableError(message);
  }
  if (!res.ok) throw new Error(`Luma get-items failed for ${calendarId} (${res.status})`);
  return (await res.json()) as Page;
}

async function readPeriod(calendarId: string, period: "future" | "past", into: Map<string, PublicLumaEvent>) {
  const cursors = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    const page = await fetchPage(calendarId, period, cursor);
    for (const event of (page.entries ?? []).map(toPublicEvent)) if (event) into.set(event.apiId, event);
    if (!page.has_more) return;
    if (!page.next_cursor || cursors.has(page.next_cursor)) throw new Error(`Luma ${period} feed for ${calendarId} is incomplete`);
    cursors.add(page.next_cursor);
    cursor = page.next_cursor;
  }
}

/**
 * Every event a public calendar lists, upcoming and past.
 * A feed counts as complete only when Luma returns `has_more: false`; a missing or repeated cursor throws.
 */
export async function fetchCalendarEvents(calendarId: string): Promise<PublicLumaEvent[]> {
  const byId = new Map<string, PublicLumaEvent>();
  await readPeriod(calendarId, "future", byId);
  await readPeriod(calendarId, "past", byId);
  return [...byId.values()];
}
