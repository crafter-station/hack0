"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { getPersonalizedFeed, type FeedEvent } from "@/lib/actions/feed";
import { FeedEventCard } from "./feed-event-card";
import { FeedSkeleton } from "./feed-skeleton";
import { Loader2 } from "lucide-react";

interface PersonalizedFeedProps {
	initialEvents: FeedEvent[];
	initialCursor: string | null;
	initialHasMore: boolean;
}

export function PersonalizedFeed({
	initialEvents,
	initialCursor,
	initialHasMore,
}: PersonalizedFeedProps) {
	const [events, setEvents] = useState(initialEvents);
	const [cursor, setCursor] = useState(initialCursor);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoading, setIsLoading] = useState(false);

	const { ref, inView } = useInView({
		threshold: 0,
		rootMargin: "400px",
	});

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

	return (
		<div className="space-y-4">
			{events.map((event) => (
				<FeedEventCard key={event.id} event={event} />
			))}

			{/* Infinite scroll trigger */}
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
