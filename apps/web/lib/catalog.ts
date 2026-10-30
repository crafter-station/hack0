import { and, asc, count, desc, eq, like, ne, or, type SQL, sql } from "drizzle-orm";
import { cache } from "react";
import { allEvents, type CalendarEvent, cityKey, eventDescription, slugify } from "@/lib/calendar";
import { rowToEvent } from "@/lib/catalog-db";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";
import { LUMA } from "@/lib/site";

export type HubLink = { slug: string; name: string; count: number };
type HubKind = "ciudad" | "tema";
export type Community = HubLink & { id: string; url: string; upcoming: number; metros: string[] };
type EventPage = { event: CalendarEvent; description: string | null; curated: boolean };

/** Page size for the archive's past events, matching the API's default page. */
export const ARCHIVE_PAGE = 100;

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

/** A page earns indexing with real text; a bare title, date and cover is thin content. */
export const indexable = (page: Pick<EventPage, "description" | "curated">) => Boolean(page.description) || page.curated;

// ---------- Postgres ----------

const live = and(eq(canonicalEvents.listed, true), eq(canonicalEvents.active, true)) as SQL;
const ends = sql`coalesce(${canonicalEvents.endAt}, ${canonicalEvents.startAt})`;
const nowTs = () => sql`${new Date().toISOString()}::timestamptz`;

async function dbEvent(slug: string): Promise<{ page: EventPage | null; movedTo: string | null }> {
  const [row] = await getDb()
    .select()
    .from(canonicalEvents)
    .where(and(live, eq(canonicalEvents.slug, slug)))
    .limit(1);
  if (row) return { page: { event: rowToEvent(row), description: row.description, curated: row.curated }, movedTo: null };
  // A rename changes the name part of the slug; the URL code at the end stays.
  const code = slug.split("-").pop();
  if (!code) return { page: null, movedTo: null };
  const [moved] = await getDb()
    .select({ slug: canonicalEvents.slug })
    .from(canonicalEvents)
    .where(and(live, like(canonicalEvents.slug, `%-${code}`)))
    .limit(1);
  return { page: null, movedTo: moved?.slug ?? null };
}

function hubFilter(kind: HubKind, name: string): SQL {
  return kind === "ciudad" ? sql`lower(${canonicalEvents.metro}) = lower(${name})` : sql`${name} = any(${canonicalEvents.tags})`;
}

async function dbHubIndex(kind: HubKind): Promise<HubLink[]> {
  const rows =
    kind === "ciudad"
      ? await getDb()
          .select({ name: canonicalEvents.metro, count: count() })
          .from(canonicalEvents)
          .where(and(live, sql`${canonicalEvents.metro} is not null`))
          .groupBy(canonicalEvents.metro)
          .orderBy(desc(count()))
      : await getDb()
          .select({ name: sql<string>`unnest(${canonicalEvents.tags})`, count: count() })
          .from(canonicalEvents)
          .where(live)
          .groupBy(sql`1`)
          .orderBy(desc(count()));
  // "Lima" and "LIMA" share a slug: one hub, named by the most common spelling, counting both.
  const bySlug = new Map<string, HubLink>();
  for (const r of rows) {
    if (!r.name) continue;
    const slug = slugify(r.name);
    const hub = bySlug.get(slug);
    bySlug.set(slug, hub ? { ...hub, count: hub.count + r.count } : { slug, name: r.name, count: r.count });
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count);
}

async function dbHubEvents(where: SQL, pastPage: number) {
  const [upcoming, past, [total]] = await Promise.all([
    getDb()
      .select()
      .from(canonicalEvents)
      .where(and(where, sql`${ends} >= ${nowTs()}`))
      .orderBy(asc(canonicalEvents.startAt)),
    getDb()
      .select()
      .from(canonicalEvents)
      .where(and(where, sql`${ends} < ${nowTs()}`))
      .orderBy(desc(canonicalEvents.startAt))
      .limit(ARCHIVE_PAGE)
      .offset(pastPage * ARCHIVE_PAGE),
    getDb()
      .select({ n: count() })
      .from(canonicalEvents)
      .where(and(where, sql`${ends} < ${nowTs()}`)),
  ]);
  return { upcoming: upcoming.map(rowToEvent), past: past.map(rowToEvent), pastTotal: total?.n ?? 0 };
}

// ---------- Luma calendar fallback (no database configured) ----------

async function lumaEvents() {
  return (await allEvents()) ?? [];
}

function lumaHubIndex(events: CalendarEvent[], kind: HubKind): HubLink[] {
  const counts = new Map<string, HubLink>();
  for (const e of events) {
    const names = kind === "ciudad" ? (e.metro ? [e.metro] : []) : e.tags;
    for (const name of names) {
      const slug = slugify(name);
      counts.set(slug, { slug, name, count: (counts.get(slug)?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function splitByEnd(events: CalendarEvent[], now = Date.now()) {
  const ended = (e: CalendarEvent) => new Date(e.endAt ?? e.startAt).getTime() < now;
  return { upcoming: events.filter((e) => !ended(e)), past: events.filter(ended).reverse() };
}

// ---------- public API ----------

export async function findEvent(slug: string): Promise<{ page: EventPage | null; movedTo: string | null }> {
  if (hasDatabase()) return dbEvent(slug);
  const events = await lumaEvents();
  const event = events.find((e) => e.slug === slug);
  if (event) return { page: { event, description: await eventDescription(event.id), curated: true }, movedTo: null };
  const code = slug.split("-").pop();
  return { page: null, movedTo: events.find((e) => code && e.slug.endsWith(`-${code}`))?.slug ?? null };
}

/** Other events in the same metro or sharing a topic, nearest upcoming first. */
export async function relatedEvents(e: CalendarEvent, limit = 6): Promise<CalendarEvent[]> {
  if (hasDatabase()) {
    const near = [
      e.metro ? eq(canonicalEvents.metro, e.metro) : undefined,
      ...e.tags.map((t) => sql`${t} = any(${canonicalEvents.tags})`),
    ].filter((c): c is SQL => c !== undefined);
    if (near.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(canonicalEvents)
      .where(and(live, ne(canonicalEvents.slug, e.slug), or(...near), sql`${ends} >= ${nowTs()}`))
      .orderBy(asc(canonicalEvents.startAt))
      .limit(limit);
    return rows.map(rowToEvent);
  }
  const city = cityKey(e);
  return (await lumaEvents())
    .filter((o) => o.id !== e.id && ((city && cityKey(o) === city) || o.tags.some((t) => e.tags.includes(t))))
    .slice(-limit)
    .reverse();
}

export async function hubIndex(kind: HubKind): Promise<HubLink[]> {
  return hasDatabase() ? dbHubIndex(kind) : lumaHubIndex(await lumaEvents(), kind);
}

/** A hub's events: every upcoming one and one page of past ones. `slug` null means the whole catalog. */
export async function hubEvents(kind: HubKind | null, slug: string | null, pastPage = 0) {
  if (hasDatabase()) {
    if (!kind || !slug) return { name: null, ...(await dbHubEvents(live, pastPage)) };
    const link = (await dbHubIndex(kind)).find((h) => h.slug === slug);
    if (!link) return null;
    return { name: link.name, ...(await dbHubEvents(and(live, hubFilter(kind, link.name)) as SQL, pastPage)) };
  }
  const events = await lumaEvents();
  const link = kind && slug ? lumaHubIndex(events, kind).find((h) => h.slug === slug) : null;
  if (kind && slug && !link) return null;
  const mine = link ? events.filter((e) => (kind === "ciudad" ? e.metro === link.name : e.tags.includes(link.name))) : events;
  const { upcoming, past } = splitByEnd(mine);
  return {
    name: link?.name ?? null,
    upcoming,
    past: past.slice(pastPage * ARCHIVE_PAGE, (pastPage + 1) * ARCHIVE_PAGE),
    pastTotal: past.length,
  };
}

export async function upcomingEvents(limit: number): Promise<CalendarEvent[]> {
  if (hasDatabase()) {
    const rows = await getDb()
      .select()
      .from(canonicalEvents)
      .where(and(live, sql`${ends} >= ${nowTs()}`))
      .orderBy(asc(canonicalEvents.startAt))
      .limit(limit);
    return rows.map(rowToEvent);
  }
  return splitByEnd(await lumaEvents()).upcoming.slice(0, limit);
}

/** Event pages worth indexing, for the sitemap. */
export async function sitemapEvents(): Promise<{ slug: string; lastModified?: Date }[]> {
  if (hasDatabase()) {
    return getDb()
      .select({ slug: canonicalEvents.slug, lastModified: canonicalEvents.updatedAt })
      .from(canonicalEvents)
      .where(and(live, or(sql`${canonicalEvents.description} is not null`, eq(canonicalEvents.curated, true))))
      .orderBy(desc(canonicalEvents.startAt));
  }
  return (await lumaEvents()).map((e) => ({ slug: e.slug }));
}

/** Every listed event with coordinates, for the globe. */
export async function mappedEvents(): Promise<CalendarEvent[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .select()
    .from(canonicalEvents)
    .where(and(live, sql`${canonicalEvents.latitude} is not null`));
  return rows.map(rowToEvent);
}

// ---------- communities ----------

/** Listed by the source: a calendar, group or profile that organizes events. */
const fromSource = (sourceId: string) =>
  sql`exists (select 1 from ${eventSources} where ${eventSources.canonicalEventId} = ${canonicalEvents.id} and ${eventSources.sourceId} = ${sourceId})`;

/** Every source that organizes listed events, busiest first. The hack0 calendar is the aggregator itself, not a community. */
export const communityIndex = cache(async (): Promise<Community[]> => {
  if (!hasDatabase()) return [];
  const upcoming = sql`${ends} >= ${nowTs()}`;
  const rows = await getDb()
    .select({
      id: sources.id,
      name: sources.name,
      url: sources.url,
      count: sql<number>`count(distinct ${canonicalEvents.id})::int`,
      upcoming: sql<number>`(count(distinct ${canonicalEvents.id}) filter (where ${upcoming}))::int`,
      metros: sql<string[]>`array_remove(array_agg(${canonicalEvents.metro} order by ${canonicalEvents.startAt} desc), null)`,
    })
    .from(sources)
    .innerJoin(eventSources, eq(eventSources.sourceId, sources.id))
    .innerJoin(canonicalEvents, and(eq(canonicalEvents.id, eventSources.canonicalEventId), live))
    .where(and(ne(sources.kind, "event"), ne(sources.url, LUMA)))
    .groupBy(sources.id);
  const bySlug = new Map<string, Community>();
  for (const r of rows) {
    if (!r.name) continue;
    // Most frequent metros first, each once.
    const freq = new Map<string, number>();
    // "Online" is not a city; online-only communities group apart on /comunidades.
    for (const m of r.metros) if (m.toLowerCase() !== "online") freq.set(m, (freq.get(m) ?? 0) + 1);
    const metros = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
    const base = slugify(r.name);
    // Two sources with the same name keep separate pages.
    const slug = bySlug.has(base) ? `${base}-${r.id.slice(0, 6)}` : base;
    bySlug.set(slug, { slug, id: r.id, name: r.name, url: r.url, count: r.count, upcoming: r.upcoming, metros });
  }
  return [...bySlug.values()].sort((a, b) => b.upcoming - a.upcoming || b.count - a.count);
});

export async function communityEvents(slug: string, pastPage = 0) {
  const community = (await communityIndex()).find((c) => c.slug === slug);
  if (!community) return null;
  return { community, ...(await dbHubEvents(and(live, fromSource(community.id)) as SQL, pastPage)) };
}

/** The communities that list an event, for its page. */
export async function eventCommunities(slug: string): Promise<Community[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .selectDistinct({ id: eventSources.sourceId })
    .from(eventSources)
    .innerJoin(canonicalEvents, eq(canonicalEvents.id, eventSources.canonicalEventId))
    .where(eq(canonicalEvents.slug, slug));
  const ids = new Set(rows.map((r) => r.id));
  return (await communityIndex()).filter((c) => ids.has(c.id));
}
