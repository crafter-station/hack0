import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	eventSourceLinkStatusEnum,
	eventSourceLinkTypeEnum,
	eventSourceSyncModeEnum,
} from "./enums";
import { events } from "./events";
import { lumaConnections } from "./luma-connections";

export const eventSourceLinks = pgTable(
	"event_source_links",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),
		connectionId: uuid("connection_id").references(() => lumaConnections.id, {
			onDelete: "set null",
		}),
		provider: varchar("provider", { length: 50 }).notNull(),
		linkType: eventSourceLinkTypeEnum("link_type").notNull(),
		identityKey: varchar("identity_key", { length: 700 }).notNull(),
		externalId: varchar("external_id", { length: 255 }).notNull(),
		externalUrl: varchar("external_url", { length: 500 }),
		calendarExternalId: varchar("calendar_external_id", { length: 255 }),
		syncMode: eventSourceSyncModeEnum("sync_mode").default("inbound").notNull(),
		status: eventSourceLinkStatusEnum("status").default("active").notNull(),
		lastInboundAt: timestamp("last_inbound_at", {
			mode: "date",
			withTimezone: true,
		}),
		lastOutboundAt: timestamp("last_outbound_at", {
			mode: "date",
			withTimezone: true,
		}),
		lastError: text("last_error"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(t) => [
		uniqueIndex("event_source_link_identity_idx").on(t.identityKey),
		index("event_source_link_event_idx").on(t.eventId),
		index("event_source_link_external_idx").on(t.provider, t.externalId),
		index("event_source_link_calendar_idx").on(
			t.provider,
			t.calendarExternalId,
		),
	],
);

export type EventSourceLink = typeof eventSourceLinks.$inferSelect;
export type NewEventSourceLink = typeof eventSourceLinks.$inferInsert;
