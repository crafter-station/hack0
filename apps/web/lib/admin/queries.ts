import { and, asc, count, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, eventSources, sources } from "@/lib/db/schema";

/** Every source with how many catalog events it contributes. */
export async function sourcesOverview() {
  return getDb()
    .select({
      id: sources.id,
      name: sources.name,
      url: sources.url,
      syncEnabled: sources.syncEnabled,
      syncStatus: sources.syncStatus,
      syncError: sources.syncError,
      lastSyncedAt: sources.lastSyncedAt,
      nextSyncAt: sources.nextSyncAt,
      events: count(eventSources.id),
    })
    .from(sources)
    .leftJoin(eventSources, eq(eventSources.sourceId, sources.id))
    .groupBy(sources.id)
    .orderBy(desc(sql`count(${eventSources.id})`), asc(sources.name));
}

/** Upcoming events for curation, newest sightings first when no query is given. */
export async function eventsForReview(q: string | undefined) {
  const upcoming = gte(canonicalEvents.startAt, new Date());
  return getDb()
    .select({
      id: canonicalEvents.id,
      name: canonicalEvents.name,
      url: canonicalEvents.url,
      startAt: canonicalEvents.startAt,
      city: canonicalEvents.city,
      countryCode: canonicalEvents.countryCode,
      languageCode: canonicalEvents.languageCode,
      curated: canonicalEvents.curated,
    })
    .from(canonicalEvents)
    .where(q ? and(upcoming, ilike(canonicalEvents.name, `%${q}%`)) : upcoming)
    .orderBy(asc(canonicalEvents.startAt))
    .limit(200);
}
