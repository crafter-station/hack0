import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	organizerTypeEnum,
	relationshipSourceEnum,
	relationshipTypeEnum,
} from "./enums";

// ============================================
// ORGANIZATIONS/COMMUNITIES - For self-service event publishing
// ============================================

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).unique().notNull(),
	shortCode: varchar("short_code", { length: 10 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }), // Public-facing name
	description: text("description"),
	type: organizerTypeEnum("type").default("community"),

	// Contact
	email: varchar("email", { length: 255 }),

	// Location (LATAM)
	country: varchar("country", { length: 10 }), // ISO code: PE, CO, MX, AR, CL, etc.
	department: varchar("department", { length: 100 }), // Region/State: Lima, Arequipa, Antioquia, etc.
	city: varchar("city", { length: 100 }), // City name

	// Links
	websiteUrl: varchar("website_url", { length: 500 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	coverUrl: varchar("cover_url", { length: 500 }),

	// Social Links (stored as JSON)
	twitterUrl: varchar("twitter_url", { length: 500 }),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	instagramUrl: varchar("instagram_url", { length: 500 }),
	facebookUrl: varchar("facebook_url", { length: 500 }),
	githubUrl: varchar("github_url", { length: 500 }),

	// Owner (Clerk user ID)
	ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(),

	// Privacy
	isPublic: boolean("is_public").default(true), // Public communities anyone can follow
	isPersonalOrg: boolean("is_personal_org").default(false), // Personal org for individual organizers

	// Status
	isVerified: boolean("is_verified").default(false), // Admin can verify

	// Tags for discoverability
	tags: text("tags").array(),

	// Badge settings
	badgeEnabled: boolean("badge_enabled").default(false),
	badgeStylePrompt: text("badge_style_prompt"),
	badgeBackgroundPrompt: text("badge_background_prompt"),
	badgeAccentColor: varchar("badge_accent_color", { length: 20 }),
	badgeAiStyle: varchar("badge_ai_style", { length: 50 }),
	badgeCustomTestPortraitUrl: varchar("badge_custom_test_portrait_url", {
		length: 500,
	}),
	badgeCustomTestBackgroundUrl: varchar("badge_custom_test_background_url", {
		length: 500,
	}),
	badgeCustomTestReferenceUrl: varchar("badge_custom_test_reference_url", {
		length: 500,
	}),
	badgeCustomBackgroundImageUrl: varchar("badge_custom_background_image_url", {
		length: 500,
	}),
	badgeStyleTestImages: jsonb("badge_style_test_images").$type<
		Record<string, { portrait: string | null; background: string | null }>
	>(),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// ============================================
// ORGANIZATION RELATIONSHIPS - Graph connections
// ============================================

export const organizationRelationships = pgTable("organization_relationships", {
	id: uuid("id").primaryKey().defaultRandom(),

	sourceOrgId: uuid("source_org_id")
		.references(() => organizations.id)
		.notNull(),
	targetOrgId: uuid("target_org_id")
		.references(() => organizations.id)
		.notNull(),

	relationshipType: relationshipTypeEnum("relationship_type").notNull(),

	description: text("description"),
	strength: integer("strength").default(5),

	source: relationshipSourceEnum("source").default("manual"),
	confidence: integer("confidence").default(100),
	sourceUrl: varchar("source_url", { length: 500 }),

	isBidirectional: boolean("is_bidirectional").default(false),

	isVerified: boolean("is_verified").default(false),
	verifiedBy: varchar("verified_by", { length: 255 }),
	verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type OrganizationRelationship =
	typeof organizationRelationships.$inferSelect;
export type NewOrganizationRelationship =
	typeof organizationRelationships.$inferInsert;
