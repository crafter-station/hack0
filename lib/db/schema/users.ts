import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	emailVerificationPurposeEnum,
	formatPreferenceEnum,
	skillLevelEnum,
	userRoleEnum,
} from "./enums";

// ============================================
// USERS - First-class builders in the ecosystem
// ============================================

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),

	username: varchar("username", { length: 50 }).unique(),
	displayName: varchar("display_name", { length: 100 }),
	email: varchar("email", { length: 255 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	bio: text("bio"),
	headline: varchar("headline", { length: 150 }),

	country: varchar("country", { length: 10 }),
	region: varchar("region", { length: 100 }),
	city: varchar("city", { length: 100 }),
	timezone: varchar("timezone", { length: 50 }).default("America/Lima"),

	skills: text("skills").array(),
	domains: text("domains").array(),

	websiteUrl: varchar("website_url", { length: 500 }),
	githubUrl: varchar("github_url", { length: 500 }),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	twitterUrl: varchar("twitter_url", { length: 500 }),

	isOpenToWork: boolean("is_open_to_work").default(false),
	isOpenToFreelance: boolean("is_open_to_freelance").default(false),
	isOpenToCollab: boolean("is_open_to_collab").default(false),
	isOpenToMentor: boolean("is_open_to_mentor").default(false),
	isOpenToSpeaking: boolean("is_open_to_speaking").default(false),

	isPublic: boolean("is_public").default(true),
	showEmail: boolean("show_email").default(false),

	role: userRoleEnum("role").default("member"),
	formatPreference: formatPreferenceEnum("format_preference").default("any"),
	skillLevel: skillLevelEnum("skill_level").default("all"),
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),

	eventsAttendedCount: integer("events_attended_count").default(0),
	eventsOrganizedCount: integer("events_organized_count").default(0),
	hackathonsCount: integer("hackathons_count").default(0),
	hackathonWinsCount: integer("hackathon_wins_count").default(0),
	communitiesCount: integer("communities_count").default(0),
	achievementsCount: integer("achievements_count").default(0),
	totalPoints: integer("total_points").default(0),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	lastSeenAt: timestamp("last_seen_at", {
		mode: "date",
		withTimezone: true,
	}),

	// Luma Email Verification (Fake OAuth)
	lumaEmail: varchar("luma_email", { length: 255 }),
	lumaEmailVerified: boolean("luma_email_verified").default(false),
	lumaEmailVerifiedAt: timestamp("luma_email_verified_at", {
		mode: "date",
		withTimezone: true,
	}),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// EMAIL VERIFICATIONS - For Luma email verification (Fake OAuth)
// ============================================

export const emailVerifications = pgTable(
	"email_verifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: varchar("user_id", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		purpose: emailVerificationPurposeEnum("purpose").notNull(),

		token: varchar("token", { length: 255 }).unique().notNull(),
		expiresAt: timestamp("expires_at", {
			mode: "date",
			withTimezone: true,
		}).notNull(),

		verifiedAt: timestamp("verified_at", {
			mode: "date",
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(t) => [
		index("email_verification_user_idx").on(t.userId),
		index("email_verification_token_idx").on(t.token),
	],
);

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
