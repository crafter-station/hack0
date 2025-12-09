"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	communityMembers,
	events,
	organizations,
	type Event,
} from "@/lib/db/schema";
import { getUserPreferences } from "./user-preferences";

export interface FeedEvent extends Event {
	organization: typeof organizations.$inferSelect | null;
	relevanceScore: number;
	relevanceReasons: string[];
}

interface FeedOptions {
	limit?: number;
	cursor?: string;
	includeEnded?: boolean;
}

export async function getPersonalizedFeed(
	options: FeedOptions = {},
): Promise<{
	events: FeedEvent[];
	nextCursor: string | null;
	hasMore: boolean;
}> {
	const { userId } = await auth();
	if (!userId) {
		return { events: [], nextCursor: null, hasMore: false };
	}

	const { limit = 20, cursor, includeEnded = false } = options;
	const prefs = await getUserPreferences();

	// Get communities the user follows
	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		columns: { communityId: true },
	});

	const followedCommunityIds = followedCommunities.map((m) => m.communityId);

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
			const daysUntilStart = Math.ceil(
				(new Date(event.startDate).getTime() - now.getTime()) /
					(1000 * 60 * 60 * 24),
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
			reasons.push(`${event.prizeCurrency === "USD" ? "$" : "S/"}${event.prizePool.toLocaleString()} en premios`);
		}

		// 9. Recency boost (newer events get small boost)
		const hoursOld = Math.floor(
			(now.getTime() - new Date(event.createdAt).getTime()) /
				(1000 * 60 * 60),
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

	// Sort by score and take top results
	const rankedEvents = scoredEvents
		.sort((a, b) => b.relevanceScore - a.relevanceScore)
		.slice(0, limit);

	const hasMore = allEvents.length >= limit * 3;
	const nextCursor =
		hasMore && rankedEvents.length > 0
			? rankedEvents[rankedEvents.length - 1].createdAt.toISOString()
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
