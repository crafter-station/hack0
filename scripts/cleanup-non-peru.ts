/**
 * Cleanup Script - Delete non-Peru events
 *
 * Usage:
 *   bun run scripts/cleanup-non-peru.ts
 *
 * This script deletes all events that are not from Peru (PE) or Global (GLOBAL).
 * Run this once to clean up the database for the Peru-focused launch.
 *
 * Requires:
 *   - DATABASE_URL env variable
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { events } from "../lib/db/schema";

async function main() {
	console.log("Starting cleanup of non-Peru events...\n");

	// First, let's see what we have
	const allEvents = await db
		.select({
			id: events.id,
			name: events.name,
			country: events.country,
		})
		.from(events);

	console.log(`Total events in database: ${allEvents.length}\n`);

	// Group by country
	const byCountry = allEvents.reduce(
		(acc, event) => {
			const country = event.country || "NULL";
			acc[country] = (acc[country] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	console.log("Events by country:");
	Object.entries(byCountry)
		.sort((a, b) => b[1] - a[1])
		.forEach(([country, count]) => {
			console.log(`  ${country}: ${count}`);
		});

	// Find events to delete (not PE or GLOBAL)
	const toDelete = allEvents.filter(
		(e) => e.country !== "PE" && e.country !== "GLOBAL" && e.country !== null,
	);

	console.log(`\nEvents to delete (not PE or GLOBAL): ${toDelete.length}`);

	if (toDelete.length === 0) {
		console.log("\nNo events to delete. Database is clean!");
		return;
	}

	console.log("\nEvents that will be deleted:");
	toDelete.forEach((e) => {
		console.log(`  - [${e.country}] ${e.name}`);
	});

	// Ask for confirmation via environment variable
	if (process.env.CONFIRM_DELETE !== "true") {
		console.log("\n⚠️  To actually delete these events, run with:");
		console.log("   CONFIRM_DELETE=true bun run scripts/cleanup-non-peru.ts");
		return;
	}

	// Delete the events
	console.log("\nDeleting events...");

	const _result = await db
		.delete(events)
		.where(
			sql`${events.country} IS NOT NULL AND ${events.country} != 'PE' AND ${events.country} != 'GLOBAL'`,
		);

	console.log(`\n✅ Deleted ${toDelete.length} events.`);

	// Verify
	const remaining = await db
		.select({
			id: events.id,
			country: events.country,
		})
		.from(events);

	const remainingByCountry = remaining.reduce(
		(acc, event) => {
			const country = event.country || "NULL";
			acc[country] = (acc[country] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	console.log("\nRemaining events by country:");
	Object.entries(remainingByCountry)
		.sort((a, b) => b[1] - a[1])
		.forEach(([country, count]) => {
			console.log(`  ${country}: ${count}`);
		});
}

main().catch(console.error);
