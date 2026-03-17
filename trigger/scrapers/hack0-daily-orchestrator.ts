import { schedules } from "@trigger.dev/sdk/v3";
import { devpostScraperTask } from "./devpost-scraper";
import { eventbriteScraperTask } from "./eventbrite-scraper";
import { mlhScraperTask } from "./mlh-scraper";

/**
 * Fires the 3 free scrapers (devpost, mlh, eventbrite) every day at 05:00 UTC.
 * Each scraper runs as an independent subtask so failures are isolated.
 */
export const hack0DailyOrchestrator = schedules.task({
	id: "hack0-daily-orchestrator",
	cron: "0 5 * * *",
	maxDuration: 60,
	run: async () => {
		await Promise.all([
			devpostScraperTask.trigger({}),
			mlhScraperTask.trigger({}),
			eventbriteScraperTask.trigger({}),
		]);
	},
});
