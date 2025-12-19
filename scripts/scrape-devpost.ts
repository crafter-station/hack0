/**
 * Devpost Scraper Script
 *
 * Usage:
 *   bun run scripts/scrape-devpost.ts
 *
 * This script scrapes LATAM hackathons from Devpost using Firecrawl
 * and inserts them into the database.
 *
 * Requires:
 *   - DATABASE_URL env variable
 *   - FIRECRAWL_API_KEY env variable
 */

import "dotenv/config";
import { db } from "../lib/db";
import { events, type NewEvent } from "../lib/db/schema";
import {
	generateSlug,
	inferDomains,
	inferEventType,
	inferJuniorFriendly,
	inferOrganizerType,
	parseLocation,
	parsePrizeAmount,
	type ScrapedEvent,
	scrapeAllDevpostPages,
} from "../lib/scraper/firecrawl";

function mapToEvent(scraped: ScrapedEvent): NewEvent {
	const location = parseLocation(scraped.location || "virtual");
	const prizePool = parsePrizeAmount(scraped.prizeAmount);
	const domains = inferDomains(
		scraped.name,
		scraped.description || "",
		scraped.themes,
	);
	const eventType = inferEventType(scraped.name, scraped.description || "");
	const organizerType = inferOrganizerType(scraped.organizerName);
	const isJuniorFriendly = inferJuniorFriendly(
		scraped.name,
		scraped.description || "",
	);

	return {
		slug: generateSlug(scraped.name),
		name: scraped.name,
		description: scraped.description || null,
		eventType,
		startDate: scraped.startDate ? new Date(scraped.startDate) : null,
		endDate: scraped.endDate ? new Date(scraped.endDate) : null,
		format: location.format,
		country: location.country,
		city: location.city || null,
		skillLevel: "all", // Default, can be refined later
		domains,
		prizePool,
		prizeDescription: scraped.prizeAmount || null,
		websiteUrl: scraped.url,
		registrationUrl: scraped.url,
		devpostUrl: scraped.url.includes("devpost.com") ? scraped.url : null,
		eventImageUrl: scraped.logoUrl || null,
		organizerName: scraped.organizerName || null,
		organizerType,
		isJuniorFriendly,
		status: "upcoming", // Will be calculated based on dates
		isFeatured: false,
		isApproved: true, // Auto-approve scraped events
		sourceScrapedAt: new Date(),
	};
}

async function main() {
	console.log("🔍 Starting Devpost scraper...\n");

	// Check for required env variables
	if (!process.env.FIRECRAWL_API_KEY) {
		console.error("❌ FIRECRAWL_API_KEY environment variable is required");
		process.exit(1);
	}

	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL environment variable is required");
		process.exit(1);
	}

	try {
		// Scrape all Devpost pages
		const scrapedHackathons = await scrapeAllDevpostPages();

		if (scrapedHackathons.length === 0) {
			console.log("⚠️ No hackathons found. Exiting.");
			return;
		}

		console.log(`\n📦 Processing ${scrapedHackathons.length} events...\n`);

		// Map to database format
		const eventData = scrapedHackathons.map(mapToEvent);

		// Insert into database (upsert by slug)
		let inserted = 0;
		let skipped = 0;

		for (const event of eventData) {
			try {
				// Check if already exists
				const existing = await db.query.events.findFirst({
					where: (e, { eq }) => eq(e.slug, event.slug),
				});

				if (existing) {
					console.log(`⏭️  Skipping (exists): ${event.name}`);
					skipped++;
					continue;
				}

				// Insert new event
				await db.insert(events).values(event);
				console.log(`✅ Inserted: ${event.name}`);
				inserted++;
			} catch (error) {
				console.error(`❌ Error inserting ${event.name}:`, error);
			}
		}

		console.log("\n📊 Summary:");
		console.log(`   Inserted: ${inserted}`);
		console.log(`   Skipped:  ${skipped}`);
		console.log(`   Total:    ${scrapedHackathons.length}`);
	} catch (error) {
		console.error("❌ Scraping failed:", error);
		process.exit(1);
	}
}

main();
