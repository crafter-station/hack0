import "dotenv/config";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { normalizeHackathon } from "@/lib/scraper/normalizer";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

async function main() {
	console.log("🌱 Seeding scraper events from Devpost...\n");
	const raw = await scrapeDevpost();
	console.log(`✅ ${raw.length} raw events`);
	const isValidDate = (d: unknown) =>
		d instanceof Date && !Number.isNaN(d.getTime());
	const newEvents = raw.map(normalizeHackathon).filter((e) => {
		if (e.startDate && !isValidDate(e.startDate)) return false;
		if (e.endDate && !isValidDate(e.endDate)) return false;
		if (e.registrationDeadline && !isValidDate(e.registrationDeadline))
			return false;
		return true;
	});
	if (newEvents.length > 0) {
		await db.insert(events).values(newEvents).onConflictDoNothing();
		console.log(
			`✅ Inserted ${newEvents.length} events with approvalStatus: pending`,
		);
	} else {
		console.log("⚠️  No new events to insert");
	}
}

main().catch(console.error);
