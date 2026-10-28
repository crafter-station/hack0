import { and, asc, count, desc, eq, gt, gte, inArray, lte, or, type SQL, sql } from "drizzle-orm";
import { eventDurationMinutes, eventTemporalStatus } from "@/lib/canonical/event-time";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";

type EventRow = typeof canonicalEvents.$inferSelect;
type SourceRow = typeof eventSources.$inferSelect;

type EventQuery = {
  calendar?: string;
  provider?: "luma" | "eventbrite" | "meetup";
  status?: "all" | "upcoming" | "past";
  from?: Date;
  to?: Date;
  country?: string;
  curated?: boolean;
  limit: number;
  offset: number;
};

const LIMIT_MAX = 200;

/** Parses the documented query string; unknown values fall back to the defaults. */
export function parseEventQuery(params: URLSearchParams): EventQuery {
  const date = (key: string) => {
    const v = params.get(key);
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : undefined;
  };
  const provider = params.get("provider");
  const status = params.get("status");
  const limit = Number(params.get("limit") ?? 100);
  const cursor = params.get("cursor");
  const offset = cursor ? Number(Buffer.from(cursor, "base64url").toString()) : 0;
  return {
    calendar: params.get("calendar") && params.get("calendar") !== "all" ? (params.get("calendar") ?? undefined) : undefined,
    provider: provider === "luma" || provider === "eventbrite" || provider === "meetup" ? provider : undefined,
    status: status === "upcoming" || status === "past" ? status : "all",
    from: date("from"),
    to: date("to"),
    country: params.get("country")?.toUpperCase() || undefined,
    curated: params.has("curated") ? params.get("curated") === "true" : undefined,
    limit: Number.isInteger(limit) ? Math.min(Math.max(limit, 1), LIMIT_MAX) : 100,
    offset: Number.isInteger(offset) && offset > 0 ? offset : 0,
  };
}

function filters(q: EventQuery, now: Date): SQL[] {
  // Events every source dropped (cancelled or deleted upstream) are not served.
  const where: SQL[] = [eq(canonicalEvents.active, true)];
  const ends = sql`coalesce(${canonicalEvents.endAt}, ${canonicalEvents.startAt})`;
  // Raw SQL has no column type to encode a Date with, so the instant goes in as an ISO timestamp.
  const at = sql`${now.toISOString()}::timestamptz`;
  if (q.status === "upcoming") where.push(sql`${ends} >= ${at}`);
  if (q.status === "past") where.push(sql`${ends} < ${at}`);
  if (q.from) where.push(gte(canonicalEvents.startAt, q.from));
  if (q.to) where.push(lte(canonicalEvents.startAt, q.to));
  if (q.country) where.push(eq(canonicalEvents.countryCode, q.country));
  if (q.curated !== undefined) where.push(eq(canonicalEvents.curated, q.curated));
  const bySource = [
    q.provider ? eq(eventSources.provider, q.provider) : undefined,
    q.calendar ? eq(eventSources.sourceId, q.calendar) : undefined,
  ].filter((c): c is SQL => c !== undefined);
  if (bySource.length > 0) {
    const ids = getDb()
      .select({ id: eventSources.canonicalEventId })
      .from(eventSources)
      .where(and(...bySource));
    where.push(inArray(canonicalEvents.id, ids));
  }
  return where;
}

function eventDto(row: EventRow, sightings: SourceRow[], now: Date) {
  const timed = { startAt: row.startAt.toISOString(), endAt: row.endAt?.toISOString() };
  return {
    id: row.lumaEventId ?? row.id,
    canonicalId: row.id,
    name: row.name,
    coverUrl: row.coverUrl,
    url: row.url,
    startAt: timed.startAt,
    endAt: timed.endAt ?? null,
    temporalStatus: eventTemporalStatus(timed, now.getTime()),
    durationMinutes: eventDurationMinutes(timed),
    city: row.city,
    countryCode: row.countryCode,
    languageCode: row.languageCode,
    isOnline: row.isOnline,
    description: row.description,
    externalIds: row.externalIds,
    sources: sightings.map((s) => ({
      provider: s.provider,
      sourceType: s.sourceType,
      sourceKey: s.sourceKey,
      calendarId: s.sourceId,
      calendarName: s.calendarName,
      sourceUrl: s.sourceUrl,
      externalEventId: s.externalEventId,
      hostName: s.hostName,
      lastSyncedAt: s.lastSyncedAt.toISOString(),
    })),
    sourceCount: sightings.length,
    tags: row.tags,
    curated: row.curated,
  };
}

async function sightingsFor(ids: string[]) {
  if (ids.length === 0) return new Map<string, SourceRow[]>();
  const rows = await getDb().select().from(eventSources).where(inArray(eventSources.canonicalEventId, ids));
  const byEvent = new Map<string, SourceRow[]>();
  for (const r of rows) byEvent.set(r.canonicalEventId, [...(byEvent.get(r.canonicalEventId) ?? []), r]);
  return byEvent;
}

export async function listEvents(q: EventQuery, now = new Date()) {
  const where = and(...filters(q, now));
  const order = q.status === "past" ? desc(canonicalEvents.startAt) : asc(canonicalEvents.startAt);
  const [rows, [total]] = await Promise.all([
    getDb().select().from(canonicalEvents).where(where).orderBy(order).limit(q.limit).offset(q.offset),
    getDb().select({ n: count() }).from(canonicalEvents).where(where),
  ]);
  const sightings = await sightingsFor(rows.map((r) => r.id));
  const next = q.offset + rows.length;
  return {
    events: rows.map((r) => eventDto(r, sightings.get(r.id) ?? [], now)),
    page: {
      limit: q.limit,
      offset: q.offset,
      total: total?.n ?? 0,
      nextCursor: next < (total?.n ?? 0) ? Buffer.from(String(next)).toString("base64url") : null,
    },
    generatedAt: now.toISOString(),
  };
}

/** One event by canonical id (uuid) or Luma event id. */
export async function getEvent(id: string, now = new Date()) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const [row] = await getDb()
    .select()
    .from(canonicalEvents)
    .where(isUuid ? or(eq(canonicalEvents.id, id), eq(canonicalEvents.lumaEventId, id)) : eq(canonicalEvents.lumaEventId, id))
    .limit(1);
  if (!row) return null;
  return eventDto(row, (await sightingsFor([row.id])).get(row.id) ?? [], now);
}

export async function listCalendars() {
  const rows = await getDb()
    .select({
      id: sources.id,
      provider: sources.provider,
      kind: sources.kind,
      name: sources.name,
      url: sources.url,
      syncStatus: sources.syncStatus,
      lastSyncedAt: sources.lastSyncedAt,
      eventCount: count(eventSources.id),
    })
    .from(sources)
    .leftJoin(eventSources, eq(eventSources.sourceId, sources.id))
    .where(eq(sources.syncEnabled, true))
    .groupBy(sources.id)
    .orderBy(asc(sources.name));
  return rows.map((r) => ({ ...r, lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null }));
}

const CSV_COLUMNS = ["id", "name", "startAt", "endAt", "city", "countryCode", "languageCode", "url", "sourceCount", "tags"] as const;

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(" ") : value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Every event matching the query, walking pages of the documented maximum size. */
export async function exportEvents(q: EventQuery, format: "csv" | "json") {
  const all: ReturnType<typeof eventDto>[] = [];
  for (let offset = 0; ; offset += LIMIT_MAX) {
    const page = await listEvents({ ...q, limit: LIMIT_MAX, offset });
    all.push(...page.events);
    if (!page.page.nextCursor) break;
  }
  if (format === "json") return JSON.stringify(all, null, 2);
  const rows = all.map((e) => CSV_COLUMNS.map((c) => csvCell(e[c])).join(","));
  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}

const CHANGES_MAX = 500;

/**
 * Everything that changed after `since`, in order, for consumers that keep a copy: live events as upserts,
 * events every source dropped as delete tombstones. `nextCursor` is the `since` of the next call.
 */
export async function listChanges(since: number, limit = CHANGES_MAX, now = new Date()) {
  const size = Math.min(Math.max(Math.trunc(limit) || CHANGES_MAX, 1), CHANGES_MAX);
  const rows = await getDb()
    .select()
    .from(canonicalEvents)
    .where(gt(canonicalEvents.changeSeq, since))
    .orderBy(asc(canonicalEvents.changeSeq))
    .limit(size + 1);
  const page = rows.slice(0, size);
  const changedAt = (row: EventRow) => row.updatedAt.toISOString();
  return {
    upserts: page
      .filter((row) => row.active)
      .map((row) => ({
        canonicalId: row.id,
        name: row.name,
        url: row.url,
        coverUrl: row.coverUrl,
        startAt: row.startAt.toISOString(),
        endAt: row.endAt?.toISOString() ?? null,
        city: row.city,
        description: row.description,
        hostName: row.hostName,
        timezone: row.timezone,
        enrichment: row.enrichment,
        externalIds: row.externalIds,
        updatedAt: changedAt(row),
        changedAt: changedAt(row),
      })),
    deletes: page.filter((row) => !row.active).map((row) => ({ canonicalId: row.id, changedAt: changedAt(row) })),
    nextCursor: String(page.at(-1)?.changeSeq ?? since),
    hasMore: rows.length > size,
    generatedAt: now.toISOString(),
  };
}
