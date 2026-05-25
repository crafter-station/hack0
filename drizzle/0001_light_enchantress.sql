CREATE TABLE "luma_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"connected_by_user_id" varchar(255) NOT NULL,
	"api_key_ciphertext" text NOT NULL,
	"api_key_iv" varchar(64) NOT NULL,
	"api_key_auth_tag" varchar(64) NOT NULL,
	"api_key_prefix" varchar(24) NOT NULL,
	"luma_user_name" varchar(255),
	"luma_user_email" varchar(255),
	"luma_user_api_id" varchar(100),
	"calendar_api_id" varchar(100),
	"calendar_name" varchar(255),
	"calendar_slug" varchar(255),
	"calendar_url" varchar(500),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "luma_connections" ADD CONSTRAINT "luma_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "luma_connection_org_idx" ON "luma_connections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "luma_connection_user_idx" ON "luma_connections" USING btree ("connected_by_user_id");