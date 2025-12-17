"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { getPersonalizedFeed, type FeedEvent, type FeedFilterType } from "@/lib/actions/feed";
import { EventRowWithChildren } from "@/components/events/event-row-with-children";
import { FeedSkeleton } from "./feed-skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

interface FeedEventsTableProps {
	initialEvents: FeedEvent[];
	initialCursor: string | null;
	initialHasMore: boolean;
	category: string;
}

export function FeedEventsTable({
	initialEvents,
	initialCursor,
	initialHasMore,
	category,
}: FeedEventsTableProps) {
	const [events, setEvents] = useState(initialEvents);
	const [cursor, setCursor] = useState(initialCursor);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoading, setIsLoading] = useState(false);

	const { ref, inView } = useInView({
		threshold: 0,
		rootMargin: "400px",
	});

	useEffect(() => {
		setEvents(initialEvents);
		setCursor(initialCursor);
		setHasMore(initialHasMore);
	}, [initialEvents, initialCursor, initialHasMore, category]);

	useEffect(() => {
		if (inView && hasMore && !isLoading) {
			loadMore();
		}
	}, [inView, hasMore, isLoading]);

	const loadMore = async () => {
		if (!cursor || isLoading) return;

		setIsLoading(true);
		try {
			const filter = (category === "all" ? "all" : category) as FeedFilterType;
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

	if (isLoading && events.length === 0) {
		return <FeedSkeleton count={5} />;
	}

	if (events.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Search className="h-6 w-6" />
					</EmptyMedia>
					<EmptyTitle>No hay eventos personalizados</EmptyTitle>
					<EmptyDescription>
						Sigue algunas comunidades para ver eventos recomendados basados en tus preferencias.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-3">
						<Link href="/events">
							<Button variant="outline" size="sm">
								Ver todos los eventos
							</Button>
						</Link>
						<Link href="/c">
							<Button variant="outline" size="sm" className="gap-2">
								<Sparkles className="h-3.5 w-3.5" />
								Explorar comunidades
							</Button>
						</Link>
					</div>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="hidden lg:grid grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
					<div>Evento</div>
					<div>Fecha</div>
					<div>Formato</div>
					<div className="text-right">Premio</div>
					<div className="text-right">Estado</div>
				</div>

				<div className="divide-y divide-border">
					{events.map((event) => (
						<EventRowWithChildren
							key={event.id}
							event={event}
							categoryConfig={{
								showPrize: true,
								showSkillLevel: false,
							}}
						/>
					))}
				</div>
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
