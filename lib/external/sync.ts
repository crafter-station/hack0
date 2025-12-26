import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import {
	externalCalendars,
	externalEvents,
	externalPeople,
	externalSyncRuns,
	users,
} from "../db/schema";
import { getGlobalLumaClient } from "../luma/client";

const RATE_LIMIT_DELAY_MS = 500;

export interface SyncStats {
	peopleFound: number;
	peopleCreated: number;
	peopleUpdated: number;
	eventsFound: number;
	eventsCreated: number;
	eventsUpdated: number;
	usersLinked: number;
}

export interface SyncResult {
	success: boolean;
	syncRunId: string;
	stats: SyncStats;
	durationMs: number;
	error?: string;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateContentHash(data: unknown): string {
	return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export async function syncCalendarPeople(
	calendarId: string,
): Promise<{
	peopleFound: number;
	peopleCreated: number;
	peopleUpdated: number;
}> {
	const calendar = await db.query.externalCalendars.findFirst({
		where: eq(externalCalendars.id, calendarId),
	});

	if (!calendar) {
		throw new Error(`Calendar not found: ${calendarId}`);
	}

	const lumaClient = getGlobalLumaClient();
	const people = await lumaClient.getAllCalendarPeople(calendar.externalId);

	let created = 0;
	let updated = 0;

	for (const person of people) {
		const existing = await db.query.externalPeople.findFirst({
			where: and(
				eq(externalPeople.calendarId, calendarId),
				eq(externalPeople.externalId, person.api_id),
			),
		});

		const personData = {
			sourceType: "luma" as const,
			externalId: person.api_id,
			calendarId: calendarId,
			email: person.email,
			name: person.name || null,
			firstName: person.first_name || null,
			lastName: person.last_name || null,
			avatarUrl: person.avatar_url || null,
			eventApprovedCount: person.event_approved_count || 0,
			eventCheckedInCount: person.event_checked_in_count || 0,
			revenueUsdCents: person.revenue_usd_cents || 0,
			tags: person.tags || null,
			membershipTierId: person.membership_tier_id || null,
			membershipStatus: person.membership_status || null,
			lastSeenAt: new Date(),
		};

		if (existing) {
			await db
				.update(externalPeople)
				.set({ ...personData, updatedAt: new Date() })
				.where(eq(externalPeople.id, existing.id));
			updated++;
		} else {
			await db.insert(externalPeople).values(personData);
			created++;
		}
	}

	await db
		.update(externalCalendars)
		.set({ totalPeople: people.length, updatedAt: new Date() })
		.where(eq(externalCalendars.id, calendarId));

	return {
		peopleFound: people.length,
		peopleCreated: created,
		peopleUpdated: updated,
	};
}

export async function syncCalendarEvents(
	calendarId: string,
): Promise<{
	eventsFound: number;
	eventsCreated: number;
	eventsUpdated: number;
}> {
	const calendar = await db.query.externalCalendars.findFirst({
		where: eq(externalCalendars.id, calendarId),
	});

	if (!calendar) {
		throw new Error(`Calendar not found: ${calendarId}`);
	}

	const lumaClient = getGlobalLumaClient();
	const events = await lumaClient.getAllPublicCalendarEvents(
		calendar.externalId,
	);

	let created = 0;
	let updated = 0;

	for (const event of events) {
		const existing = await db.query.externalEvents.findFirst({
			where: and(
				eq(externalEvents.sourceType, "luma"),
				eq(externalEvents.externalId, event.api_id),
			),
		});

		const contentHash = generateContentHash({
			name: event.name,
			description: event.description,
			start_at: event.start_at,
			end_at: event.end_at,
		});

		const eventData = {
			sourceType: "luma" as const,
			externalId: event.api_id,
			calendarId: calendarId,
			name: event.name,
			description: event.description || null,
			slug: event.slug || null,
			url: event.url || null,
			coverUrl: event.cover_url || null,
			startsAt: event.start_at ? new Date(event.start_at) : null,
			endsAt: event.end_at ? new Date(event.end_at) : null,
			timezone: event.timezone || null,
			isVirtual: !!event.meeting_url,
			address:
				event.geo_address_json?.full_address ||
				event.geo_address_json?.address ||
				null,
			city: event.geo_address_json?.city || null,
			region: event.geo_address_json?.region || null,
			country: event.geo_address_json?.country || null,
			latitude: event.geo_latitude || null,
			longitude: event.geo_longitude || null,
			meetingUrl: event.meeting_url || null,
			guestLimit: event.guest_limit || null,
			registrationCount: event.registration_count || 0,
			hosts: event.hosts || null,
			rawData: event,
			contentHash,
			lastSeenAt: new Date(),
		};

		if (existing) {
			await db
				.update(externalEvents)
				.set({ ...eventData, updatedAt: new Date() })
				.where(eq(externalEvents.id, existing.id));
			updated++;
		} else {
			await db.insert(externalEvents).values(eventData);
			created++;
		}
	}

	await db
		.update(externalCalendars)
		.set({ totalEvents: events.length, updatedAt: new Date() })
		.where(eq(externalCalendars.id, calendarId));

	return {
		eventsFound: events.length,
		eventsCreated: created,
		eventsUpdated: updated,
	};
}

export async function syncCalendar(calendarId: string): Promise<SyncResult> {
	const startTime = Date.now();

	const calendar = await db.query.externalCalendars.findFirst({
		where: eq(externalCalendars.id, calendarId),
	});

	if (!calendar) {
		return {
			success: false,
			syncRunId: "",
			stats: {
				peopleFound: 0,
				peopleCreated: 0,
				peopleUpdated: 0,
				eventsFound: 0,
				eventsCreated: 0,
				eventsUpdated: 0,
				usersLinked: 0,
			},
			durationMs: Date.now() - startTime,
			error: `Calendar not found: ${calendarId}`,
		};
	}

	const [syncRun] = await db
		.insert(externalSyncRuns)
		.values({
			calendarId,
			syncType: "full",
			status: "running",
			startedAt: new Date(),
			triggeredBy: "manual",
		})
		.returning();

	try {
		const peopleStats = await syncCalendarPeople(calendarId);
		const eventsStats = await syncCalendarEvents(calendarId);

		const durationMs = Date.now() - startTime;

		await db
			.update(externalSyncRuns)
			.set({
				status: "completed",
				completedAt: new Date(),
				durationMs,
				peopleFound: peopleStats.peopleFound,
				peopleCreated: peopleStats.peopleCreated,
				peopleUpdated: peopleStats.peopleUpdated,
				eventsFound: eventsStats.eventsFound,
				eventsCreated: eventsStats.eventsCreated,
				eventsUpdated: eventsStats.eventsUpdated,
			})
			.where(eq(externalSyncRuns.id, syncRun.id));

		await db
			.update(externalCalendars)
			.set({
				lastSyncAt: new Date(),
				lastSyncStatus: "completed",
			})
			.where(eq(externalCalendars.id, calendarId));

		return {
			success: true,
			syncRunId: syncRun.id,
			stats: {
				...peopleStats,
				...eventsStats,
				usersLinked: 0,
			},
			durationMs,
		};
	} catch (error) {
		const durationMs = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : String(error);

		await db
			.update(externalSyncRuns)
			.set({
				status: "failed",
				completedAt: new Date(),
				durationMs,
				errorMessage,
				errorDetails: {
					error: errorMessage,
					stack: error instanceof Error ? error.stack : undefined,
				},
			})
			.where(eq(externalSyncRuns.id, syncRun.id));

		await db
			.update(externalCalendars)
			.set({
				lastSyncAt: new Date(),
				lastSyncStatus: "failed",
			})
			.where(eq(externalCalendars.id, calendarId));

		return {
			success: false,
			syncRunId: syncRun.id,
			stats: {
				peopleFound: 0,
				peopleCreated: 0,
				peopleUpdated: 0,
				eventsFound: 0,
				eventsCreated: 0,
				eventsUpdated: 0,
				usersLinked: 0,
			},
			durationMs,
			error: errorMessage,
		};
	}
}

export async function linkExternalPeopleToUsers(): Promise<number> {
	const unlinkedPeople = await db.query.externalPeople.findMany({
		where: isNull(externalPeople.userId),
	});

	let linked = 0;

	for (const person of unlinkedPeople) {
		if (!person.email) continue;

		const user = await db.query.users.findFirst({
			where: eq(users.email, person.email),
		});

		if (user) {
			await db
				.update(externalPeople)
				.set({ userId: user.id, updatedAt: new Date() })
				.where(eq(externalPeople.id, person.id));
			linked++;
		}
	}

	return linked;
}

export async function syncAllCalendars(): Promise<{
	results: Array<{ calendarSlug: string; result: SyncResult }>;
	totalStats: SyncStats;
}> {
	const calendars = await db.query.externalCalendars.findMany({
		where: eq(externalCalendars.isActive, true),
	});

	const results: Array<{ calendarSlug: string; result: SyncResult }> = [];
	const totalStats: SyncStats = {
		peopleFound: 0,
		peopleCreated: 0,
		peopleUpdated: 0,
		eventsFound: 0,
		eventsCreated: 0,
		eventsUpdated: 0,
		usersLinked: 0,
	};

	for (const calendar of calendars) {
		const result = await syncCalendar(calendar.id);
		results.push({ calendarSlug: calendar.slug, result });

		if (result.success) {
			totalStats.peopleFound += result.stats.peopleFound;
			totalStats.peopleCreated += result.stats.peopleCreated;
			totalStats.peopleUpdated += result.stats.peopleUpdated;
			totalStats.eventsFound += result.stats.eventsFound;
			totalStats.eventsCreated += result.stats.eventsCreated;
			totalStats.eventsUpdated += result.stats.eventsUpdated;
		}

		await sleep(RATE_LIMIT_DELAY_MS);
	}

	const usersLinked = await linkExternalPeopleToUsers();
	totalStats.usersLinked = usersLinked;

	return { results, totalStats };
}
