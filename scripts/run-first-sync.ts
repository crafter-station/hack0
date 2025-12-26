#!/usr/bin/env bun

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { externalCalendars } from "../lib/db/schema";
import { syncAllCalendars } from "../lib/external/sync";

async function main() {
	const startTime = Date.now();

	console.log("🔄 Starting first sync of external calendars...\n");

	const calendars = await db.query.externalCalendars.findMany({
		where: eq(externalCalendars.isActive, true),
	});

	if (calendars.length === 0) {
		console.log("⚠️  No active calendars found. Run seed script first:");
		console.log("   bun run scripts/seed-external-calendars.ts\n");
		return;
	}

	console.log(`📅 Found ${calendars.length} active calendars to sync:\n`);
	for (const cal of calendars) {
		console.log(`   • ${cal.slug} (${cal.name})`);
	}
	console.log("");

	const { results, totalStats } = await syncAllCalendars();

	const successful = results.filter((r) => r.result.success).length;
	const failed = results.filter((r) => !r.result.success).length;

	console.log("\n📊 Individual Results:\n");
	for (const { calendarSlug, result } of results) {
		if (result.success) {
			console.log(
				`✅ ${calendarSlug} (${result.stats.peopleFound} people, ${result.stats.eventsFound} events) - ${result.durationMs}ms`,
			);
		} else {
			console.log(`❌ ${calendarSlug} - ${result.error}`);
		}
	}

	const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

	console.log(`
═══════════════════════════════
Sync Complete
───────────────────────────────
Calendars synced: ${successful}/${calendars.length}
Failed: ${failed}
───────────────────────────────
Total people: ${totalStats.peopleFound.toLocaleString()}
  Created: ${totalStats.peopleCreated.toLocaleString()}
  Updated: ${totalStats.peopleUpdated.toLocaleString()}
───────────────────────────────
Total events: ${totalStats.eventsFound.toLocaleString()}
  Created: ${totalStats.eventsCreated.toLocaleString()}
  Updated: ${totalStats.eventsUpdated.toLocaleString()}
───────────────────────────────
Users linked: ${totalStats.usersLinked}
Duration: ${totalDuration}s
═══════════════════════════════
`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
