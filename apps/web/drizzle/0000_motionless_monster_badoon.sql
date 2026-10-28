CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"scopes" text[] DEFAULT '{"events:read","calendars:read"}' NOT NULL,
	"last_used_at" timestamp with time zone,
	"window_start" timestamp with time zone,
	"window_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canonical_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_key" text NOT NULL,
	"slug" text NOT NULL,
	"metro" text,
	"identity_fingerprint" text NOT NULL,
	"luma_event_id" text,
	"external_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"cover_url" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"timezone" text,
	"city" text,
	"region" text,
	"country_code" text,
	"venue_name" text,
	"venue_address" text,
	"latitude" double precision,
	"longitude" double precision,
	"is_online" boolean,
	"format" text,
	"language_code" text,
	"host_name" text,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"audience" text[] DEFAULT '{}' NOT NULL,
	"level" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"enrichment" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enriched_at" timestamp with time zone,
	"curated" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"listed" boolean DEFAULT false NOT NULL,
	"luma_submission_id" text,
	"luma_submitted_at" timestamp with time zone,
	"luma_submit_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "event_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_event_id" uuid NOT NULL,
	"source_id" uuid,
	"provider" text NOT NULL,
	"source_type" text NOT NULL,
	"source_key" text NOT NULL,
	"source_url" text NOT NULL,
	"external_event_id" text,
	"calendar_name" text,
	"host_name" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"kind" text NOT NULL,
	"provider_source_id" text NOT NULL,
	"url" text NOT NULL,
	"name" text,
	"scope" text DEFAULT 'global' NOT NULL,
	"luma_calendar_id" text,
	"api_key_ciphertext" text,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"sync_status" text DEFAULT 'idle' NOT NULL,
	"sync_error" text,
	"last_synced_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_canonical_event_id_canonical_events_id_fk" FOREIGN KEY ("canonical_event_id") REFERENCES "public"."canonical_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "canonical_events_canonical_key_key" ON "canonical_events" USING btree ("canonical_key");--> statement-breakpoint
CREATE INDEX "canonical_events_fingerprint_idx" ON "canonical_events" USING btree ("identity_fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "canonical_events_luma_event_id_key" ON "canonical_events" USING btree ("luma_event_id");--> statement-breakpoint
CREATE INDEX "canonical_events_start_at_idx" ON "canonical_events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "canonical_events_country_start_idx" ON "canonical_events" USING btree ("country_code","start_at");--> statement-breakpoint
CREATE INDEX "canonical_events_slug_idx" ON "canonical_events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "canonical_events_listed_start_idx" ON "canonical_events" USING btree ("listed","active","start_at");--> statement-breakpoint
CREATE INDEX "canonical_events_metro_idx" ON "canonical_events" USING btree ("metro");--> statement-breakpoint
CREATE UNIQUE INDEX "content_drafts_key_key" ON "content_drafts" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "event_sources_type_key_key" ON "event_sources" USING btree ("source_type","source_key");--> statement-breakpoint
CREATE INDEX "event_sources_canonical_event_idx" ON "event_sources" USING btree ("canonical_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_provider_source_id_key" ON "sources" USING btree ("provider_source_id");--> statement-breakpoint
CREATE INDEX "sources_next_sync_at_idx" ON "sources" USING btree ("next_sync_at");