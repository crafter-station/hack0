import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	communityRoleEnum,
	inviteTypeEnum,
	roleRequestStatusEnum,
} from "./enums";
import { organizations } from "./organizations";

// ============================================
// COMMUNITY MEMBERS - Multi-user community management
// ============================================

export const communityMembers = pgTable("community_members", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID

	// Role and permissions
	role: communityRoleEnum("role").default("follower"),

	// Tracking
	joinedAt: timestamp("joined_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	invitedBy: varchar("invited_by", { length: 255 }), // Clerk user ID of inviter
});

export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;

// ============================================
// COMMUNITY INVITES - Shareable invite links & email invites
// ============================================

export const communityInvites = pgTable("community_invites", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	createdBy: varchar("created_by", { length: 255 }).notNull(), // Clerk user ID

	// Invite type: "link" (shareable) or "email" (direct invite)
	inviteType: inviteTypeEnum("invite_type").default("link"),

	// Email (only for email invites)
	email: varchar("email", { length: 255 }),

	// Invite token (for URL)
	inviteToken: varchar("invite_token", { length: 255 }).unique().notNull(),

	// Usage limits
	maxUses: integer("max_uses"), // null = unlimited
	usedCount: integer("used_count").default(0),

	// Role granted on join
	roleGranted: communityRoleEnum("role_granted").default("follower"),

	// Status
	isActive: boolean("is_active").default(true),
	expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type CommunityInvite = typeof communityInvites.$inferSelect;
export type NewCommunityInvite = typeof communityInvites.$inferInsert;

// ============================================
// COMMUNITY ROLE REQUESTS - For admin upgrade requests
// ============================================

export const communityRoleRequests = pgTable("community_role_requests", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	requestedRole: communityRoleEnum("requested_role").notNull(),
	message: text("message"),
	status: roleRequestStatusEnum("status").default("pending"),
	reviewedBy: varchar("reviewed_by", { length: 255 }),
	reviewedAt: timestamp("reviewed_at", { mode: "date", withTimezone: true }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type CommunityRoleRequest = typeof communityRoleRequests.$inferSelect;
export type NewCommunityRoleRequest = typeof communityRoleRequests.$inferInsert;
