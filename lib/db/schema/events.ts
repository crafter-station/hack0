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
	approvalStatusEnum,
	currencyEnum,
	eventTypeEnum,
	formatEnum,
	shareAssetTypeEnum,
	skillLevelEnum,
	statusEnum,
} from "./enums";

// ============================================
// EVENTS - Hackathons, conferences, workshops, etc.
// ============================================

export const events = pgTable("events", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).unique().notNull(),
	shortCode: varchar("short_code", { length: 10 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),

	// Type
	eventType: eventTypeEnum("event_type").default("hackathon"),

	// Parent/Child relationship (for multi-day/multi-venue events)
	parentEventId: uuid("parent_event_id"), // References another event as parent
	dayNumber: integer("day_number"), // Day 1, 2, 3... for child events

	// Dates
	startDate: timestamp("start_date", { mode: "date", withTimezone: true }),
	endDate: timestamp("end_date", { mode: "date", withTimezone: true }),
	registrationDeadline: timestamp("registration_deadline", {
		mode: "date",
		withTimezone: true,
	}),

	// Location
	format: formatEnum("format").default("virtual"),
	country: varchar("country", { length: 10 }), // ISO code or region like "LATAM"
	department: varchar("department", { length: 100 }), // Region/state (e.g., Lima, Puno, Arequipa)
	city: varchar("city", { length: 100 }),
	venue: varchar("venue", { length: 255 }), // Exact venue name
	timezone: varchar("timezone", { length: 50 }),
	geoLatitude: varchar("geo_latitude", { length: 50 }),
	geoLongitude: varchar("geo_longitude", { length: 50 }),

	// Virtual meeting
	meetingUrl: varchar("meeting_url", { length: 500 }),

	// Classification
	skillLevel: skillLevelEnum("skill_level").default("all"),
	domains: text("domains").array(), // ['ai', 'web3', 'fintech', etc.]

	// Prizes
	prizePool: integer("prize_pool"),
	prizeCurrency: currencyEnum("prize_currency").default("USD"),
	prizeDescription: text("prize_description"),

	// Links
	websiteUrl: varchar("website_url", { length: 500 }).notNull(),
	registrationUrl: varchar("registration_url", { length: 500 }),
	devpostUrl: varchar("devpost_url", { length: 500 }),

	// Media
	eventImageUrl: varchar("event_image_url", { length: 500 }),

	// Status
	status: statusEnum("status").default("upcoming"),
	isFeatured: boolean("is_featured").default(false),
	isApproved: boolean("is_approved").default(true),
	approvalStatus: approvalStatusEnum("approval_status").default("approved"),

	// Organization (for self-service orgs)
	organizationId: uuid("organization_id"),

	// Organizer verification (legacy - for claimed events)
	isOrganizerVerified: boolean("is_organizer_verified").default(false),
	verifiedOrganizerId: varchar("verified_organizer_id", { length: 255 }), // Clerk user ID

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	sourceScrapedAt: timestamp("source_scraped_at", {
		mode: "date",
		withTimezone: true,
	}),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ============================================
// SOCIAL SHARING - Share images and analytics
// ============================================

export const eventShareAssets = pgTable("event_share_assets", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	assetType: shareAssetTypeEnum("asset_type").notNull(),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	generatedAt: timestamp("generated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventShareAsset = typeof eventShareAssets.$inferSelect;
export type NewEventShareAsset = typeof eventShareAssets.$inferInsert;
