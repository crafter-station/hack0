CREATE TYPE "public"."event_type" AS ENUM('hackathon', 'innovation_challenge', 'conference', 'seminar', 'research_fair', 'workshop', 'bootcamp', 'summer_school', 'course', 'certification', 'meetup', 'networking', 'olympiad', 'competition', 'robotics', 'accelerator', 'incubator', 'fellowship', 'call_for_papers');--> statement-breakpoint
CREATE TYPE "public"."format" AS ENUM('virtual', 'in-person', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."organizer_type" AS ENUM('university', 'government', 'company', 'community', 'ngo', 'embassy', 'international_org', 'student_org', 'startup', 'media');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('beginner', 'intermediate', 'advanced', 'all');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('upcoming', 'open', 'ongoing', 'ended');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"event_type" "event_type" DEFAULT 'hackathon',
	"start_date" timestamp,
	"end_date" timestamp,
	"registration_deadline" timestamp,
	"format" "format" DEFAULT 'virtual',
	"country" varchar(10),
	"city" varchar(100),
	"timezone" varchar(50),
	"skill_level" "skill_level" DEFAULT 'all',
	"domains" text[],
	"prize_pool" integer,
	"prize_description" text,
	"website_url" varchar(500) NOT NULL,
	"registration_url" varchar(500),
	"devpost_url" varchar(500),
	"logo_url" varchar(500),
	"banner_url" varchar(500),
	"organizer_name" varchar(255),
	"organizer_url" varchar(500),
	"organizer_type" "organizer_type",
	"is_junior_friendly" boolean DEFAULT false,
	"status" "status" DEFAULT 'upcoming',
	"is_featured" boolean DEFAULT false,
	"is_approved" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"source_scraped_at" timestamp,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid,
	"event_id" uuid,
	"subject" varchar(500),
	"sent_at" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'sent',
	"resend_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"frequency" varchar(20) DEFAULT 'weekly',
	"is_verified" boolean DEFAULT false,
	"verification_token" varchar(255),
	"is_active" boolean DEFAULT true,
	"unsubscribe_token" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"last_email_sent_at" timestamp,
	CONSTRAINT "subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;