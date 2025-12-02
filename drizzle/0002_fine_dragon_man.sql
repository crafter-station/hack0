CREATE TYPE "public"."org_type" AS ENUM('community', 'university', 'student_org', 'company', 'government', 'ngo', 'bootcamp', 'other');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('not_contacted', 'connection_sent', 'connected', 'in_conversation', 'got_data', 'integrated', 'not_interested');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"role" varchar(255),
	"linkedin_url" varchar(500),
	"email" varchar(255),
	"outreach_status" "outreach_status" DEFAULT 'not_contacted',
	"is_connection" boolean DEFAULT false,
	"referred_by" varchar(255),
	"notes" text,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" "org_type" DEFAULT 'community',
	"linkedin_url" varchar(500),
	"website_url" varchar(500),
	"luma_url" varchar(500),
	"outreach_status" "outreach_status" DEFAULT 'not_contacted',
	"priority" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outreach_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"organization_id" uuid,
	"action" varchar(100) NOT NULL,
	"template_used" varchar(50),
	"message" text,
	"response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_logs" ADD CONSTRAINT "outreach_logs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_logs" ADD CONSTRAINT "outreach_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;