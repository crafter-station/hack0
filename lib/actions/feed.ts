"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	communityMembers,
	type Event,
	events,
	organizations,
} from "@/lib/db/schema";
import { getUserPreferences } from "./user-preferences";

export interface FeedEvent extends Event {
	organization: typeof organizations.$inferSelect | null;
	relevanceScore: number;
	relevanceReasons: string[];
}

export type FeedFilterType =
	| "all"
	| "following"
	| "competitions"
	| "learning"
	| "community";

interface FeedOptions {
	limit?: number;
	cursor?: string;
	includeEnded?: boolean;
	filter?: FeedFilterType;
}

export async function getPersonalizedFeed(options: FeedOptions = {}): Promise<{
	events: FeedEvent[];
	nextCursor: string | null;
	hasMore: boolean;
}> {
	const { userId } = await auth();
	if (!userId) {
		return { events: [], nextCursor: null, hasMore: false };
	}

	const { limit = 20, cursor, includeEnded = false, filter = "all" } = options;
	const prefs = await getUserPreferences();

	// Get communities the user follows
	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		columns: { communityId: true },
	});

	const followedCommunityIds = followedCommunities.map((m) => m.communityId);

	// Event type mapping for filters
	const competitionTypes = ["hackathon", "olympiad", "competition", "robotics"];
	const learningTypes = [
		"workshop",
		"bootcamp",
		"course",
		"certification",
		"summer_school",
	];
	const communityTypes = ["meetup", "networking", "conference", "seminar"];

	// Build base query
	const now = new Date();
	const baseConditions = [
		cursor ? sql`${events.createdAt} < ${new Date(cursor)}` : undefined,
		!includeEnded ? gte(events.endDate, now) : undefined,
	].filter(Boolean);

	// Fetch events with organizations
	const allEvents = await db.query.events.findMany({
		where: baseConditions.length > 0 ? and(...baseConditions) : undefined,
		with: {
			organization: true,
		},
		orderBy: [desc(events.createdAt)],
		limit: limit * 3, // Fetch more for better ranking
	});

	// Score and rank events
	const scoredEvents = allEvents.map((event) => {
		let score = 0;
		const reasons: string[] = [];

		// 1. From followed communities (highest priority)
		if (
			event.organizationId &&
			followedCommunityIds.includes(event.organizationId)
		) {
			score += 100;
			reasons.push("De una comunidad que sigues");
		}

		// 2. Location match
		if (prefs?.department && event.department === prefs.department) {
			score += 50;
			reasons.push(`En ${prefs.department}`);
		}

		// 3. Format preference match
		if (prefs?.formatPreference && prefs.formatPreference !== "any") {
			if (event.format === prefs.formatPreference) {
				score += 30;
				reasons.push(`Formato ${event.format}`);
			} else if (event.format === "hybrid") {
				score += 15;
				reasons.push("Formato híbrido");
			}
		}

		// 4. Skill level match
		if (prefs?.skillLevel && prefs.skillLevel !== "all") {
			if (event.skillLevel === prefs.skillLevel || event.skillLevel === "all") {
				score += 20;
				reasons.push(`Nivel ${event.skillLevel}`);
			}
		}

		// 5. Boost for ongoing/open events
		if (event.status === "ongoing") {
			score += 40;
			reasons.push("Evento en curso");
		} else if (event.status === "open") {
			score += 30;
			reasons.push("Inscripciones abiertas");
		}

		// 6. Boost for upcoming events (starting soon)
		if (event.startDate) {
			const startDate =
				event.startDate instanceof Date
					? event.startDate
					: new Date(event.startDate);
			const daysUntilStart = Math.ceil(
				(startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (daysUntilStart <= 7 && daysUntilStart >= 0) {
				score += 25;
				reasons.push("Comienza pronto");
			}
		}

		// 7. Boost for featured/verified organizers
		if (event.organization?.isVerified) {
			score += 15;
			reasons.push("Organizador verificado");
		}

		// 8. Boost for events with prizes (for members who like competitions)
		if (event.prizePool && event.prizePool > 0) {
			score += 10;
			reasons.push(
				`${event.prizeCurrency === "USD" ? "$" : "S/"}${event.prizePool.toLocaleString()} en premios`,
			);
		}

		// 9. Recency boost (newer events get small boost)
		const hoursOld = Math.floor(
			(now.getTime() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60),
		);
		if (hoursOld < 24) {
			score += 10;
			reasons.push("Publicado recientemente");
		}

		return {
			...event,
			relevanceScore: score,
			relevanceReasons: reasons,
		};
	});

	// Apply filter
	let filteredEvents = scoredEvents;
	if (filter === "following") {
		// Only events from followed communities
		filteredEvents = scoredEvents.filter(
			(e) =>
				e.organizationId && followedCommunityIds.includes(e.organizationId),
		);
	} else if (filter === "competitions") {
		filteredEvents = scoredEvents.filter(
			(e) => e.eventType && competitionTypes.includes(e.eventType),
		);
	} else if (filter === "learning") {
		filteredEvents = scoredEvents.filter(
			(e) => e.eventType && learningTypes.includes(e.eventType),
		);
	} else if (filter === "community") {
		filteredEvents = scoredEvents.filter(
			(e) => e.eventType && communityTypes.includes(e.eventType),
		);
	}

	// Sort by score and take top results
	const rankedEvents = filteredEvents
		.sort((a, b) => b.relevanceScore - a.relevanceScore)
		.slice(0, limit);

	const hasMore = allEvents.length >= limit * 3;
	const lastEvent = rankedEvents[rankedEvents.length - 1];
	const nextCursor =
		hasMore && lastEvent && lastEvent.createdAt
			? lastEvent.createdAt.toISOString()
			: null;

	return {
		events: rankedEvents,
		nextCursor,
		hasMore,
	};
}

export async function getFollowedCommunitiesStats() {
	const { userId } = await auth();
	if (!userId) return { count: 0, communities: [] };

	const followed = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		with: {
			community: {
				columns: {
					id: true,
					name: true,
					displayName: true,
					slug: true,
					logoUrl: true,
					isVerified: true,
				},
			},
		},
		limit: 10,
	});

	return {
		count: followed.length,
		communities: followed.map((f) => f.community),
	};
}

export async function getSuggestedCommunities(limit = 3) {
	const { userId } = await auth();
	if (!userId) return [];

	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		columns: { communityId: true },
	});

	const followedIds = followedCommunities.map((m) => m.communityId);

	const suggestedCommunities = await db.query.organizations.findMany({
		where:
			followedIds.length > 0
				? and(
						eq(organizations.type, "community"),
						eq(organizations.isPersonalOrg, false),
						sql`${organizations.id} NOT IN ${followedIds}`,
					)
				: and(
						eq(organizations.type, "community"),
						eq(organizations.isPersonalOrg, false),
					),
		orderBy: [desc(organizations.isVerified), desc(organizations.createdAt)],
		limit,
	});

	const communitiesWithStats = await Promise.all(
		suggestedCommunities.map(async (community) => {
			const [memberCountResult, upcomingEventsResult] = await Promise.all([
				db
					.select({ count: sql<number>`count(*)` })
					.from(communityMembers)
					.where(eq(communityMembers.communityId, community.id)),
				db
					.select({ count: sql<number>`count(*)` })
					.from(events)
					.where(
						and(
							eq(events.organizationId, community.id),
							gte(events.endDate, new Date()),
						),
					),
			]);

			const memberCount = Number(memberCountResult[0]?.count ?? 0);
			const upcomingEventCount = Number(upcomingEventsResult[0]?.count ?? 0);

			let recentActivity: string | undefined;
			if (upcomingEventCount > 0) {
				recentActivity = `${upcomingEventCount} eventos próximos este mes`;
			} else if (memberCount > 50) {
				recentActivity = `${memberCount} miembros activos`;
			}

			return {
				...community,
				memberCount,
				upcomingEventCount,
				recentActivity,
			};
		}),
	);

	return communitiesWithStats.filter(
		(c) => c.upcomingEventCount > 0 || c.memberCount > 20,
	);
}

export async function getRecentEventRecaps(limit = 2) {
	const { userId } = await auth();
	if (!userId) return [];

	const prefs = await getUserPreferences();
	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		columns: { communityId: true },
	});

	const followedCommunityIds = followedCommunities.map((m) => m.communityId);

	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

	const now = new Date();

	const recentlyEndedEvents = await db.query.events.findMany({
		where: and(
			sql`${events.endDate} < ${now}`,
			sql`${events.endDate} >= ${twoWeeksAgo}`,
			followedCommunityIds.length > 0
				? or(
						inArray(events.organizationId, followedCommunityIds),
						prefs?.department
							? eq(events.department, prefs.department)
							: undefined,
					)
				: prefs?.department
					? eq(events.department, prefs.department)
					: undefined,
		),
		with: {
			organization: true,
		},
		orderBy: [desc(events.endDate)],
		limit,
	});

	return recentlyEndedEvents.map((event) => ({
		...event,
		relevanceScore: 0,
		relevanceReasons: [],
	}));
}
