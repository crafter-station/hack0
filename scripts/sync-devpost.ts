import "dotenv/config";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { deduplicateAgainstDB } from "@/lib/scraper/deduplicator";
import { normalizeHackathon } from "@/lib/scraper/normalizer";
import { runPostProcessor } from "@/lib/scraper/post-processor";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

const dryRun = process.argv.includes("--dry-run");
const skipPostProcess = process.argv.includes("--skip-post-process");

function isValidDate(value: unknown) {
	return value instanceof Date && !Number.isNaN(value.getTime());
}

async function main() {
	console.log("[devpost-sync] scraping Devpost");
	const raw = await scrapeDevpost();

	const filtered = skipPostProcess
		? raw
		: (await runPostProcessor(raw)).hackathons;

	const normalized = filtered.map(normalizeHackathon).filter((event) => {
		if (event.startDate && !isValidDate(event.startDate)) return false;
		if (event.endDate && !isValidDate(event.endDate)) return false;
		if (
			event.registrationDeadline &&
			!isValidDate(event.registrationDeadline)
		) {
			return false;
		}
		return true;
	});

	const newEvents = await deduplicateAgainstDB(normalized);

	if (!dryRun && newEvents.length > 0) {
		await db.insert(events).values(newEvents).onConflictDoNothing();
	}

	console.log(
		JSON.stringify(
			{
				scraped: raw.length,
				filtered: filtered.length,
				normalized: normalized.length,
				inserted: dryRun ? 0 : newEvents.length,
				dryRun,
				skipPostProcess,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
