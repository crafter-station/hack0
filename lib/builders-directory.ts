import { and, desc, eq, ilike, type SQL, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventHosts, events, organizations } from "@/lib/db/schema";

const PERU = "PE";

export interface BuilderDirectoryEntry {
	hostKey: string;
	name: string;
	avatarUrl: string | null;
	eventCount: number;
	hostAppearances: number;
	organizationCount: number;
	upcomingEventCount: number;
	latestEventAt: Date | null;
	latestEventName: string | null;
	latestEventCode: string | null;
	latestOrganizationName: string | null;
}

export interface BuilderDirectorySummary {
	builders: number;
	hostAppearances: number;
	events: number;
	upcomingEvents: number;
}

export interface BuilderDirectoryFilters {
	search?: string;
	limit?: number;
}

function getHostKeySql() {
	return sql<string>`lower(trim(${eventHosts.name}))`;
}

function getBuilderConditions(search?: string): SQL[] {
	const conditions: SQL[] = [
		eq(events.isApproved, true),
		eq(events.country, PERU),
		sql`trim(${eventHosts.name}) <> ''`,
	];

	if (search?.trim()) {
		conditions.push(ilike(eventHosts.name, `%${search.trim()}%`));
	}

	return conditions;
}

export async function getBuilderDirectorySummary(): Promise<BuilderDirectorySummary> {
	const [row] = await db
		.select({
			builders: sql<number>`count(distinct ${getHostKeySql()})::int`,
			hostAppearances: sql<number>`count(${eventHosts.id})::int`,
			events: sql<number>`count(distinct ${eventHosts.eventId})::int`,
			upcomingEvents: sql<number>`count(distinct ${events.id}) filter (where ${events.endDate} is null or ${events.endDate} >= now())::int`,
		})
		.from(eventHosts)
		.innerJoin(events, eq(eventHosts.eventId, events.id))
		.where(and(...getBuilderConditions()));

	return {
		builders: Number(row?.builders || 0),
		hostAppearances: Number(row?.hostAppearances || 0),
		events: Number(row?.events || 0),
		upcomingEvents: Number(row?.upcomingEvents || 0),
	};
}

export async function getBuilderDirectoryEntries({
	search,
	limit = 72,
}: BuilderDirectoryFilters = {}): Promise<BuilderDirectoryEntry[]> {
	const hostKey = getHostKeySql();

	const rows = await db
		.select({
			hostKey,
			name: sql<string>`min(${eventHosts.name})`,
			avatarUrl: sql<
				string | null
			>`max(${eventHosts.avatarUrl}) filter (where ${eventHosts.avatarUrl} is not null)`,
			eventCount: sql<number>`count(distinct ${eventHosts.eventId})::int`,
			hostAppearances: sql<number>`count(${eventHosts.id})::int`,
			organizationCount: sql<number>`count(distinct ${events.organizationId})::int`,
			upcomingEventCount: sql<number>`count(distinct ${events.id}) filter (where ${events.endDate} is null or ${events.endDate} >= now())::int`,
			latestEventAt: sql<Date | null>`max(${events.startDate})`,
			latestEventName: sql<
				string | null
			>`(array_agg(${events.name} order by ${events.startDate} desc nulls last))[1]`,
			latestEventCode: sql<
				string | null
			>`(array_agg(${events.shortCode} order by ${events.startDate} desc nulls last))[1]`,
			latestOrganizationName: sql<
				string | null
			>`(array_agg(coalesce(${organizations.displayName}, ${organizations.name}) order by ${events.startDate} desc nulls last))[1]`,
		})
		.from(eventHosts)
		.innerJoin(events, eq(eventHosts.eventId, events.id))
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.where(and(...getBuilderConditions(search)))
		.groupBy(hostKey)
		.orderBy(
			desc(sql<number>`count(distinct ${eventHosts.eventId})`),
			desc(sql<Date>`max(${events.startDate})`),
		)
		.limit(limit);

	return rows.map((row) => ({
		hostKey: row.hostKey,
		name: row.name,
		avatarUrl: row.avatarUrl,
		eventCount: Number(row.eventCount || 0),
		hostAppearances: Number(row.hostAppearances || 0),
		organizationCount: Number(row.organizationCount || 0),
		upcomingEventCount: Number(row.upcomingEventCount || 0),
		latestEventAt: row.latestEventAt,
		latestEventName: row.latestEventName,
		latestEventCode: row.latestEventCode,
		latestOrganizationName: row.latestOrganizationName,
	}));
}
