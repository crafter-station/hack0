import type { CanonicalEventDTO, EventEnrichment, SourceEventInput } from "@/lib/canonical/canonical-events";
import { canonicalizeEvents, canonicalKeyFor, eventIdentityFingerprint, sourceKeyFor } from "@/lib/canonical/canonical-events";
import { enrichEventForRouting } from "@/lib/canonical/event-routing-enrichment";
import { classifyEventTags } from "@/lib/canonical/event-tagging";
import { eventMetro } from "@/lib/page-keys";
import type { PublicLumaEvent } from "./luma-public";
import type { ProviderEvent } from "./providers";

export type SourceRef = { id: string; name: string | null; calendarId: string | null };

/** Provider facts a public Luma page carries; unknown ones stay out so routing can still infer them. */
function lumaEnrichment(e: PublicLumaEvent) {
  const known = {
    countryCode: e.countryCode,
    region: e.region,
    venueAddress: e.venueAddress,
    latitude: e.latitude,
    longitude: e.longitude,
    isOnline: e.isOnline,
  };
  const enrichment = Object.fromEntries(Object.entries(known).filter(([, v]) => v !== null && v !== undefined));
  if (Object.keys(enrichment).length === 0) return undefined;
  const sources: Record<string, string> = e.countryCode ? { countryCode: "provider" } : {};
  return { ...enrichment, sources } as EventEnrichment;
}

export function lumaInputs(
  events: PublicLumaEvent[],
  source: SourceRef,
  now = new Date().toISOString(),
  sourceType: "calendar_scrape" | "profile_scrape" | "event_scrape" = "calendar_scrape",
): SourceEventInput[] {
  return events.flatMap((e) =>
    e.startAt
      ? [
          {
            sourceType,
            provider: "luma" as const,
            calendarRowId: source.id,
            calendarId: source.calendarId,
            calendarName: source.name,
            externalEventId: e.apiId,
            sourceUrl: e.url,
            hostName: e.hostNames[0] ?? null,
            lastSyncedAt: now,
            payload: { hostNames: e.hostNames },
            event: {
              id: e.apiId,
              name: e.name,
              url: e.url,
              coverUrl: e.coverUrl,
              startAt: e.startAt,
              endAt: e.endAt ?? undefined,
              city: e.city ?? undefined,
              description: e.description ?? undefined,
              timezone: e.timezone ?? null,
              enrichment: lumaEnrichment(e),
              calendarId: source.calendarId ?? undefined,
              calendarName: source.name ?? undefined,
            },
          },
        ]
      : [],
  );
}

/** Meetup and Eventbrite sightings, already in the canonical event shape. */
export function providerInputs(
  events: ProviderEvent[],
  provider: "meetup" | "eventbrite",
  source: SourceRef,
  now = new Date().toISOString(),
): SourceEventInput[] {
  return events.map((e) => ({
    sourceType: provider === "meetup" ? ("meetup_public" as const) : ("eventbrite_public" as const),
    provider,
    calendarRowId: source.id,
    calendarId: source.id,
    calendarName: source.name,
    externalEventId: e.externalId,
    sourceUrl: e.event.url,
    hostName: e.hostName,
    lastSyncedAt: now,
    payload: e.payload,
    event: { ...e.event, calendarId: source.id, calendarName: source.name ?? undefined },
  }));
}

export type NormalizedEvent = {
  event: CanonicalEventDTO;
  inputs: SourceEventInput[];
  canonicalKey: string;
  fingerprint: string;
  tags: string[];
};

/** Dedupes one batch, then enriches and tags each canonical event with the calendars that list it. */
/** Metro of the event's city, so "Barranco, Lima" on Luma and "Lima" on Eventbrite match. */
const placeOf = (input: SourceEventInput) => eventMetro(input.event.city, input.event.enrichment?.region);

export function normalizeBatch(inputs: SourceEventInput[]): NormalizedEvent[] {
  const canonical = canonicalizeEvents(inputs, placeOf);
  return canonical.map((event) => {
    const mine = inputs.filter((input) => event.sources.some((s) => s.sourceKey === sourceKeyFor(input)));
    const first = mine[0] ?? inputs[0];
    const calendarNames = [...new Set(event.sources.map((s) => s.calendarName).filter((n): n is string => Boolean(n)))];
    const enrichment = enrichEventForRouting({ event, calendarNames });
    const tags = classifyEventTags({
      name: event.name,
      description: event.description,
      format: enrichment.format,
      isOnline: enrichment.isOnline,
    }).map((t) => t.slug);
    return {
      event: { ...event, enrichment },
      inputs: mine,
      canonicalKey: first ? canonicalKeyFor(first) : `luma:${event.id}`,
      fingerprint: first ? eventIdentityFingerprint(first, placeOf) : event.id,
      tags,
    };
  });
}
