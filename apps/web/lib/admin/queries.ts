import { and, asc, count, desc, eq, gte, ilike, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { apiTokens, canonicalEvents, contentDrafts, eventSources, sources } from "@/lib/db/schema";

export type SourceView = "todas" | "error" | "pausadas";

/** Sources with their event count, filtered by name and by state. */
export async function sourcesOverview(opts: { q?: string; view?: SourceView } = {}) {
  const where = [
    opts.q ? ilike(sources.name, `%${opts.q.replace(/[%_]/g, "")}%`) : undefined,
    opts.view === "error" ? and(eq(sources.syncStatus, "failed"), eq(sources.syncEnabled, true)) : undefined,
    opts.view === "pausadas" ? eq(sources.syncEnabled, false) : undefined,
  ].filter((c): c is SQL => c !== undefined);
  return getDb()
    .select({
      id: sources.id,
      name: sources.name,
      url: sources.url,
      provider: sources.provider,
      kind: sources.kind,
      syncEnabled: sources.syncEnabled,
      scope: sources.scope,
      keyed: sql<boolean>`${sources.apiKeyCiphertext} is not null`,
      syncStatus: sources.syncStatus,
      syncError: sources.syncError,
      lastSyncedAt: sources.lastSyncedAt,
      events: count(eventSources.id),
    })
    .from(sources)
    .leftJoin(eventSources, eq(eventSources.sourceId, sources.id))
    .where(where.length ? and(...where) : undefined)
    .groupBy(sources.id)
    .orderBy(desc(sql`count(${eventSources.id})`), asc(sources.name));
}

/** Counts for the source tabs and the admin header. */
export async function adminCounts() {
  const [row] = await getDb()
    .select({
      sources: count(),
      failing: sql<number>`count(*) filter (where ${sources.syncStatus} = 'failed' and ${sources.syncEnabled})`.mapWith(Number),
      paused: sql<number>`count(*) filter (where not ${sources.syncEnabled})`.mapWith(Number),
    })
    .from(sources);
  const [events] = await getDb()
    .select({
      upcoming: count(),
      curated: sql<number>`count(*) filter (where ${canonicalEvents.curated})`.mapWith(Number),
    })
    .from(canonicalEvents)
    .where(and(eq(canonicalEvents.listed, true), eq(canonicalEvents.active, true), gte(canonicalEvents.startAt, new Date())));
  const [drafts] = await getDb().select({ open: count() }).from(contentDrafts).where(eq(contentDrafts.status, "draft"));
  return { ...(row ?? { sources: 0, failing: 0, paused: 0 }), ...(events ?? { upcoming: 0, curated: 0 }), drafts: drafts?.open ?? 0 };
}

export type CurationView = "todos" | "curados" | "pendientes";

/** Upcoming listed events for curation, soonest first. */
export async function eventsForReview(opts: { q?: string; view?: CurationView } = {}) {
  const where = [
    eq(canonicalEvents.listed, true),
    eq(canonicalEvents.active, true),
    gte(canonicalEvents.startAt, new Date()),
    opts.q ? ilike(canonicalEvents.name, `%${opts.q.replace(/[%_]/g, "")}%`) : undefined,
    opts.view === "curados" ? eq(canonicalEvents.curated, true) : undefined,
    opts.view === "pendientes" ? eq(canonicalEvents.curated, false) : undefined,
  ].filter((c): c is SQL => c !== undefined);
  return getDb()
    .select({
      id: canonicalEvents.id,
      name: canonicalEvents.name,
      slug: canonicalEvents.slug,
      url: canonicalEvents.url,
      coverUrl: canonicalEvents.coverUrl,
      startAt: canonicalEvents.startAt,
      timezone: canonicalEvents.timezone,
      metro: canonicalEvents.metro,
      countryCode: canonicalEvents.countryCode,
      isOnline: canonicalEvents.isOnline,
      languageCode: canonicalEvents.languageCode,
      curated: canonicalEvents.curated,
      hostName: canonicalEvents.hostName,
    })
    .from(canonicalEvents)
    .where(and(...where))
    .orderBy(asc(canonicalEvents.startAt))
    .limit(300);
}

export async function tokensOverview() {
  return getDb()
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      prefix: apiTokens.prefix,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .orderBy(desc(apiTokens.createdAt));
}

export async function openDrafts() {
  return getDb()
    .select({
      id: contentDrafts.id,
      kind: contentDrafts.kind,
      title: contentDrafts.title,
      body: contentDrafts.body,
      updatedAt: contentDrafts.updatedAt,
    })
    .from(contentDrafts)
    .where(eq(contentDrafts.status, "draft"))
    .orderBy(asc(contentDrafts.kind), desc(contentDrafts.updatedAt))
    .limit(50);
}
