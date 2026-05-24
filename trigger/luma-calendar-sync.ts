import { metadata, schedules } from "@trigger.dev/sdk/v3";
import { syncLumaCalendarEvents } from "@/lib/luma/calendar-sync";

export const lumaCalendarSyncTask = schedules.task({
	id: "luma-calendar-sync",
	cron: "0 * * * *",
	maxDuration: 300,
	run: async () => {
		metadata.set("step", "syncing");
		const result = await syncLumaCalendarEvents({
			includePast: false,
			limit: 100,
		});
		metadata.set("fetched", result.fetched);
		metadata.set("created", result.created);
		metadata.set("updated", result.updated);
		metadata.set("skipped", result.skipped);
		metadata.set("step", "done");
		return result;
	},
});
