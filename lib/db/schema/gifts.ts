import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { giftCardStatusEnum, giftCardStyleEnum } from "./enums";

// ============================================
// GIFT CARDS - Christmas 2025 Gift Experience
// ============================================

export const giftCards = pgTable("gift_cards", {
	id: uuid("id").primaryKey().defaultRandom(),
	originalPhotoUrl: varchar("original_photo_url", { length: 500 }).notNull(),
	recipientName: varchar("recipient_name", { length: 100 }),
	generatedImageUrl: varchar("generated_image_url", { length: 500 }),
	generatedBackgroundUrl: varchar("generated_background_url", { length: 500 }),
	coverBackgroundUrl: varchar("cover_background_url", { length: 500 }),
	message: text("message"),
	layoutId: varchar("layout_id", { length: 20 }).notNull(),
	style: giftCardStyleEnum("style").notNull(),
	status: giftCardStatusEnum("status").default("pending"),
	errorMessage: text("error_message"),
	shareToken: varchar("share_token", { length: 64 }).unique().notNull(),
	builderId: integer("builder_id").unique(),
	verticalLabel: varchar("vertical_label", { length: 20 }),
	userId: varchar("user_id", { length: 255 }),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
});

export type GiftCard = typeof giftCards.$inferSelect;
export type NewGiftCard = typeof giftCards.$inferInsert;
