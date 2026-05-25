CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."community_role" AS ENUM('owner', 'admin', 'member', 'follower');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'PEN');--> statement-breakpoint
CREATE TYPE "public"."email_verification_purpose" AS ENUM('luma_connect');--> statement-breakpoint
CREATE TYPE "public"."event_organizer_role" AS ENUM('lead', 'organizer', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."event_scope" AS ENUM('latam', 'global_latam_eligible');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('hackathon', 'conference', 'seminar', 'research_fair', 'workshop', 'bootcamp', 'summer_school', 'course', 'certification', 'meetup', 'networking', 'olympiad', 'competition', 'robotics', 'accelerator', 'incubator', 'fellowship', 'call_for_papers');--> statement-breakpoint
CREATE TYPE "public"."format" AS ENUM('virtual', 'in-person', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."format_preference" AS ENUM('virtual', 'in-person', 'hybrid', 'any');--> statement-breakpoint
CREATE TYPE "public"."host_source" AS ENUM('luma', 'manual');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invite_type" AS ENUM('link', 'email');--> statement-breakpoint
CREATE TYPE "public"."organizer_type" AS ENUM('university', 'government', 'company', 'community', 'ngo', 'embassy', 'international_org', 'student_org', 'startup', 'media', 'investor', 'law_firm', 'consulting', 'coworking');--> statement-breakpoint
CREATE TYPE "public"."relationship_source" AS ENUM('manual', 'scraped', 'inferred', 'imported');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('partner', 'investor', 'invested_by', 'accelerated', 'accelerated_by', 'incubated', 'incubated_by', 'member_of', 'sponsor', 'co_host', 'alumni', 'subsidiary', 'parent');--> statement-breakpoint
CREATE TYPE "public"."role_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."scrape_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scrape_source_type" AS ENUM('devpost', 'ecosistema_peruano', 'dev_events', 'rss', 'luma_public', 'custom');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('beginner', 'intermediate', 'advanced', 'all');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('upcoming', 'open', 'ongoing', 'ended');--> statement-breakpoint
CREATE TYPE "public"."sync_frequency" AS ENUM('hourly', 'daily', 'weekly', 'manual');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'organizer');--> statement-breakpoint
CREATE TABLE "community_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"invite_type" "invite_type" DEFAULT 'link',
	"email" varchar(255),
	"invite_token" varchar(255) NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0,
	"role_granted" "community_role" DEFAULT 'follower',
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "community_invites_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" "community_role" DEFAULT 'follower',
	"joined_at" timestamp with time zone DEFAULT now(),
	"invited_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "community_role_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"requested_role" "community_role" NOT NULL,
	"message" text,
	"status" "role_request_status" DEFAULT 'pending',
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_host_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"status" "approval_status" DEFAULT 'pending',
	"invited_by" varchar(255),
	"invite_token" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"accepted_at" timestamp with time zone,
	CONSTRAINT "event_host_organizations_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "event_hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"source" "host_source" DEFAULT 'manual' NOT NULL,
	"luma_host_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"avatar_url" varchar(500),
	"user_id" varchar(255),
	"representing_org_id" uuid,
	"assigned_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_organizers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" "event_organizer_role" DEFAULT 'organizer',
	"representing_org_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"short_code" varchar(10),
	"name" varchar(255) NOT NULL,
	"description" text,
	"event_type" "event_type" DEFAULT 'hackathon',
	"parent_event_id" uuid,
	"day_number" integer,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"registration_deadline" timestamp with time zone,
	"format" "format" DEFAULT 'virtual',
	"country" varchar(10),
	"department" varchar(100),
	"city" varchar(100),
	"venue" varchar(255),
	"timezone" varchar(50),
	"geo_latitude" varchar(50),
	"geo_longitude" varchar(50),
	"meeting_url" varchar(500),
	"skill_level" "skill_level" DEFAULT 'all',
	"domains" text[],
	"prize_pool" integer,
	"prize_currency" "currency" DEFAULT 'USD',
	"prize_description" text,
	"website_url" varchar(500) NOT NULL,
	"registration_url" varchar(500),
	"devpost_url" varchar(500),
	"event_image_url" varchar(500),
	"scope" "event_scope" DEFAULT 'latam' NOT NULL,
	"status" "status" DEFAULT 'upcoming',
	"is_featured" boolean DEFAULT false,
	"is_approved" boolean DEFAULT true,
	"approval_status" "approval_status" DEFAULT 'approved',
	"organization_id" uuid NOT NULL,
	"scrape_source" varchar(50),
	"scrape_source_url" varchar(500),
	"scrape_confidence" integer,
	"scrape_raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"source_scraped_at" timestamp with time zone,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_url" varchar(500) NOT NULL,
	"source_type" varchar(50) DEFAULT 'luma',
	"status" "import_status" DEFAULT 'pending',
	"trigger_run_id" varchar(255),
	"event_id" uuid,
	"extracted_data" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "scrape_run_status" DEFAULT 'pending',
	"events_found" integer DEFAULT 0,
	"events_created" integer DEFAULT 0,
	"events_updated" integer DEFAULT 0,
	"error_message" text,
	"trigger_run_id" varchar(255),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scrape_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"source_type" "scrape_source_type" NOT NULL,
	"source_url" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true,
	"scrape_frequency" "sync_frequency" DEFAULT 'daily',
	"last_scrape_at" timestamp with time zone,
	"config" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_org_id" uuid NOT NULL,
	"target_org_id" uuid NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"description" text,
	"strength" integer DEFAULT 5,
	"source" "relationship_source" DEFAULT 'manual',
	"confidence" integer DEFAULT 100,
	"source_url" varchar(500),
	"is_bidirectional" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"verified_by" varchar(255),
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"short_code" varchar(10),
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"description" text,
	"type" "organizer_type" DEFAULT 'community',
	"email" varchar(255),
	"country" varchar(10),
	"department" varchar(100),
	"city" varchar(100),
	"website_url" varchar(500),
	"logo_url" varchar(500),
	"cover_url" varchar(500),
	"twitter_url" varchar(500),
	"linkedin_url" varchar(500),
	"instagram_url" varchar(500),
	"facebook_url" varchar(500),
	"github_url" varchar(500),
	"owner_user_id" varchar(255) NOT NULL,
	"is_public" boolean DEFAULT true,
	"is_personal_org" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"purpose" "email_verification_purpose" NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"username" varchar(50),
	"display_name" varchar(100),
	"email" varchar(255),
	"avatar_url" varchar(500),
	"bio" text,
	"headline" varchar(150),
	"country" varchar(10),
	"region" varchar(100),
	"city" varchar(100),
	"timezone" varchar(50) DEFAULT 'America/Lima',
	"skills" text[],
	"domains" text[],
	"website_url" varchar(500),
	"github_url" varchar(500),
	"linkedin_url" varchar(500),
	"twitter_url" varchar(500),
	"is_open_to_work" boolean DEFAULT false,
	"is_open_to_freelance" boolean DEFAULT false,
	"is_open_to_collab" boolean DEFAULT false,
	"is_open_to_mentor" boolean DEFAULT false,
	"is_open_to_speaking" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"show_email" boolean DEFAULT false,
	"role" "user_role" DEFAULT 'member',
	"format_preference" "format_preference" DEFAULT 'any',
	"skill_level" "skill_level" DEFAULT 'all',
	"has_completed_onboarding" boolean DEFAULT false,
	"events_attended_count" integer DEFAULT 0,
	"events_organized_count" integer DEFAULT 0,
	"hackathons_count" integer DEFAULT 0,
	"hackathon_wins_count" integer DEFAULT 0,
	"communities_count" integer DEFAULT 0,
	"total_points" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_seen_at" timestamp with time zone,
	"luma_email" varchar(255),
	"luma_email_verified" boolean DEFAULT false,
	"luma_email_verified_at" timestamp with time zone,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_community_id_organizations_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_organizations_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_role_requests" ADD CONSTRAINT "community_role_requests_community_id_organizations_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_host_organizations" ADD CONSTRAINT "event_host_organizations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_host_organizations" ADD CONSTRAINT "event_host_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_representing_org_id_organizations_id_fk" FOREIGN KEY ("representing_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_representing_org_id_organizations_id_fk" FOREIGN KEY ("representing_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_source_id_scrape_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scrape_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_source_org_id_organizations_id_fk" FOREIGN KEY ("source_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_target_org_id_organizations_id_fk" FOREIGN KEY ("target_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_host_luma_idx" ON "event_hosts" USING btree ("event_id","luma_host_id");--> statement-breakpoint
CREATE INDEX "event_host_event_idx" ON "event_hosts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_host_user_idx" ON "event_hosts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_host_org_idx" ON "event_hosts" USING btree ("representing_org_id");--> statement-breakpoint
CREATE INDEX "email_verification_user_idx" ON "email_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_token_idx" ON "email_verifications" USING btree ("token");