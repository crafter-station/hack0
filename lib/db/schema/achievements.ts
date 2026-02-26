import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { achievementRarityEnum, achievementTypeEnum } from "./enums";

// ============================================
// ACHIEVEMENTS - Gamification System
// ============================================

export const achievements = pgTable("achievements", {
	id: varchar("id", { length: 50 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description").notNull(),
	iconUrl: varchar("icon_url", { length: 500 }),
	type: achievementTypeEnum("type").notNull(),
	rarity: achievementRarityEnum("rarity").default("common"),
	points: integer("points").default(10),
	isActive: boolean("is_active").default(true),
	isSecret: boolean("is_secret").default(false),
	unlockedBy: text("unlocked_by"),
	availableFrom: timestamp("available_from", {
		mode: "date",
		withTimezone: true,
	}),
	availableUntil: timestamp("available_until", {
		mode: "date",
		withTimezone: true,
	}),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export const userAchievements = pgTable(
	"user_achievements",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		achievementId: varchar("achievement_id", { length: 50 })
			.references(() => achievements.id)
			.notNull(),
		unlockedAt: timestamp("unlocked_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		metadata: text("metadata"),
	},
	(table) => [
		uniqueIndex("user_achievement_unique_idx").on(
			table.userId,
			table.achievementId,
		),
	],
);

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
