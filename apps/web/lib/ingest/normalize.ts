import type { CanonicalEventDTO, SourceEventInput } from "@/lib/canonical/canonical-events";
import { canonicalizeEvents, canonicalKeyFor, eventIdentityFingerprint, sourceKeyFor } from "@/lib/canonical/canonical-events";
import { enrichEventForRouting } from "@/lib/canonical/event-routing-enrichment";
import { classifyEventTags } from "@/lib/canonical/event-tagging";
import type { PublicLumaEvent } from "./luma-public";
import type { ProviderEvent } from "./providers";

type SourceRef = { id: string; name: string | null; calendarId: string | null };

export function lumaInputs(events: PublicLumaEvent[], source: SourceRef, now = new Date().toISOString()): SourceEventInput[] {
  return events.flatMap((e) =>
    e.startAt
      ? [
          {
            sourceType: "calendar_scrape" as const,
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
export function normalizeBatch(inputs: SourceEventInput[]): NormalizedEvent[] {
  const canonical = canonicalizeEvents(inputs);
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
      fingerprint: first ? eventIdentityFingerprint(first) : event.id,
      tags,
    };
  });
}
