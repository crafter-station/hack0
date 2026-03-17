import { schedules } from "@trigger.dev/sdk/v3";
// import { hackathonComScraperTask } from "./hackathon-com-scraper"; // disabled: Perplexity quota
// import { universitiesScraperTask } from "./universities-scraper"; // disabled: low ROI
// import { perplexityScraperTask } from "./perplexity-scraper"; // disabled: Perplexity quota
import { exaScraperTask } from "./exa-scraper";
import { meetupScraperTask } from "./meetup-scraper";
// import { haikuScraperTask } from "./haiku-scraper"; // disabled: expensive (Anthropic API)
/**
 * Fires the 2 paid scrapers every Monday at 08:00 UTC.
 * Each scraper runs as an independent subtask so failures are isolated.
 *
 * Disabled scrapers (kept in codebase, not triggered):
 * - hackathon-com: Perplexity API quota exceeded
 * - perplexity: Perplexity API quota exceeded
 * - universities: low ROI
 * - haiku: expensive (Anthropic API)
 */
export const hack0WeeklyOrchestrator = schedules.task({
	id: "hack0-weekly-orchestrator",
	cron: "0 8 * * 1",
	maxDuration: 60,
	run: async () => {
		await meetupScraperTask.trigger({});
		await exaScraperTask.trigger({});
	},
});
