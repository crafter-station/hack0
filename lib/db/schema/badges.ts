import {
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
	badgeCampaignStatusEnum,
	badgeCampaignTypeEnum,
	communityBadgeStatusEnum,
} from "./enums";
import { events } from "./events";
import { organizations } from "./organizations";

// ============================================
// BADGE CAMPAIGNS - Seasonal and event-based badge campaigns
// ============================================

export const badgeCampaigns = pgTable(
	"badge_campaigns",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		communityId: uuid("community_id")
			.references(() => organizations.id, { onDelete: "cascade" })
			.notNull(),

		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		description: text("description"),
		type: badgeCampaignTypeEnum("type").default("seasonal").notNull(),
		status: badgeCampaignStatusEnum("status").default("draft").notNull(),

		eventId: uuid("event_id").references(() => events.id, {
			onDelete: "set null",
		}),

		stylePreset: varchar("style_preset", { length: 50 }),
		portraitPrompt: text("portrait_prompt"),
		backgroundPrompt: text("background_prompt"),
		accentColor: varchar("accent_color", { length: 20 }),
		customBackgroundImageUrl: varchar("custom_background_image_url", {
			length: 500,
		}),

		badgeLabel: varchar("badge_label", { length: 50 }),
		badgeIcon: varchar("badge_icon", { length: 100 }),

		startsAt: timestamp("starts_at", { mode: "date", withTimezone: true }),
		endsAt: timestamp("ends_at", { mode: "date", withTimezone: true }),

		maxBadges: integer("max_badges"),
		badgesGenerated: integer("badges_generated").default(0).notNull(),

		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.defaultNow()
			.notNull(),
		createdBy: varchar("created_by", { length: 255 }),
	},
	(t) => [
		uniqueIndex("campaign_slug_community_idx").on(t.communityId, t.slug),
		index("campaign_community_status_idx").on(t.communityId, t.status),
	],
);

export type BadgeCampaign = typeof badgeCampaigns.$inferSelect;
export type NewBadgeCampaign = typeof badgeCampaigns.$inferInsert;

export const BADGE_CAMPAIGN_STATUS_LABELS: Record<
	BadgeCampaign["status"],
	string
> = {
	draft: "Borrador",
	active: "Activa",
	ended: "Finalizada",
	archived: "Archivada",
};

export const BADGE_CAMPAIGN_TYPE_LABELS: Record<BadgeCampaign["type"], string> =
	{
		default: "Principal",
		seasonal: "Estacional",
		event: "Evento",
	};

// ============================================
// COMMUNITY BADGES - Member badges for communities
// ============================================

export const communityBadges = pgTable(
	"community_badges",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		communityId: uuid("community_id")
			.references(() => organizations.id, { onDelete: "cascade" })
			.notNull(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		campaignId: uuid("campaign_id").references(() => badgeCampaigns.id, {
			onDelete: "cascade",
		}),

		badgeNumber: integer("badge_number").notNull(),
		shareToken: varchar("share_token", { length: 64 }).unique().notNull(),

		originalPhotoUrl: varchar("original_photo_url", { length: 500 }),
		generatedImageUrl: varchar("generated_image_url", { length: 500 }),
		generatedBackgroundUrl: varchar("generated_background_url", {
			length: 500,
		}),

		status: communityBadgeStatusEnum("status").default("pending"),
		errorMessage: text("error_message"),
		triggerRunId: varchar("trigger_run_id", { length: 255 }),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		completedAt: timestamp("completed_at", {
			mode: "date",
			withTimezone: true,
		}),
	},
	(t) => [
		uniqueIndex("community_badge_unique_idx").on(
			t.communityId,
			t.userId,
			t.campaignId,
		),
		index("community_badge_token_idx").on(t.shareToken),
		index("community_badge_campaign_idx").on(t.campaignId),
	],
);

export type CommunityBadge = typeof communityBadges.$inferSelect;
export type NewCommunityBadge = typeof communityBadges.$inferInsert;
