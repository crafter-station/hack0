import { metadata, task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { deduplicateAgainstDB } from "@/lib/scraper/deduplicator";
import { normalizeHackathon } from "@/lib/scraper/normalizer";
import { runPostProcessor } from "@/lib/scraper/post-processor";
import { scrapeUniversities } from "@/lib/scraper/sources/universities";

export const universitiesScraperTask = task({
	id: "universities-scraper",
	maxDuration: 600,
	run: async () => {
		metadata.set("step", "scraping");
		const raw = await scrapeUniversities();
		metadata.set("found", raw.length);

		metadata.set("step", "post-processing");
		const {
			hackathons: filtered,
			droppedNonLatam,
			droppedNonHackathon,
		} = await runPostProcessor(raw);
		metadata.set("filtered", filtered.length);

		metadata.set("step", "normalizing");
		const normalized = filtered.map(normalizeHackathon);

		metadata.set("step", "deduplicating");
		const newEvents = await deduplicateAgainstDB(normalized);
		metadata.set("new", newEvents.length);

		if (newEvents.length > 0) {
			metadata.set("step", "inserting");
			await db.insert(events).values(newEvents).onConflictDoNothing();
		}

		metadata.set("step", "done");
		return {
			scraped: raw.length,
			filtered: filtered.length,
			dropped: droppedNonLatam + droppedNonHackathon,
			inserted: newEvents.length,
		};
	},
});
