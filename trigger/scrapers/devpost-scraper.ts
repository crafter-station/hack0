import { metadata, task } from "@trigger.dev/sdk/v3";
import { ingestEventCandidates } from "@/lib/ingestion/ingest";
import {
	type IngestionTaskPayload,
	ingestionModeFromWriteFlag,
} from "@/lib/ingestion/safety";
import { runPostProcessor } from "@/lib/scraper/post-processor";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

export const devpostScraperTask = task({
	id: "devpost-scraper",
	maxDuration: 600,
	run: async (payload: IngestionTaskPayload) => {
		const mode = ingestionModeFromWriteFlag(payload?.write);
		metadata.set("mode", mode);
		metadata.set("step", "scraping");
		const raw = await scrapeDevpost();
		metadata.set("found", raw.length);

		metadata.set("step", "post-processing");
		const {
			hackathons: filtered,
			droppedNonLatam,
			droppedNonHackathon,
			log,
		} = await runPostProcessor(raw);
		metadata.set("filtered", filtered.length);
		metadata.set("pipelineLog", JSON.parse(JSON.stringify(log)));

		metadata.set("step", "ingesting");
		const ingestion = await ingestEventCandidates(filtered, { mode });
		metadata.set("new", ingestion.wouldInsert);
		metadata.set("inserted", ingestion.inserted);

		metadata.set("step", "done");
		return {
			scraped: raw.length,
			filtered: filtered.length,
			dropped: droppedNonLatam + droppedNonHackathon,
			...ingestion,
			log,
		};
	},
});
