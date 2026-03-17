import { PendingInbox } from "@/components/admin/pending/pending-inbox";
import {
	getAllOrganizationsForSelect,
	getEventsWithoutOrg,
} from "@/lib/actions/pending-events";
import {
	getScraperInbox,
	getScraperStats,
} from "@/lib/actions/scraper-curation";

export const metadata = {
	title: "Pending - God Mode",
	description: "Curación de eventos scrapeados y asignación de organizaciones",
};

export default async function PendingPage() {
	const [events, stats, orphanEvents, organizations] = await Promise.all([
		getScraperInbox("all"),
		getScraperStats(),
		getEventsWithoutOrg(),
		getAllOrganizationsForSelect(),
	]);

	return (
		<PendingInbox
			initialEvents={events}
			stats={stats}
			orphanEvents={orphanEvents}
			organizations={organizations}
		/>
	);
}
