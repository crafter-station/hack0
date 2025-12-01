CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "organizer_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" varchar(100),
	"proof_url" varchar(500),
	"proof_description" text,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "winner_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"team_name" varchar(255),
	"project_name" varchar(255),
	"project_url" varchar(500),
	"proof_url" varchar(500) NOT NULL,
	"proof_description" text,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "approval_status" "approval_status" DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_organizer_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "verified_organizer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizer_claims" ADD CONSTRAINT "organizer_claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_claims" ADD CONSTRAINT "winner_claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;