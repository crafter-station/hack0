import {
	boolean,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { organizations } from "./organizations";

// ============================================
// SUBSCRIPTIONS - Email notifications
// ============================================

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: varchar("email", { length: 255 }).notNull(),

		// Clerk user ID (optional - for logged in users)
		userId: varchar("user_id", { length: 255 }),

		// Community ID (optional - null means global subscription)
		communityId: uuid("community_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),

		// Preferences
		frequency: varchar("frequency", { length: 20 }).default("weekly"), // instant, daily, weekly

		// Verification
		isVerified: boolean("is_verified").default(false),
		verificationToken: varchar("verification_token", { length: 255 }),

		// Status
		isActive: boolean("is_active").default(true),
		unsubscribeToken: varchar("unsubscribe_token", { length: 255 }),

		// Timestamps
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		lastEmailSentAt: timestamp("last_email_sent_at", {
			mode: "date",
			withTimezone: true,
		}),
	},
	(t) => [
		uniqueIndex("subscription_email_community_idx").on(t.email, t.communityId),
	],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ============================================
// NOTIFICATION LOG - Track sent emails
// ============================================

export const notificationLogs = pgTable("notification_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
	eventId: uuid("event_id").references(() => events.id),

	// Email details
	subject: varchar("subject", { length: 500 }),
	sentAt: timestamp("sent_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),

	// Status
	status: varchar("status", { length: 20 }).default("sent"), // sent, failed, bounced
	resendId: varchar("resend_id", { length: 255 }), // Resend email ID for tracking
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;
