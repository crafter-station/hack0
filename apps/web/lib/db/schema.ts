import { boolean, doublePrecision, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { EventEnrichment } from "@/lib/canonical/canonical-events";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A calendar, organizer, group or single event URL the aggregator reads from. */
export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider", { enum: ["luma", "eventbrite", "meetup"] }).notNull(),
    kind: text("kind", { enum: ["calendar", "profile", "organizer", "group", "event"] }).notNull(),
    providerSourceId: text("provider_source_id").notNull(),
    url: text("url").notNull(),
    name: text("name"),
    lumaCalendarId: text("luma_calendar_id"),
    /** Luma API key for calendars synced through the API, encrypted at rest. */
    apiKeyCiphertext: text("api_key_ciphertext"),
    syncEnabled: boolean("sync_enabled").notNull().default(true),
    syncStatus: text("sync_status", { enum: ["idle", "queued", "running", "completed", "failed"] })
      .notNull()
      .default("idle"),
    syncError: text("sync_error"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    nextSyncAt: timestamp("next_sync_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("sources_provider_source_id_key").on(t.providerSourceId), index("sources_next_sync_at_idx").on(t.nextSyncAt)],
);

/** One real-world event, deduplicated across every source that lists it. */
export const canonicalEvents = pgTable(
  "canonical_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalKey: text("canonical_key").notNull(),
    identityFingerprint: text("identity_fingerprint").notNull(),
    lumaEventId: text("luma_event_id"),
    externalIds: jsonb("external_ids").$type<Record<string, unknown>>().notNull().default({}),
    name: text("name").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    coverUrl: text("cover_url"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    timezone: text("timezone"),
    city: text("city"),
    region: text("region"),
    countryCode: text("country_code"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    isOnline: boolean("is_online"),
    format: text("format"),
    languageCode: text("language_code"),
    hostName: text("host_name"),
    topics: text("topics").array().notNull().default([]),
    audience: text("audience").array().notNull().default([]),
    level: text("level"),
    tags: text("tags").array().notNull().default([]),
    enrichment: jsonb("enrichment").$type<EventEnrichment>().notNull().default({}),
    enrichedAt: timestamp("enriched_at", { withTimezone: true }),
    /** Picked for hack0: gets a page, the Luma calendar and the newsletter. */
    curated: boolean("curated").notNull().default(false),
    lumaSubmissionId: text("luma_submission_id"),
    lumaSubmittedAt: timestamp("luma_submitted_at", { withTimezone: true }),
    /** Why the event could not go to the hack0 Luma calendar, e.g. no end time. */
    lumaSubmitError: text("luma_submit_error"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("canonical_events_canonical_key_key").on(t.canonicalKey),
    index("canonical_events_fingerprint_idx").on(t.identityFingerprint),
    uniqueIndex("canonical_events_luma_event_id_key").on(t.lumaEventId),
    index("canonical_events_start_at_idx").on(t.startAt),
    index("canonical_events_country_start_idx").on(t.countryCode, t.startAt),
  ],
);

/** A single sighting of an event in one source, kept for attribution and resync. */
export const eventSources = pgTable(
  "event_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalEventId: uuid("canonical_event_id")
      .notNull()
      .references(() => canonicalEvents.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    provider: text("provider", { enum: ["luma", "eventbrite", "meetup"] }).notNull(),
    sourceType: text("source_type").notNull(),
    sourceKey: text("source_key").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalEventId: text("external_event_id"),
    calendarName: text("calendar_name"),
    hostName: text("host_name"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("event_sources_type_key_key").on(t.sourceType, t.sourceKey),
    index("event_sources_canonical_event_idx").on(t.canonicalEventId),
  ],
);

/** Read tokens for the REST API and MCP server. Only the sha256 of the raw token is stored. */
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    prefix: text("prefix").notNull(),
    scopes: text("scopes").array().notNull().default(["events:read", "calendars:read"]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("api_tokens_token_hash_key").on(t.tokenHash)],
);

/** Generated copy waiting for a person: a weekly agenda or one post per event. Nothing here is sent automatically. */
export const contentDrafts = pgTable(
  "content_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind", { enum: ["agenda", "event_post"] }).notNull(),
    /** Stable key so a rerun updates the draft instead of adding another, e.g. agenda:2026-11-02. */
    key: text("key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    eventIds: uuid("event_ids").array().notNull().default([]),
    status: text("status", { enum: ["draft", "approved", "discarded"] })
      .notNull()
      .default("draft"),
    ...timestamps,
  },
  (t) => [uniqueIndex("content_drafts_key_key").on(t.key)],
);
