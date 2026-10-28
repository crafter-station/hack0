import type { CanonicalBaseEvent, EventProvider } from "@/lib/canonical/canonical-events";
import { providerEventId } from "@/lib/canonical/event-providers";
import { inferRoutingCountryCode } from "@/lib/canonical/event-routing-enrichment";

export type ProviderEvent = {
  event: CanonicalBaseEvent;
  externalId: string;
  hostName: string | null;
  payload: Record<string, unknown>;
};

type ProviderSnapshot = {
  name: string;
  events: ProviderEvent[];
  avatarUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  complete: boolean;
  discoveredCount?: number;
  readableCount?: number;
  truncated?: boolean;
  warnings?: string[];
  cancelledCount?: number;
  unreadableCount?: number;
  imageSource?: "meetup" | "link_preview" | "favicon" | "event_fallback";
  previewImageUrl?: string | null;
  logoUrl?: string | null;
  sourceMethod?: "provider_api" | "provider_public_graphql" | "public_jsonld" | "firecrawl" | "hybrid";
};

type ProviderSyncScope = { kind: "full" } | { kind: "maintenance"; after: string };

function providerCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : inferRoutingCountryCode(value);
}

function meetupPhoto(raw?: { id?: string; baseUrl?: string } | null): string | null {
  return raw?.id && raw.baseUrl ? `${raw.baseUrl}${raw.id}/676x380.webp` : null;
}

type MeetupEventNode = {
  id: string;
  title: string;
  eventUrl: string;
  description?: string;
  dateTime: string;
  duration?: string;
  eventHosts?: Array<{ name?: string }>;
  featuredEventPhoto?: { id?: string; baseUrl?: string };
  group?: { id?: string; name?: string; urlname?: string; timezone?: string | null };
  venue?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  } | null;
};

const MEETUP_PUBLIC_GRAPHQL = "https://www.meetup.com/gql2";
const MEETUP_PUBLIC_PAGE_SIZE = 50;
// Keep a safety stop for a broken cursor, but do not impose a practical
// historical cap on large groups (50 events per page, up to 50k events).
const MEETUP_PUBLIC_MAX_PAGES = 1000;

type MeetupPublicEventNode = MeetupEventNode & {
  endTime?: string;
  status?: string;
  venue?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  } | null;
};

type MeetupPublicPage = {
  data?: {
    groupByUrlname?: {
      id: string;
      name: string;
      description?: string;
      keyGroupPhoto?: { id?: string; baseUrl?: string; highResUrl?: string };
      events?: {
        totalCount: number;
        pageInfo?: { endCursor?: string; hasNextPage?: boolean };
        edges?: Array<{ node: MeetupPublicEventNode }>;
      };
    } | null;
  };
  errors?: Array<{ message?: string; extensions?: { code?: string } }>;
};

function meetupPublicPhoto(raw?: { id?: string; baseUrl?: string; highResUrl?: string } | null): string | null {
  return raw?.highResUrl ?? meetupPhoto(raw);
}

function meetupPublicProviderEvent(event: MeetupPublicEventNode): ProviderEvent | null {
  if (event.status === "CANCELLED" || !event.id || !event.title || !event.eventUrl || !event.dateTime) {
    return null;
  }
  const city = [event.venue?.city, event.venue?.state]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
  return {
    event: {
      id: event.id,
      name: event.title,
      coverUrl: meetupPublicPhoto(event.featuredEventPhoto),
      url: event.eventUrl,
      startAt: event.dateTime,
      endAt: event.endTime,
      timezone: event.group?.timezone ?? null,
      city: city || undefined,
      description: event.description,
      enrichment: {
        countryCode: providerCountryCode(event.venue?.country),
        region: event.venue?.state ?? event.venue?.city ?? null,
        venueName: event.venue?.name ?? null,
        isOnline: typeof event.venue?.name === "string" ? /online|virtual/i.test(event.venue.name) : null,
        organizer: event.eventHosts?.[0]?.name ?? null,
        confidence: event.venue ? 1 : null,
        sources: event.venue
          ? {
              countryCode: "meetup_public_graphql",
              venueName: "meetup_public_graphql",
              isOnline: "meetup_public_graphql",
            }
          : {},
      },
    },
    externalId: event.id,
    hostName: event.eventHosts?.[0]?.name ?? null,
    payload: {
      source: "meetup-public-graphql",
      status: event.status ?? null,
      groupId: event.group?.id ?? null,
      groupUrlname: event.group?.urlname ?? null,
      venue: event.venue ?? null,
    },
  };
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(seconds)) return Math.min(30_000, Math.max(0, seconds * 1000));
  return Math.min(5_000, 500 * 2 ** attempt);
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMeetupPublicGraphql(query: string, variables: Record<string, unknown>): Promise<MeetupPublicPage> {
  let lastError = "Meetup public request failed";
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(MEETUP_PUBLIC_GRAPHQL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; LumaCard/1.0; +https://luma-card.lovable.app)",
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = (await response.json().catch(() => null)) as MeetupPublicPage | null;
    const rateLimited = body?.errors?.some((error) => error.extensions?.code === "RATE_LIMITED");
    if (response.ok && body?.data && !body.errors?.length) return body;
    lastError = body?.errors?.[0]?.message ?? `Meetup public request failed (${response.status})`;
    if (attempt === 2 || (!rateLimited && response.status !== 429 && response.status < 500)) {
      break;
    }
    await wait(retryDelayMs(response, attempt));
  }
  throw new Error(lastError);
}

function meetupPublicEventsQuery(sort: "ASC" | "DESC"): string {
  return `
  query PublicGroupEvents(
    $urlname: String!
    $after: String
    $afterDateTime: DateTime
    $beforeDateTime: DateTime
  ) {
    groupByUrlname(urlname: $urlname) {
      id
      name
      description
      keyGroupPhoto { id baseUrl highResUrl }
      events(
        filter: {
          status: [ACTIVE, PAST]
          afterDateTime: $afterDateTime
          beforeDateTime: $beforeDateTime
        }
        sort: ${sort}
        first: ${MEETUP_PUBLIC_PAGE_SIZE}
        after: $after
      ) {
        totalCount
        pageInfo { endCursor hasNextPage }
        edges {
          node {
            id
            title
            eventUrl
            description
            dateTime
            endTime
            status
            eventHosts { memberId name }
            featuredEventPhoto { id baseUrl highResUrl }
            venue { name city state country }
            group { id name urlname timezone }
          }
        }
      }
    }
  }
`;
}

type MeetupPublicCollection = {
  events: ProviderEvent[];
  totalCount: number;
  cancelledCount: number;
  unreadableCount: number;
  exhausted: boolean;
  name: string;
  description: string | null;
  photo: string | null;
};

/** Adds readable events to `into`; counts the cancelled and unreadable ones. */
function tallyEdges(edges: { node: MeetupPublicEventNode }[], into: ProviderEvent[]) {
  let cancelled = 0;
  let unreadable = 0;
  for (const { node } of edges) {
    if (node.status === "CANCELLED") {
      cancelled++;
      continue;
    }
    const event = meetupPublicProviderEvent(node);
    if (event) into.push(event);
    else unreadable++;
  }
  return { cancelled, unreadable };
}

async function fetchMeetupPublicCollection(
  urlname: string,
  boundary: { afterDateTime?: string; beforeDateTime?: string; sort: "ASC" | "DESC" },
  limit: number | null,
): Promise<MeetupPublicCollection> {
  const events: ProviderEvent[] = [];
  let cursor: string | null = null;
  let totalCount = 0;
  let name = urlname;
  let description: string | null = null;
  let photo: string | null = null;
  let exhausted = false;
  let cancelledCount = 0;
  let unreadableCount = 0;

  for (let page = 0; page < MEETUP_PUBLIC_MAX_PAGES; page++) {
    const body = await fetchMeetupPublicGraphql(meetupPublicEventsQuery(boundary.sort), {
      urlname,
      after: cursor,
      afterDateTime: boundary.afterDateTime ?? null,
      beforeDateTime: boundary.beforeDateTime ?? null,
    });
    const group = body.data?.groupByUrlname;
    if (!group) throw new Error("Meetup group was not found or is not publicly accessible");
    name = group.name;
    description = group.description ?? null;
    photo = meetupPublicPhoto(group.keyGroupPhoto);
    const connection = group.events;
    if (!connection) throw new Error("Meetup did not return the group event collection");
    totalCount = connection.totalCount;
    const tally = tallyEdges(connection.edges ?? [], events);
    cancelledCount += tally.cancelled;
    unreadableCount += tally.unreadable;
    if (limit !== null && events.length >= limit) break;
    if (!connection.pageInfo?.hasNextPage || !connection.pageInfo.endCursor) {
      exhausted = true;
      break;
    }
    cursor = connection.pageInfo.endCursor;
  }

  return {
    events: limit === null ? events : events.slice(0, limit),
    totalCount,
    cancelledCount,
    unreadableCount,
    exhausted,
    name,
    description,
    photo,
  };
}

export async function fetchPublicMeetupGroupSnapshot(
  sourceUrl: string,
  limit: number | null,
  scope: ProviderSyncScope,
): Promise<ProviderSnapshot> {
  const urlname = new URL(sourceUrl).pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!urlname) throw new Error("Meetup group URL is required");
  const now = new Date().toISOString();
  const collections =
    scope.kind === "full"
      ? await Promise.all([
          fetchMeetupPublicCollection(urlname, { afterDateTime: now, sort: "ASC" }, limit),
          fetchMeetupPublicCollection(urlname, { beforeDateTime: now, sort: "DESC" }, limit),
        ])
      : [await fetchMeetupPublicCollection(urlname, { afterDateTime: scope.after, sort: "ASC" }, limit)];
  const unique = [...new Map(collections.flatMap((collection) => collection.events).map((event) => [event.externalId, event])).values()];
  const discoveredCount = collections.reduce((sum, collection) => sum + collection.totalCount, 0);
  const truncated = limit !== null && discoveredCount > limit;
  const unreadableCount = collections.reduce((sum, collection) => sum + collection.unreadableCount, 0);
  const complete = collections.every((collection) => collection.exhausted) && !truncated && unreadableCount === 0;
  const primary = collections[0];
  return {
    name: primary?.name ?? urlname,
    events: limit === null ? unique : unique.slice(0, limit),
    avatarUrl: primary?.photo ?? null,
    coverUrl: primary?.photo ?? null,
    description: primary?.description ?? null,
    complete,
    discoveredCount,
    readableCount: unique.length,
    cancelledCount: collections.reduce((sum, collection) => sum + collection.cancelledCount, 0),
    unreadableCount,
    truncated,
    warnings: [
      ...(!complete ? ["Meetup pagination did not reconcile with the reported total"] : []),
      ...(unreadableCount > 0 ? [`${unreadableCount} Meetup events could not be read`] : []),
      ...(truncated ? [`Discovery reached the ${limit}-event limit`] : []),
    ],
    sourceMethod: "provider_public_graphql",
  };
}

async function enrichSnapshotBranding(sourceUrl: string, snapshot: ProviderSnapshot): Promise<ProviderSnapshot> {
  // Provider branding wins. Only ask the link-preview service when the
  // provider did not return an image; this keeps normal Meetup pagination
  // cheap and makes the fallback deterministic.
  if (snapshot.avatarUrl && snapshot.coverUrl) return snapshot;
  const { firecrawlScrapeSource, hasFirecrawl } = await import("./firecrawl");
  if (!hasFirecrawl()) return snapshot;
  const branding = await firecrawlScrapeSource(sourceUrl);
  const avatarUrl = snapshot.avatarUrl ?? branding.avatarUrl ?? branding.coverUrl ?? null;
  const coverUrl = snapshot.coverUrl ?? branding.coverUrl ?? branding.avatarUrl ?? null;
  if (!avatarUrl && !coverUrl) return snapshot;
  return {
    ...snapshot,
    avatarUrl,
    coverUrl,
    logoUrl: branding.avatarUrl,
    previewImageUrl: branding.coverUrl,
    imageSource: snapshot.avatarUrl || snapshot.coverUrl ? "meetup" : branding.avatarUrl ? "link_preview" : "favicon",
    sourceMethod: snapshot.sourceMethod === "provider_public_graphql" ? "hybrid" : snapshot.sourceMethod,
  };
}

function jsonLdEvents(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.flatMap(jsonLdEvents);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (record["@type"] === "Event" || (Array.isArray(record["@type"]) && record["@type"].includes("Event"))) {
    return [record];
  }
  return record["@graph"] ? jsonLdEvents(record["@graph"]) : [];
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);
const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

function jsonLdOnline(raw: Record<string, unknown>, location: Record<string, unknown> | null, address: Record<string, unknown> | null) {
  const signal =
    /online/i.test(str(raw.eventAttendanceMode) ?? "") ||
    /virtuallocation/i.test(str(location?.["@type"]) ?? "") ||
    /online|virtual/i.test(str(location?.name) ?? "");
  if (signal) return true;
  return address || location ? false : null;
}

function publicJsonLdEvent(
  provider: Exclude<EventProvider, "luma">,
  raw: Record<string, unknown>,
  fallbackUrl: string,
): ProviderEvent | null {
  const startAt = str(raw.startDate);
  const name = str(raw.name);
  if (!startAt || !name) return null;
  const location = obj(raw.location);
  const address = obj(location?.address);
  const organizerName = str(obj(raw.organizer)?.name);
  const country = obj(address?.addressCountry)?.name ?? address?.addressCountry;
  const isOnline = jsonLdOnline(raw, location, address);
  const language = str(first(raw.inLanguage));
  const locality = str(address?.addressLocality);
  const venueName = str(location?.name);
  const externalId = providerEventId(provider, fallbackUrl) ?? String(raw.identifier ?? raw.url ?? fallbackUrl);
  return {
    event: {
      id: `${provider}-${externalId}`,
      name,
      coverUrl: str(first(raw.image)),
      url: str(raw.url) ?? fallbackUrl,
      startAt,
      endAt: str(raw.endDate) ?? undefined,
      city: locality ?? venueName ?? undefined,
      description: str(raw.description) ?? undefined,
      enrichment: {
        countryCode: providerCountryCode(country),
        languageCode: language?.toLowerCase() ?? null,
        region: str(address?.addressRegion) ?? locality,
        venueName,
        venueAddress: str(address?.streetAddress),
        isOnline,
        format: isOnline === null ? null : isOnline ? "online" : "in_person",
        organizer: organizerName,
        confidence: 0.95,
        sources: {
          countryCode: "provider_jsonld",
          languageCode: "provider_jsonld",
          venueName: "provider_jsonld",
          isOnline: "provider_jsonld",
        },
      },
    },
    externalId,
    hostName: organizerName,
    payload: { source: `${provider}-public-jsonld` },
  };
}

export async function fetchPublicProviderEvent(provider: Exclude<EventProvider, "luma">, eventUrl: string): Promise<ProviderEvent> {
  const response = await fetch(eventUrl, {
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0" },
    redirect: "follow",
  });
  if (response.ok) {
    const html = await response.text();
    for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        for (const raw of jsonLdEvents(JSON.parse(match[1]))) {
          const event = publicJsonLdEvent(provider, raw, eventUrl);
          if (event) return event;
        }
      } catch {
        // Try the next JSON-LD block.
      }
    }
  }
  const { firecrawlScrapeEvent, hasFirecrawl } = await import("./firecrawl");
  if (!hasFirecrawl()) {
    throw new Error(`Couldn't read this ${provider} event and Firecrawl is not configured`);
  }
  const scraped = await firecrawlScrapeEvent(eventUrl);
  if (!scraped?.startAt) throw new Error(`Couldn't read this ${provider} event`);
  const externalId = providerEventId(provider, eventUrl) ?? eventUrl;
  return {
    event: {
      id: `${provider}-${externalId}`,
      name: scraped.name,
      coverUrl: scraped.coverUrl,
      url: eventUrl,
      startAt: scraped.startAt,
      endAt: scraped.endAt ?? undefined,
      city: scraped.city ?? undefined,
      description: scraped.description ?? undefined,
      enrichment: scraped.enrichment,
    },
    externalId,
    hostName: scraped.hostName,
    payload: {
      source: `${provider}-public-firecrawl`,
      branding: scraped.branding,
      enrichment: scraped.enrichment,
    },
  };
}

async function readPublicEvents(provider: Exclude<EventProvider, "luma">, urls: string[], after: string | undefined) {
  const events: ProviderEvent[] = [];
  let readable = 0;
  for (let offset = 0; offset < urls.length; offset += 5) {
    const batch = await Promise.all(
      urls.slice(offset, offset + 5).map((url) =>
        fetchPublicProviderEvent(provider, url).catch((error) => {
          console.warn(`[${provider}] public event skipped`, error);
          return null;
        }),
      ),
    );
    const ok = batch.filter((event): event is ProviderEvent => event !== null);
    readable += ok.length;
    events.push(...ok.filter(({ event }) => !after || Date.parse(event.startAt) >= Date.parse(after)));
  }
  return { events, readable };
}

function sourceMethodOf(events: ProviderEvent[]): ProviderSnapshot["sourceMethod"] {
  const via = (suffix: string) => events.some(({ payload }) => String(payload.source ?? "").endsWith(suffix));
  const jsonLd = via("-public-jsonld");
  if (jsonLd && via("-public-firecrawl")) return "hybrid";
  return jsonLd ? "public_jsonld" : "firecrawl";
}

function snapshotWarnings(unreadable: number, limitReached: boolean, fallbackLimit: number, meetupError: Error | null) {
  return [
    ...(unreadable > 0 ? [`${unreadable} discovered events could not be read`] : []),
    ...(limitReached ? [`Discovery reached the ${fallbackLimit}-event fallback limit`] : []),
    ...(meetupError
      ? [`Meetup public pagination failed (${meetupError.message}); Firecrawl fallback cannot certify complete history`]
      : []),
  ];
}

/** Meetup groups read the public GraphQL feed; anything else, or a failed feed, falls back to Firecrawl discovery. */
async function tryMeetupFeed(
  provider: Exclude<EventProvider, "luma">,
  sourceUrl: string,
  eventId: string | null,
  limit: number | null,
  after?: string,
) {
  if (provider !== "meetup" || eventId) return { snapshot: null, error: null };
  try {
    const snapshot = await fetchPublicMeetupGroupSnapshot(sourceUrl, limit, after ? { kind: "maintenance", after } : { kind: "full" });
    return { snapshot: await enrichSnapshotBranding(sourceUrl, snapshot), error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn("[meetup] public GraphQL failed; trying Firecrawl", err.message);
    return { snapshot: null, error: err };
  }
}

export async function fetchPublicProviderSnapshot(
  provider: Exclude<EventProvider, "luma">,
  sourceUrl: string,
  limit: number | null,
  options: { skipUrls?: string[]; after?: string } = {},
): Promise<ProviderSnapshot> {
  const eventId = providerEventId(provider, sourceUrl);
  const meetup = await tryMeetupFeed(provider, sourceUrl, eventId, limit, options.after);
  if (meetup.snapshot) return meetup.snapshot;
  const meetupPublicError = meetup.error;

  const { firecrawlDiscoverProviderEvents, firecrawlScrapeSource, hasFirecrawl } = await import("./firecrawl");
  const fallbackLimit = limit ?? 2000;
  let urls: string[] = [];
  if (eventId) urls = [sourceUrl];
  else if (hasFirecrawl()) urls = await firecrawlDiscoverProviderEvents(sourceUrl, provider, fallbackLimit);
  if (urls.length === 0) {
    throw new Error(
      meetupPublicError
        ? `Meetup public sync failed (${meetupPublicError.message}) and Firecrawl found no events.`
        : `No public ${provider} events were found. Connect an organizer token for reliable sync.`,
    );
  }
  const skip = new Set(options.skipUrls ?? []);
  const urlsToRead = urls.filter((url) => !skip.has(url));
  const { events, readable } = await readPublicEvents(provider, urlsToRead, options.after);
  if (readable === 0 && urlsToRead.length > 0) throw new Error(`No readable ${provider} events were found`);

  const branding = hasFirecrawl() ? await firecrawlScrapeSource(sourceUrl) : null;
  const unreadableCount = urlsToRead.length - readable;
  const discoveryLimitReached = !eventId && urls.length >= fallbackLimit;
  const truncated = discoveryLimitReached || meetupPublicError !== null;
  const brandImage = branding?.avatarUrl ?? branding?.coverUrl;
  return {
    name: branding?.name ?? events[0]?.hostName ?? (provider === "eventbrite" ? "Eventbrite" : "Meetup"),
    events,
    avatarUrl: branding?.avatarUrl ?? null,
    coverUrl: branding?.coverUrl ?? events[0]?.event.coverUrl ?? null,
    description: branding?.description ?? null,
    complete: unreadableCount === 0 && !truncated,
    discoveredCount: urls.length,
    readableCount: readable,
    truncated,
    warnings: snapshotWarnings(unreadableCount, discoveryLimitReached, fallbackLimit, meetupPublicError),
    sourceMethod: sourceMethodOf(events),
    logoUrl: branding?.avatarUrl ?? null,
    previewImageUrl: branding?.coverUrl ?? null,
    imageSource: brandImage ? "link_preview" : undefined,
  };
}
