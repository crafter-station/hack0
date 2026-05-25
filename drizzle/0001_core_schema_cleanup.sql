ALTER TABLE "achievements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_achievements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "badge_campaigns" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "community_badges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance_claims" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "winner_claims" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "host_claims" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_share_assets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gift_cards" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rss_feed_subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "judge_assignments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "judge_scores" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submission_team_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submission_templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "achievements" CASCADE;--> statement-breakpoint
DROP TABLE "user_achievements" CASCADE;--> statement-breakpoint
DROP TABLE "badge_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "community_badges" CASCADE;--> statement-breakpoint
DROP TABLE "attendance_claims" CASCADE;--> statement-breakpoint
DROP TABLE "winner_claims" CASCADE;--> statement-breakpoint
DROP TABLE "host_claims" CASCADE;--> statement-breakpoint
DROP TABLE "event_share_assets" CASCADE;--> statement-breakpoint
DROP TABLE "gift_cards" CASCADE;--> statement-breakpoint
DROP TABLE "rss_feed_subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE "judge_assignments" CASCADE;--> statement-breakpoint
DROP TABLE "judge_scores" CASCADE;--> statement-breakpoint
DROP TABLE "submission_team_members" CASCADE;--> statement-breakpoint
DROP TABLE "submission_templates" CASCADE;--> statement-breakpoint
DROP TABLE "submissions" CASCADE;--> statement-breakpoint
DROP TABLE "notification_logs" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
INSERT INTO "organizations" ("id", "slug", "name", "display_name", "type", "owner_user_id", "is_public", "is_verified", "tags", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'hack0-imports', 'Hack0 Imports', 'Hack0 Imports', 'community', 'system', true, false, ARRAY['system', 'imports'], NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET "updated_at" = NOW();--> statement-breakpoint
ALTER TABLE "event_host_organizations" DROP CONSTRAINT "event_host_organizations_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "event_host_organizations" DROP CONSTRAINT "event_host_organizations_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "event_organizers" DROP CONSTRAINT "event_organizers_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "event_sponsors" DROP CONSTRAINT "event_sponsors_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "event_sponsors" DROP CONSTRAINT "event_sponsors_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_host_organizations" ADD CONSTRAINT "event_host_organizations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_host_organizations" ADD CONSTRAINT "event_host_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_organizer_verified";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "verified_organizer_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_enabled";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_style_prompt";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_background_prompt";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_accent_color";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_ai_style";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_custom_test_portrait_url";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_custom_test_background_url";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_custom_test_reference_url";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_custom_background_image_url";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "badge_style_test_images";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "achievements_count";--> statement-breakpoint
DROP TYPE "public"."achievement_rarity";--> statement-breakpoint
DROP TYPE "public"."achievement_type";--> statement-breakpoint
DROP TYPE "public"."attendance_verification";--> statement-breakpoint
DROP TYPE "public"."badge_campaign_status";--> statement-breakpoint
DROP TYPE "public"."badge_campaign_type";--> statement-breakpoint
DROP TYPE "public"."community_badge_status";--> statement-breakpoint
DROP TYPE "public"."gift_card_status";--> statement-breakpoint
DROP TYPE "public"."gift_card_style";--> statement-breakpoint
DROP TYPE "public"."share_asset_type";--> statement-breakpoint
DROP TYPE "public"."submission_status";--> statement-breakpoint
DROP TYPE "public"."team_member_role";--> statement-breakpoint
DROP TYPE "public"."team_member_status";
