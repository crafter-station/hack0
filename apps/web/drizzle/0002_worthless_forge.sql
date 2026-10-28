CREATE TABLE "content_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"event_ids" uuid[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canonical_events" ADD COLUMN "luma_submission_id" text;--> statement-breakpoint
ALTER TABLE "canonical_events" ADD COLUMN "luma_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "canonical_events" ADD COLUMN "luma_submit_error" text;--> statement-breakpoint
CREATE UNIQUE INDEX "content_drafts_key_key" ON "content_drafts" USING btree ("key");