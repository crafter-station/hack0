import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import {
	LATAM_COUNTRY_OPTIONS,
	type LatamCountryOption,
} from "@/lib/latam-countries";

export type LatamCountryCoverage = LatamCountryOption & {
	events: number;
	upcomingEvents: number;
	communities: number;
	signal: number;
	status: "active" | "seed";
};

export async function getLatamCountryCoverage(): Promise<
	LatamCountryCoverage[]
> {
	const countryCodes = LATAM_COUNTRY_OPTIONS.map((country) => country.code);

	const [eventRows, communityRows] = await Promise.all([
		db
			.select({
				country: events.country,
				events: count(events.id),
				upcomingEvents: sql<number>`count(*) filter (where ${events.endDate} is null or ${events.endDate} >= now())::int`,
			})
			.from(events)
			.where(
				and(
					eq(events.isApproved, true),
					isNull(events.parentEventId),
					inArray(events.country, countryCodes),
				),
			)
			.groupBy(events.country)
			.orderBy(desc(count(events.id))),
		db
			.select({
				country: organizations.country,
				communities: count(organizations.id),
			})
			.from(organizations)
			.where(
				and(
					eq(organizations.isPublic, true),
					eq(organizations.isPersonalOrg, false),
					eq(organizations.type, "community"),
					inArray(organizations.country, countryCodes),
				),
			)
			.groupBy(organizations.country)
			.orderBy(desc(count(organizations.id))),
	]);

	const eventsByCountry = new Map(
		eventRows.map((row) => [
			row.country,
			{
				events: Number(row.events || 0),
				upcomingEvents: Number(row.upcomingEvents || 0),
			},
		]),
	);
	const communitiesByCountry = new Map(
		communityRows.map((row) => [row.country, Number(row.communities || 0)]),
	);

	return LATAM_COUNTRY_OPTIONS.map((country) => {
		const eventCounts = eventsByCountry.get(country.code);
		const eventsCount = eventCounts?.events || 0;
		const communitiesCount = communitiesByCountry.get(country.code) || 0;
		const signal = eventsCount + communitiesCount;

		return {
			...country,
			events: eventsCount,
			upcomingEvents: eventCounts?.upcomingEvents || 0,
			communities: communitiesCount,
			signal,
			status: signal > 0 ? ("active" as const) : ("seed" as const),
		};
	}).sort((a, b) => {
		if (b.signal !== a.signal) return b.signal - a.signal;
		return a.name.localeCompare(b.name, "es");
	});
}
