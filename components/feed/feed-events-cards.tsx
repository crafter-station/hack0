"use client";

import { Calendar, Loader2, MapPin, Search, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	type FeedEvent,
	type FeedFilterType,
	getPersonalizedFeed,
} from "@/lib/actions/feed";
import {
	formatEventDateRange,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
} from "@/lib/event-utils";

interface FeedEventsCardsProps {
	initialEvents: FeedEvent[];
	initialCursor: string | null;
	initialHasMore: boolean;
	category: string;
}

function getStatusColor(status: string) {
	switch (status) {
		case "ongoing":
			return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
		case "open":
			return "bg-blue-500/10 text-blue-500 border-blue-500/20";
		case "upcoming":
			return "bg-amber-500/10 text-amber-500 border-amber-500/20";
		default:
			return "bg-muted text-muted-foreground border-muted";
	}
}

function formatPrize(amount: number | null, currency: string | null) {
	if (!amount || amount === 0) return null;
	const symbol = currency === "PEN" ? "S/" : "$";
	return `${symbol}${amount.toLocaleString()}`;
}

export function FeedEventsCards({
	initialEvents,
	initialCursor,
	initialHasMore,
	category,
}: FeedEventsCardsProps) {
	const [events, setEvents] = useState<FeedEvent[]>(initialEvents);
	const [cursor, setCursor] = useState<string | null>(initialCursor);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isLoading, setIsLoading] = useState(false);

	const { ref, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	useEffect(() => {
		setEvents(initialEvents);
		setCursor(initialCursor);
		setHasMore(initialHasMore);
	}, [initialEvents, initialCursor, initialHasMore]);

	useEffect(() => {
		if (inView && hasMore && !isLoading) {
			loadMore();
		}
	}, [inView, hasMore, isLoading]);

	const loadMore = async () => {
		if (isLoading || !hasMore) return;

		setIsLoading(true);
		try {
			const filter = (category === "all" ? "all" : category) as FeedFilterType;
			const result = await getPersonalizedFeed({
				cursor: cursor ?? undefined,
				limit: 15,
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

	if (events.length === 0) {
		return (
			<Empty className="py-16">
				<EmptyMedia>
					<Sparkles className="h-12 w-12 text-muted-foreground/50" />
				</EmptyMedia>
				<EmptyContent>
					<EmptyHeader>
						<EmptyTitle>Tu feed está vacío</EmptyTitle>
						<EmptyDescription>
							Únete a comunidades y completa tu perfil para recibir
							recomendaciones personalizadas de eventos.
						</EmptyDescription>
					</EmptyHeader>
					<div className="flex gap-2">
						<Button asChild variant="outline" size="sm">
							<Link href="/c/discover">
								<Search className="h-4 w-4 mr-2" />
								Explorar comunidades
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{events.map((event) => {
					const status = getEventStatus(event);
					const isEnded = status.status === "ended";
					const prize = formatPrize(event.prizePool, event.prizeCurrency);

					const eventUrl = event.organization?.slug
						? `/c/${event.organization.slug}/events/${event.slug}`
						: `/${event.slug}`;

					return (
						<Link key={event.id} href={eventUrl}>
							<Card
								className={`group h-full overflow-hidden p-0 transition-all hover:shadow-md hover:border-foreground/20 ${isEnded ? "opacity-60" : ""}`}
							>
								<div className="relative aspect-square w-full overflow-hidden">
									{event.eventImageUrl ? (
										<Image
											src={event.eventImageUrl}
											alt={event.name}
											fill
											className={`object-cover transition-transform group-hover:scale-105 ${isEnded ? "grayscale" : ""}`}
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
										/>
									) : (
										<div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/80 to-muted ${isEnded ? "grayscale" : ""}`}>
											<Calendar className="h-8 w-8 text-muted-foreground/40" />
											<span className="text-xs text-muted-foreground/60 px-4 text-center line-clamp-1">
												{event.name}
											</span>
										</div>
									)}
									{isEnded && (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="absolute w-[150%] rotate-[-35deg] bg-muted/95 py-1 text-center shadow-sm">
												<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
													Te lo perdiste
												</span>
											</div>
										</div>
									)}
									{event.isFeatured && !isEnded && (
										<div className="absolute top-2 left-2">
											<Badge className="bg-amber-500 text-white border-0 text-[10px]">
												★ Destacado
											</Badge>
										</div>
									)}
									{!isEnded && (
										<div className="absolute top-2 right-2">
											<Badge
												variant="outline"
												className={`text-[10px] backdrop-blur-sm ${getStatusColor(status.status)}`}
											>
												{status.label}
											</Badge>
										</div>
									)}
								</div>
								<CardContent className="p-3 space-y-2">
									<div>
										<h3 className="font-medium text-sm line-clamp-2 group-hover:text-foreground transition-colors">
											{event.name}
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											{event.organization?.displayName ||
												event.organization?.name ||
												getEventTypeLabel(event.eventType)}
										</p>
									</div>
									<div className="text-xs text-muted-foreground">
										{formatEventDateRange(event.startDate, event.endDate)}
									</div>
									<div className="flex items-center justify-between gap-2 text-xs">
										<div className="flex items-center gap-2 text-muted-foreground">
											{event.format && (
												<span>{getFormatLabel(event.format, event.department)}</span>
											)}
											{event.city && (
												<span className="flex items-center gap-0.5">
													<MapPin className="h-3 w-3" />
													{event.city}
												</span>
											)}
										</div>
										{prize && (
											<span className="flex items-center gap-1 text-emerald-500 font-medium">
												<Trophy className="h-3 w-3" />
												{prize}
											</span>
										)}
									</div>
								</CardContent>
							</Card>
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<div ref={ref} className="flex justify-center py-4">
					{isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
				</div>
			)}
		</div>
	);
}
