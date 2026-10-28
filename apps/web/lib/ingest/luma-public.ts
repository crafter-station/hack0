import { getStepMetadata, RetryableError } from "workflow";

function backoff() {
  try {
    return getStepMetadata().attempt ** 2 * 60_000;
  } catch {
    // Called outside a workflow step (scripts, tests): no attempt count to scale by.
    return 60_000;
  }
}

const LUMA_ORIGIN = "https://luma.com";
const LUMA_API = "https://api.lu.ma";
const BROWSER = { "user-agent": "Mozilla/5.0", accept: "text/html" };

export type PublicLumaEvent = {
  apiId: string;
  name: string;
  url: string;
  coverUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  city: string | null;
  hostNames: string[];
  timezone?: string | null;
  region?: string | null;
  countryCode?: string | null;
  venueAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOnline?: boolean;
  description?: string | null;
};

type Geo = {
  region?: string | null;
  city_state?: string | null;
  country_code?: string | null;
  full_address?: string | null;
};

type RawEvent = {
  api_id?: string;
  name?: string;
  url?: string;
  cover_url?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  timezone?: string | null;
  location_type?: string | null;
  geo_address_info?: Geo | null;
  coordinate?: { latitude?: number; longitude?: number } | null;
};

type RawEntry = { event?: RawEvent; hosts?: { name?: string }[] };

type Page = { entries?: RawEntry[]; has_more?: boolean; next_cursor?: string };

type ProseNode = { type?: string; text?: string; content?: ProseNode[]; attrs?: { level?: number } };

/** Luma's public pages embed their data as Next.js page props; `kind` says what the page is. */
type PageData =
  | {
      kind: "calendar";
      data: { calendar?: { api_id?: string }; upcoming?: Page; event_start_ats?: string[]; has_upcoming_events?: boolean };
    }
  | { kind: "event"; data: { event?: RawEvent; hosts?: { name?: string }[]; description_mirror?: ProseNode } }
  | { kind: "user"; data: { user?: { api_id?: string } } };

/** The page props of a public Luma page, or null when the page is gone or its shape changed. */
async function readPage(url: string): Promise<PageData | null> {
  const res = await fetch(url, { headers: BROWSER, redirect: "follow" });
  if (!res.ok) return null;
  const json = (await res.text()).match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!json) return null;
  const initial = (JSON.parse(json) as { props?: { pageProps?: { initialData?: Record<string, unknown> } } }).props?.pageProps?.initialData;
  if (!initial) return null;
  if (initial.kind === "calendar" || initial.kind === "event") return initial as PageData;
  // Profile pages carry the user at the top level instead of under `data`.
  if (initial.user) return { kind: "user", data: { user: initial.user as { api_id?: string } } };
  return null;
}

/** What a luma.com URL is: a calendar, one event or a user profile. Short links like luma.com/abc123 can be either of the first two. */
export async function lumaPageKind(url: string): Promise<"calendar" | "event" | "profile" | null> {
  const page = await readPage(url);
  if (!page) return null;
  return page.kind === "user" ? "profile" : page.kind;
}

/** Finds the `cal-` id behind a public calendar URL; Luma embeds it in the page. */
export async function resolveCalendarId(url: string): Promise<string | null> {
  const direct = url.match(/(cal-[A-Za-z0-9]+)/)?.[1];
  if (direct) return direct;
  const page = await readPage(url);
  return page?.kind === "calendar" ? (page.data.calendar?.api_id ?? null) : null;
}

function toPublicEvent(entry: RawEntry): PublicLumaEvent | null {
  const ev = entry.event;
  if (!ev?.api_id || !ev.name) return null;
  const slug = ev.url ?? ev.api_id;
  const geo = ev.geo_address_info;
  return {
    apiId: ev.api_id,
    name: ev.name,
    url: `${LUMA_ORIGIN}/${slug}`,
    coverUrl: ev.cover_url ?? null,
    startAt: ev.start_at ?? null,
    endAt: ev.end_at ?? null,
    city: geo?.city_state ?? null,
    hostNames: (entry.hosts ?? []).flatMap((h) => (h.name ? [h.name] : [])),
    timezone: ev.timezone ?? null,
    region: geo?.region ?? null,
    countryCode: geo?.country_code ?? null,
    venueAddress: geo?.full_address ?? null,
    latitude: ev.coordinate?.latitude ?? null,
    longitude: ev.coordinate?.longitude ?? null,
    isOnline: ev.location_type === "online" || undefined,
  };
}

async function fetchApiPage(path: string, args: Record<string, string>, cursor?: string): Promise<Page> {
  const qs = new URLSearchParams({ ...args, pagination_limit: "50" });
  if (cursor) qs.set("pagination_cursor", cursor);
  const res = await fetch(`${LUMA_API}${path}?${qs}`, { headers: { accept: "application/json" } });
  if (res.status === 429) {
    const seconds = Number(res.headers.get("retry-after"));
    // Without Retry-After, back off quadratically per attempt (1, 4, 9 minutes), the pattern the Workflow docs show.
    throw new RetryableError(`Luma rate limited ${path}`, {
      retryAfter: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : backoff(),
    });
  }
  if (!res.ok) throw new Error(`Luma ${path} failed (${res.status})`);
  return (await res.json()) as Page;
}

type FeedPage = { events: PublicLumaEvent[]; nextCursor: string | null };

const pageOf = (page: Page): FeedPage => ({
  events: (page.entries ?? []).flatMap((entry) => toPublicEvent(entry) ?? []),
  nextCursor: page.has_more ? (page.next_cursor ?? "") : null,
});

/** One page of a calendar's feed from api.lu.ma. `nextCursor` is null on the last page and "" when Luma broke pagination. */
export async function fetchCalendarFeedPage(calendarId: string, period: "future" | "past", cursor?: string): Promise<FeedPage> {
  return pageOf(await fetchApiPage("/calendar/get-items", { calendar_api_id: calendarId, period }, cursor));
}

/** One page of the events a Luma user hosts. */
export async function fetchProfileFeedPage(userId: string, period: "future" | "past", cursor?: string): Promise<FeedPage> {
  return pageOf(await fetchApiPage("/user/profile/events-hosting", { user_api_id: userId, period }, cursor));
}

/**
 * The upcoming events a calendar's own page embeds, which luma.com serves without api.lu.ma's rate limit.
 * Null when the page cannot vouch for the whole list (more pages, or fewer entries than its upcoming start times),
 * so the caller reads the API instead of marking unlisted events as removed.
 */
export async function fetchUpcomingFromPage(url: string, now = new Date()): Promise<PublicLumaEvent[] | null> {
  const page = await readPage(url);
  if (page?.kind !== "calendar" || !page.data.upcoming?.entries || !page.data.event_start_ats) return null;
  const { entries, has_more } = page.data.upcoming;
  const upcoming = page.data.event_start_ats.filter((at) => new Date(at) >= now).length;
  if (has_more || entries.length < upcoming || (page.data.has_upcoming_events && entries.length === 0)) return null;
  return entries.flatMap((entry) => toPublicEvent(entry) ?? []);
}

/** The `usr-` id behind a public profile URL such as luma.com/user/theveller. */
export async function resolveProfileId(url: string): Promise<string | null> {
  const page = await readPage(url);
  return page?.kind === "user" ? (page.data.user?.api_id ?? null) : null;
}

function inline(nodes: ProseNode[] = []): string {
  return nodes.map((n) => (n.type === "text" ? (n.text ?? "") : n.type === "hard_break" ? "\n" : inline(n.content))).join("");
}

function listItems(node: ProseNode, marker: (i: number) => string): string {
  return (node.content ?? []).map((item, i) => `${marker(i)} ${(item.content ?? []).map(block).join(" ")}`).join("\n");
}

function block(node: ProseNode): string {
  if (node.type === "paragraph") return inline(node.content);
  if (node.type === "heading") return `${"#".repeat(node.attrs?.level ?? 2)} ${inline(node.content)}`;
  if (node.type === "bullet_list") return listItems(node, () => "-");
  if (node.type === "ordered_list") return listItems(node, (i) => `${i + 1}.`);
  if (node.type === "horizontal_rule") return "";
  return node.content ? node.content.map(block).join("\n\n") : (node.text ?? "");
}

/** Plain markdown from Luma's rich-text description (a ProseMirror document). */
export function proseToMarkdown(doc: ProseNode | undefined): string | null {
  const text = (doc?.content ?? [])
    .map(block)
    .filter((part) => part.trim())
    .join("\n\n")
    .trim();
  return text || null;
}

/** One public event page: the event with its description, or null when the URL is not an event. */
export async function fetchEventPage(url: string): Promise<PublicLumaEvent | null> {
  const page = await readPage(url);
  if (page?.kind !== "event" || !page.data.event) return null;
  const event = toPublicEvent({ event: page.data.event, hosts: page.data.hosts });
  return event && { ...event, description: proseToMarkdown(page.data.description_mirror) };
}

/**
 * Every event a public calendar lists from api.lu.ma: upcoming always, past only when asked.
 * A missing or repeated cursor throws, so a partial feed never counts as complete.
 */
export async function fetchCalendarEvents(calendarId: string, opts: { past: boolean } = { past: true }): Promise<PublicLumaEvent[]> {
  const byId = new Map<string, PublicLumaEvent>();
  for (const period of opts.past ? (["future", "past"] as const) : (["future"] as const)) {
    const cursors = new Set<string>();
    let cursor: string | undefined;
    for (;;) {
      const page = await fetchCalendarFeedPage(calendarId, period, cursor);
      for (const event of page.events) byId.set(event.apiId, event);
      if (page.nextCursor === null) break;
      if (!page.nextCursor || cursors.has(page.nextCursor)) throw new Error(`Luma ${period} feed for ${calendarId} is incomplete`);
      cursors.add(page.nextCursor);
      cursor = page.nextCursor;
    }
  }
  return [...byId.values()];
}
