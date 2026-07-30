CREATE TYPE "public"."event_source_link_status" AS ENUM('pending', 'active', 'error', 'removed');--> statement-breakpoint
CREATE TYPE "public"."event_source_link_type" AS ENUM('origin', 'calendar_listing');--> statement-breakpoint
CREATE TYPE "public"."event_source_sync_mode" AS ENUM('inbound', 'outbound', 'bidirectional');--> statement-breakpoint
CREATE TABLE "event_source_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"connection_id" uuid,
	"provider" varchar(50) NOT NULL,
	"link_type" "event_source_link_type" NOT NULL,
	"identity_key" varchar(700) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"external_url" varchar(500),
	"calendar_external_id" varchar(255),
	"sync_mode" "event_source_sync_mode" DEFAULT 'inbound' NOT NULL,
	"status" "event_source_link_status" DEFAULT 'active' NOT NULL,
	"last_inbound_at" timestamp with time zone,
	"last_outbound_at" timestamp with time zone,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_source_links" ADD CONSTRAINT "event_source_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_source_links" ADD CONSTRAINT "event_source_links_connection_id_luma_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."luma_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_source_link_identity_idx" ON "event_source_links" USING btree ("identity_key");--> statement-breakpoint
CREATE INDEX "event_source_link_event_idx" ON "event_source_links" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_source_link_external_idx" ON "event_source_links" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "event_source_link_calendar_idx" ON "event_source_links" USING btree ("provider","calendar_external_id");