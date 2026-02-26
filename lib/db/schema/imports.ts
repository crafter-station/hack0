import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	importStatusEnum,
	scrapeRunStatusEnum,
	scrapeSourceTypeEnum,
	syncFrequencyEnum,
} from "./enums";
import { events } from "./events";
import { organizations } from "./organizations";

// ============================================
// IMPORT JOBS - For Luma/external event imports
// ============================================

export const importJobs = pgTable("import_jobs", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),
	sourceUrl: varchar("source_url", { length: 500 }).notNull(),
	sourceType: varchar("source_type", { length: 50 }).default("luma"),
	status: importStatusEnum("status").default("pending"),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	eventId: uuid("event_id").references(() => events.id),
	extractedData: text("extracted_data"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;

// ============================================
// MULTI-SOURCE SCRAPING - Scheduled scraping system
// ============================================

export const scrapeSources = pgTable("scrape_sources", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	sourceType: scrapeSourceTypeEnum("source_type").notNull(),
	sourceUrl: varchar("source_url", { length: 500 }).notNull(),
	isActive: boolean("is_active").default(true),
	scrapeFrequency: syncFrequencyEnum("scrape_frequency").default("daily"),
	lastScrapeAt: timestamp("last_scrape_at", {
		mode: "date",
		withTimezone: true,
	}),
	config: text("config"),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type ScrapeSource = typeof scrapeSources.$inferSelect;
export type NewScrapeSource = typeof scrapeSources.$inferInsert;

export const scrapeRuns = pgTable("scrape_runs", {
	id: uuid("id").primaryKey().defaultRandom(),
	sourceId: uuid("source_id")
		.references(() => scrapeSources.id)
		.notNull(),
	status: scrapeRunStatusEnum("status").default("pending"),
	eventsFound: integer("events_found").default(0),
	eventsCreated: integer("events_created").default(0),
	eventsUpdated: integer("events_updated").default(0),
	errorMessage: text("error_message"),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type NewScrapeRun = typeof scrapeRuns.$inferInsert;

export const rssFeedSubscriptions = pgTable("rss_feed_subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id").references(() => organizations.id),
	feedUrl: varchar("feed_url", { length: 500 }).notNull(),
	feedTitle: varchar("feed_title", { length: 255 }),
	isActive: boolean("is_active").default(true),
	lastFetchedAt: timestamp("last_fetched_at", {
		mode: "date",
		withTimezone: true,
	}),
	lastItemGuid: varchar("last_item_guid", { length: 500 }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type RssFeedSubscription = typeof rssFeedSubscriptions.$inferSelect;
export type NewRssFeedSubscription = typeof rssFeedSubscriptions.$inferInsert;
