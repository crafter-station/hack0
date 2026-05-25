import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const lumaConnections = pgTable(
	"luma_connections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id, { onDelete: "cascade" })
			.notNull(),
		connectedByUserId: varchar("connected_by_user_id", {
			length: 255,
		}).notNull(),
		apiKeyCiphertext: text("api_key_ciphertext").notNull(),
		apiKeyIv: varchar("api_key_iv", { length: 64 }).notNull(),
		apiKeyAuthTag: varchar("api_key_auth_tag", { length: 64 }).notNull(),
		apiKeyPrefix: varchar("api_key_prefix", { length: 24 }).notNull(),
		lumaUserName: varchar("luma_user_name", { length: 255 }),
		lumaUserEmail: varchar("luma_user_email", { length: 255 }),
		lumaUserApiId: varchar("luma_user_api_id", { length: 100 }),
		calendarApiId: varchar("calendar_api_id", { length: 100 }),
		calendarName: varchar("calendar_name", { length: 255 }),
		calendarSlug: varchar("calendar_slug", { length: 255 }),
		calendarUrl: varchar("calendar_url", { length: 500 }),
		status: varchar("status", { length: 32 }).default("active").notNull(),
		lastVerifiedAt: timestamp("last_verified_at", {
			mode: "date",
			withTimezone: true,
		}),
		lastSyncedAt: timestamp("last_synced_at", {
			mode: "date",
			withTimezone: true,
		}),
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
		uniqueIndex("luma_connection_org_idx").on(t.organizationId),
		index("luma_connection_user_idx").on(t.connectedByUserId),
	],
);

export type LumaConnection = typeof lumaConnections.$inferSelect;
export type NewLumaConnection = typeof lumaConnections.$inferInsert;
