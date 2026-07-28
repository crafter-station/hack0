import { queue } from "@trigger.dev/sdk/v3";

export const eventIngestionQueue = queue({
	name: "event-ingestion",
	concurrencyLimit: 1,
});
