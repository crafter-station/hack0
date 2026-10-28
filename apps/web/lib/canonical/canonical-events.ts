import { createHash } from "node:crypto";

export type EventProvider = "luma" | "eventbrite" | "meetup";
type EventSourceType =
  | "api"
  | "calendar_scrape"
  | "event_scrape"
  | "profile_scrape"
  | "eventbrite_api"
  | "eventbrite_public"
  | "meetup_api"
  | "meetup_public";

export type EventEnrichment = {
  languageCode?: string | null;
  languages?: string[];
  countryCode?: string | null;
  region?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOnline?: boolean | null;
  format?: string | null;
  topics?: string[];
  audience?: string[];
  level?: string | null;
  organizer?: string | null;
  confidence?: number | null;
  sources?: Record<string, string>;
};

type CanonicalTagDTO = {
  namespace: "format" | "topic" | "audience";
  slug: string;
  label: string;
  origin: "system" | "manual";
  state: "active" | "dismissed";
  confidence: number | null;
  taxonomyVersion: number;
};

export type CanonicalBaseEvent = {
  id: string;
  canonicalId?: string;
  name: string;
  coverUrl: string | null;
  url: string;
  startAt: string;
  endAt?: string;
  city?: string;
  description?: string;
  calendarId?: string;
  calendarName?: string;
  timezone?: string | null;
  enrichment?: EventEnrichment;
};

type CanonicalEventSourceDTO = {
  provider: EventProvider;
  sourceType: EventSourceType;
  sourceKey: string;
  calendarId: string | null;
  calendarName: string | null;
  sourceUrl: string;
  externalEventId: string | null;
  hostName: string | null;
  lastSyncedAt: string;
};

export type CanonicalEventDTO = CanonicalBaseEvent & {
  externalIds: {
    lumaEventId?: string;
    eventbriteEventId?: string;
    meetupEventId?: string;
    scrapedEventKeys: string[];
  };
  sources: CanonicalEventSourceDTO[];
  tags: string[];
  suggestedTags: string[];
  tagDetails?: CanonicalTagDTO[];
  timezone?: string | null;
  enrichment?: EventEnrichment;
};

export type SourceEventInput = {
  event: CanonicalBaseEvent;
  sourceType: EventSourceType;
  provider?: EventProvider;
  sourceKey?: string;
  calendarRowId?: string | null;
  calendarId?: string | null;
  calendarName?: string | null;
  sourceUrl?: string | null;
  externalEventId?: string | null;
  hostName?: string | null;
  payload?: Record<string, unknown>;
  lastSyncedAt?: string;
};

export function normalizeCanonicalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (url.hostname === "lu.ma") url.hostname = "luma.com";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return raw.trim() || null;
  }
}

function stableEventHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Resolves where an event happens, so same-name events at the same time in different cities stay apart. */
type PlaceOf = (input: SourceEventInput) => string | null;

export function eventIdentityFingerprint(input: SourceEventInput, placeOf?: PlaceOf): string {
  const normalizedName = input.event.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const start = Date.parse(input.event.startAt);
  const normalizedStart = Number.isFinite(start) ? new Date(Math.floor(start / 60_000) * 60_000).toISOString() : input.event.startAt.trim();
  const place = placeOf?.(input)?.toLowerCase() ?? "";
  return stableEventHash(`${normalizedName}|${normalizedStart}|${place}`);
}

export function canonicalKeyFor(input: SourceEventInput): string {
  const externalId = input.externalEventId ?? input.event.id;
  if (input.provider === "eventbrite" && externalId) return `eventbrite:${externalId}`;
  if (input.provider === "meetup" && externalId) return `meetup:${externalId}`;
  if (/^evt-/i.test(externalId)) return `luma:${externalId}`;
  const normalized = normalizeCanonicalUrl(input.sourceUrl ?? input.event.url);
  if (normalized) return `url:${normalized}`;
  const fallback = [input.event.name, input.event.startAt, input.hostName ?? input.event.city ?? ""].join("|").toLowerCase();
  return `hash:${stableEventHash(fallback)}`;
}

export function sourceKeyFor(input: SourceEventInput): string {
  if (input.sourceKey) return input.sourceKey;
  const calendar = input.calendarId ?? input.event.calendarId ?? "standalone";
  return [input.sourceType, calendar, input.externalEventId ?? input.event.id].join(":");
}

export function sourceDTO(input: SourceEventInput): CanonicalEventSourceDTO {
  return {
    provider: input.provider ?? "luma",
    sourceType: input.sourceType,
    sourceKey: sourceKeyFor(input),
    calendarId: input.calendarId ?? input.event.calendarId ?? null,
    calendarName: input.calendarName ?? input.event.calendarName ?? null,
    sourceUrl: normalizeCanonicalUrl(input.sourceUrl ?? input.event.url) ?? input.event.url,
    externalEventId: input.externalEventId ?? input.event.id ?? null,
    hostName: input.hostName ?? null,
    lastSyncedAt: input.lastSyncedAt ?? new Date().toISOString(),
  };
}

/** Fills gaps on `base` from `next`; the first sighting wins every field it already has. */
function preferEvent(base: CanonicalEventDTO, next: CanonicalBaseEvent): void {
  base.canonicalId ??= next.canonicalId;
  base.name ||= next.name;
  base.coverUrl ??= next.coverUrl;
  base.url ||= next.url;
  base.startAt ||= next.startAt;
  base.endAt ??= next.endAt;
  base.city ??= next.city;
  base.description ??= next.description;
  base.timezone ??= next.timezone;
  base.enrichment = { ...(next.enrichment ?? {}), ...(base.enrichment ?? {}) };
}

function lumaIdOf(input: SourceEventInput): string | undefined {
  const id = input.externalEventId ?? input.event.id;
  return /^evt-/i.test(id) ? id : undefined;
}

function aliasesFor(input: SourceEventInput, key: string, placeOf?: PlaceOf): string[] {
  const normalizedUrl = normalizeCanonicalUrl(input.sourceUrl ?? input.event.url);
  return [key, ...(normalizedUrl ? [`url:${normalizedUrl}`] : []), `fingerprint:${eventIdentityFingerprint(input, placeOf)}`];
}

function createCanonical(input: SourceEventInput, key: string): CanonicalEventDTO {
  const { event } = input;
  const externalId = input.externalEventId ?? event.id;
  return {
    ...event,
    id: lumaIdOf(input) ?? (event.id || stableEventHash(key)),
    externalIds: {
      lumaEventId: lumaIdOf(input),
      eventbriteEventId: input.provider === "eventbrite" ? externalId : undefined,
      meetupEventId: input.provider === "meetup" ? externalId : undefined,
      scrapedEventKeys: event.id.startsWith("scr-") ? [event.id] : [],
    },
    sources: [sourceDTO(input)],
    tags: [],
    suggestedTags: [],
  };
}

/** Adds a later sighting to an existing event in place, so every alias keeps pointing at it. */
function mergeSighting(target: CanonicalEventDTO, input: SourceEventInput): void {
  const { event } = input;
  const externalId = input.externalEventId ?? event.id;
  preferEvent(target, event);
  const ids = target.externalIds;
  ids.lumaEventId = lumaIdOf(input) ?? ids.lumaEventId;
  if (input.provider === "eventbrite") ids.eventbriteEventId = externalId;
  if (input.provider === "meetup") ids.meetupEventId = externalId;
  if (event.id.startsWith("scr-") && !ids.scrapedEventKeys.includes(event.id)) ids.scrapedEventKeys.push(event.id);
  const source = sourceDTO(input);
  if (!target.sources.some((s) => s.sourceType === source.sourceType && s.sourceKey === source.sourceKey)) {
    target.sources.push(source);
  }
}

export function canonicalizeEvents(inputs: SourceEventInput[], placeOf?: PlaceOf): CanonicalEventDTO[] {
  const byAlias = new Map<string, CanonicalEventDTO>();
  const output: CanonicalEventDTO[] = [];
  for (const input of inputs) {
    const key = canonicalKeyFor(input);
    const aliases = aliasesFor(input, key, placeOf);
    const existing = aliases.map((alias) => byAlias.get(alias)).find(Boolean);
    const target = existing ?? createCanonical(input, key);
    if (existing) mergeSighting(existing, input);
    else output.push(target);
    for (const alias of aliases) byAlias.set(alias, target);
  }
  return output;
}
