import { RetryableError } from "workflow";
import type { SourceEventInput } from "@/lib/canonical/canonical-events";
import type { SourceRef } from "./normalize";

const API = "https://public-api.luma.com/v1";

type ManagedEvent = {
  api_id?: string;
  id?: string;
  name?: string;
  url?: string;
  start_at?: string;
  end_at?: string | null;
  timezone?: string | null;
  cover_url?: string | null;
  visibility?: string;
  location_visibility?: string;
  meeting_url?: string | null;
  coordinate?: { latitude?: number; longitude?: number } | null;
  geo_address_json?: { city?: string; region?: string; country?: string; full_address?: string } | null;
};

async function call<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { "x-luma-api-key": apiKey } });
  // Luma documents a per-minute limit, so one window is the right wait.
  if (res.status === 429) throw new RetryableError(`Luma rate limited ${path}`, { retryAfter: "1m" });
  if (!res.ok) throw new Error(`Luma ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

function toInput(e: ManagedEvent, source: SourceRef, now: string): SourceEventInput | null {
  const id = e.api_id ?? e.id;
  if (!id || !e.name || !e.url || !e.start_at || (e.visibility && e.visibility !== "public")) return null;
  const geo = e.geo_address_json;
  const url = e.url.startsWith("http") ? e.url : `https://luma.com/${e.url.replace(/^\/+/, "")}`;
  const city = geo?.city ? [geo.city, geo.region].filter(Boolean).join(", ") : undefined;
  return {
    sourceType: "api",
    provider: "luma",
    calendarRowId: source.id,
    calendarId: source.calendarId,
    calendarName: source.name,
    externalEventId: id,
    sourceUrl: url,
    lastSyncedAt: now,
    event: {
      id,
      name: e.name,
      url,
      coverUrl: e.cover_url ?? null,
      startAt: e.start_at,
      endAt: e.end_at ?? undefined,
      timezone: e.timezone ?? null,
      city,
      calendarId: source.calendarId ?? undefined,
      calendarName: source.name ?? undefined,
      enrichment: {
        countryCode: geo?.country ?? null,
        region: geo?.region ?? null,
        venueAddress: e.location_visibility === "public" ? (geo?.full_address ?? null) : null,
        latitude: e.coordinate?.latitude ?? null,
        longitude: e.coordinate?.longitude ?? null,
        isOnline: !geo?.city && Boolean(e.meeting_url),
        sources: { countryCode: "provider" },
      },
    },
  };
}

function listQuery(after: Date | undefined, cursor: string | undefined) {
  const qs = new URLSearchParams({ pagination_limit: "50", sort_column: "start_at", sort_direction: "asc" });
  for (const p of ["luma", "external"]) qs.append("platforms", p);
  for (const a of ["manage", "view"]) qs.append("access", a);
  if (after) qs.set("after", after.toISOString());
  if (cursor) qs.set("pagination_cursor", cursor);
  return qs;
}

/** Every public event the key's calendar lists; `after` limits it to upcoming ones for incremental syncs. */
export async function fetchManagedEvents(apiKey: string, source: SourceRef, after?: Date): Promise<SourceEventInput[]> {
  const now = new Date().toISOString();
  const out: SourceEventInput[] = [];
  let cursor: string | undefined;
  for (;;) {
    const qs = listQuery(after, cursor);
    const page = await call<{ entries?: (ManagedEvent & { event?: ManagedEvent })[]; has_more?: boolean; next_cursor?: string }>(
      apiKey,
      `/calendars/events/list?${qs}`,
    );
    for (const entry of page.entries ?? []) {
      const input = toInput(entry.event ?? entry, source, now);
      if (input) out.push(input);
    }
    if (!page.has_more || !page.next_cursor) return out;
    cursor = page.next_cursor;
  }
}

/** Markdown description; only events the key's calendar manages return one. */
export async function fetchManagedDescription(apiKey: string, eventId: string): Promise<string | null> {
  const data = await call<{ event?: { description_md?: string | null } }>(apiKey, `/event/get?id=${encodeURIComponent(eventId)}`);
  return data.event?.description_md?.trim() || null;
}
