import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { checkEventConsistency } from "@/lib/ingestion/consistency";
import { auditEventCollection } from "@/lib/scraper/deduplicator";

async function main() {
	const existing = await db
		.select({
			id: events.id,
			slug: events.slug,
			name: events.name,
			startDate: events.startDate,
			endDate: events.endDate,
			registrationDeadline: events.registrationDeadline,
			format: events.format,
			country: events.country,
			city: events.city,
			websiteUrl: events.websiteUrl,
			registrationUrl: events.registrationUrl,
			devpostUrl: events.devpostUrl,
			scrapeSource: events.scrapeSource,
			scrapeSourceUrl: events.scrapeSourceUrl,
			externalId: sql<
				string | null
			>`${events.scrapeRawData} ->> 'externalId'`.as("external_id"),
		})
		.from(events);
	const duplicateReport = auditEventCollection(existing);
	const duplicateFindings = duplicateReport.decisions.filter(
		(decision) => decision.action !== "insert",
	);
	const consistencyFindings = existing
		.map((event) => ({
			eventId: event.id,
			name: event.name,
			...checkEventConsistency(event),
		}))
		.filter((result) => result.issues.length > 0);

	console.log(
		JSON.stringify(
			{
				mode: "read-only",
				duplicates: {
					...duplicateReport.summary,
					findings: duplicateFindings.slice(0, 100),
					reportTruncated: duplicateFindings.length > 100,
				},
				consistency: {
					withIssues: consistencyFindings.length,
					rejected: consistencyFindings.filter(
						(result) => result.status === "reject",
					).length,
					needsReview: consistencyFindings.filter(
						(result) => result.status === "review",
					).length,
					findings: consistencyFindings.slice(0, 100),
					reportTruncated: consistencyFindings.length > 100,
				},
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
