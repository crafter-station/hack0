"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import {
	getPersonalizedFeed,
	getSuggestedCommunities,
	getRecentEventRecaps,
	type FeedEvent
} from "@/lib/actions/feed";
import { FeedTimeline } from "./feed-timeline";
import { HappeningNowSection } from "./happening-now-section";
import { HeroEventCard } from "./hero-event-card";
import { CommunitySpotlightCard } from "./community-spotlight-card";
import { EventRecapCard } from "./event-recap-card";
import { useCurrentFilter } from "./filter-pills";
import { FeedSkeleton } from "./feed-skeleton";
import { Loader2 } from "lucide-react";
import type { organizations } from "@/lib/db/schema";

interface PersonalizedFeedProps {
	initialEvents: FeedEvent[];
	initialCursor: string | null;
	initialHasMore: boolean;
}

type FeedItem =
	| { type: "event"; data: FeedEvent }
	| { type: "community-spotlight"; data: typeof organizations.$inferSelect & { memberCount?: number; upcomingEventCount?: number; recentActivity?: string } }
	| { type: "event-recap"; data: FeedEvent };

export function PersonalizedFeed({
	initialEvents,
	initialCursor,
	initialHasMore,
}: PersonalizedFeedProps) {
	const filter = useCurrentFilter();
	const [events, setEvents] = useState(initialEvents);
	const [cursor, setCursor] = useState(initialCursor);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoading, setIsLoading] = useState(false);
	const [suggestedCommunities, setSuggestedCommunities] = useState<any[]>([]);
	const [eventRecaps, setEventRecaps] = useState<FeedEvent[]>([]);

	const { ref, inView } = useInView({
		threshold: 0,
		rootMargin: "400px",
	});

	useEffect(() => {
		const fetchInterruptions = async () => {
			try {
				const [communities, recaps] = await Promise.all([
					getSuggestedCommunities(2),
					getRecentEventRecaps(2),
				]);
				setSuggestedCommunities(communities);
				setEventRecaps(recaps);
			} catch (error) {
				console.error("Error fetching feed interruptions:", error);
			}
		};

		fetchInterruptions();
	}, []);

	useEffect(() => {
		const fetchFiltered = async () => {
			setIsLoading(true);
			try {
				const result = await getPersonalizedFeed({
					limit: 15,
					filter,
				});
				setEvents(result.events);
				setCursor(result.nextCursor);
				setHasMore(result.hasMore);
			} catch (error) {
				console.error("Error fetching filtered events:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchFiltered();
	}, [filter]);

	useEffect(() => {
		if (inView && hasMore && !isLoading) {
			loadMore();
		}
	}, [inView, hasMore, isLoading]);

	const loadMore = async () => {
		if (!cursor || isLoading) return;

		setIsLoading(true);
		try {
			const result = await getPersonalizedFeed({
				cursor,
				limit: 10,
				filter,
			});

			setEvents((prev) => [...prev, ...result.events]);
			setCursor(result.nextCursor);
			setHasMore(result.hasMore);
		} catch (error) {
			console.error("Error loading more events:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const buildFeedItems = (): FeedItem[] => {
		const items: FeedItem[] = [];
		const heroEvent = events.find(e => e.relevanceScore >= 150 && e.status !== "ongoing");
		const timelineEvents = heroEvent ? events.filter(e => e.id !== heroEvent.id) : events;

		let communityIndex = 0;
		let recapIndex = 0;

		timelineEvents.forEach((event, index) => {
			items.push({ type: "event", data: event });

			if ((index + 1) % 8 === 0 && communityIndex < suggestedCommunities.length) {
				items.push({
					type: "community-spotlight",
					data: suggestedCommunities[communityIndex],
				});
				communityIndex++;
			}

			if ((index + 1) % 12 === 0 && recapIndex < eventRecaps.length) {
				items.push({
					type: "event-recap",
					data: eventRecaps[recapIndex],
				});
				recapIndex++;
			}
		});

		return items;
	};

	if (isLoading && events.length === 0) {
		return <FeedSkeleton count={5} />;
	}

	if (events.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					No hay eventos personalizados aún.
				</p>
				<p className="text-sm text-muted-foreground mt-2">
					Sigue algunas comunidades para ver eventos recomendados.
				</p>
			</div>
		);
	}

	const heroEvent = events.find(e => e.relevanceScore >= 150 && e.status !== "ongoing");
	const feedItems = buildFeedItems();

	return (
		<div className="space-y-6">
			<HappeningNowSection events={events} />

			{heroEvent && (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<span className="text-sm font-medium text-muted-foreground">Destacado para ti</span>
					</div>
					<HeroEventCard event={heroEvent} />
				</div>
			)}

			<div className="space-y-6">
				{feedItems.map((item, index) => {
					if (item.type === "event") {
						return (
							<FeedTimeline
								key={`event-${item.data.id}-${index}`}
								events={[item.data]}
							/>
						);
					} else if (item.type === "community-spotlight") {
						return (
							<CommunitySpotlightCard
								key={`community-${item.data.id}-${index}`}
								community={item.data}
							/>
						);
					} else if (item.type === "event-recap") {
						return (
							<EventRecapCard
								key={`recap-${item.data.id}-${index}`}
								event={item.data}
							/>
						);
					}
					return null;
				})}
			</div>

			{hasMore && (
				<div ref={ref} className="py-4">
					{isLoading && (
						<div className="flex justify-center">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					)}
				</div>
			)}

			{!hasMore && events.length > 0 && (
				<p className="text-center text-sm text-muted-foreground py-8">
					Has visto todos los eventos recomendados
				</p>
			)}
		</div>
	);
}
