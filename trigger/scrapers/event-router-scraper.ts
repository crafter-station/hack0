import { metadata, task } from "@trigger.dev/sdk/v3";
import { ingestEventCandidates } from "@/lib/ingestion/ingest";
import {
	type IngestionTaskPayload,
	ingestionModeFromWriteFlag,
} from "@/lib/ingestion/safety";
import { fetchEventRouterCandidates } from "@/lib/scraper/sources/event-router";
import { eventIngestionQueue } from "@/trigger/event-ingestion-queue";

type EventRouterTaskPayload = IngestionTaskPayload & {
	maxEvents?: number;
	owned?: boolean;
};

export const eventRouterScraperTask = task({
	id: "event-router-scraper",
	queue: eventIngestionQueue,
	maxDuration: 300,
	run: async (payload: EventRouterTaskPayload) => {
		const mode = ingestionModeFromWriteFlag(payload?.write);
		metadata.set("mode", mode);
		metadata.set("step", "collecting");
		const collection = await fetchEventRouterCandidates({
			maxEvents: payload?.maxEvents,
			owned: payload?.owned,
		});
		metadata.set("found", collection.candidates.length);
		metadata.set("adapterRejected", collection.rejections.length);
		metadata.set("needsScopeReview", collection.reviews.length);
		metadata.set("outOfScope", collection.exclusions.length);

		metadata.set("step", "ingesting");
		const ingestion = await ingestEventCandidates(collection.candidates, {
			mode,
		});
		metadata.set("new", ingestion.wouldInsert);
		metadata.set("inserted", ingestion.inserted);
		metadata.set("step", "done");

		return {
			collected: collection.candidates.length,
			adapterRejected: collection.rejections.length,
			needsScopeReview: collection.reviews.length,
			scopeReviews: collection.reviews.slice(0, 25),
			outOfScope: collection.exclusions.length,
			source: collection.metadata,
			...ingestion,
		};
	},
});
