CREATE TABLE "organization_logos" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"bytes" "bytea" NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"country" text NOT NULL,
	"city" text,
	"website_url" text,
	"logo_url" text,
	"logo_tone" text,
	"logo_aspect" double precision,
	"hiring_url" text,
	"lat" double precision,
	"lng" double precision,
	"source_url" text NOT NULL,
	"verified_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_logos" ADD CONSTRAINT "organization_logos_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_country_status_idx" ON "organizations" USING btree ("country","status");