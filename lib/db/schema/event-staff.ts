import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	approvalStatusEnum,
	eventOrganizerRoleEnum,
	hostSourceEnum,
} from "./enums";
import { events } from "./events";
import { organizations } from "./organizations";

// ============================================
// EVENT HOSTS - Individual hosts for events (from Luma or manual)
// ============================================

export const eventHosts = pgTable(
	"event_hosts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),

		source: hostSourceEnum("source").notNull().default("manual"),

		lumaHostId: varchar("luma_host_id", { length: 100 }),

		name: varchar("name", { length: 255 }).notNull(),
		avatarUrl: varchar("avatar_url", { length: 500 }),

		userId: varchar("user_id", { length: 255 }),

		representingOrgId: uuid("representing_org_id").references(
			() => organizations.id,
		),

		assignedBy: varchar("assigned_by", { length: 255 }),

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
		uniqueIndex("event_host_luma_idx").on(t.eventId, t.lumaHostId),
		index("event_host_event_idx").on(t.eventId),
		index("event_host_user_idx").on(t.userId),
		index("event_host_org_idx").on(t.representingOrgId),
	],
);

export type EventHost = typeof eventHosts.$inferSelect;
export type NewEventHost = typeof eventHosts.$inferInsert;

// ============================================
// HOST CLAIMS - For manual host verification requests
// ============================================

export const hostClaims = pgTable("host_claims", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventHostId: uuid("event_host_id")
		.references(() => eventHosts.id, { onDelete: "cascade" })
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),

	proofUrl: varchar("proof_url", { length: 500 }).notNull(),
	proofDescription: text("proof_description"),

	status: varchar("status", { length: 20 }).default("pending"),
	reviewedAt: timestamp("reviewed_at", { mode: "date", withTimezone: true }),
	reviewedBy: varchar("reviewed_by", { length: 255 }),
	rejectionReason: text("rejection_reason"),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type HostClaim = typeof hostClaims.$inferSelect;
export type NewHostClaim = typeof hostClaims.$inferInsert;

// ============================================
// EVENT SPONSORS - Junction table for sponsors (using organizations)
// ============================================

export const eventSponsors = pgTable("event_sponsors", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventSponsor = typeof eventSponsors.$inferSelect;
export type NewEventSponsor = typeof eventSponsors.$inferInsert;

// ============================================
// EVENT ORGANIZERS - Assign community members to specific events
// ============================================

export const eventOrganizers = pgTable("event_organizers", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID (must be community member)

	// Role specific to this event
	role: eventOrganizerRoleEnum("role").default("organizer"),

	// Organization this person represents (personal or community org)
	representingOrgId: uuid("representing_org_id").references(
		() => organizations.id,
	),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventOrganizer = typeof eventOrganizers.$inferSelect;
export type NewEventOrganizer = typeof eventOrganizers.$inferInsert;

// ============================================
// EVENT HOST ORGANIZATIONS - Multi-org co-hosting
// ============================================

export const eventHostOrganizations = pgTable("event_host_organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),

	// Primary host (only one per event - the creator)
	isPrimary: boolean("is_primary").default(false),

	// Invitation status (pending = invited but not accepted yet)
	status: approvalStatusEnum("status").default("pending"),
	invitedBy: varchar("invited_by", { length: 255 }), // Clerk user ID
	inviteToken: varchar("invite_token", { length: 255 }).unique(),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
});

export type EventHostOrganization = typeof eventHostOrganizations.$inferSelect;
export type NewEventHostOrganization =
	typeof eventHostOrganizations.$inferInsert;
