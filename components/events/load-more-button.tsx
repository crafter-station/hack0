"use client";

import { Calendar, Loader2, MapPin, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	type EventFilters,
	type EventWithOrg,
	getEvents,
} from "@/lib/actions/events";
import { getCategoryById } from "@/lib/event-categories";
import {
	formatEventDateRange,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
} from "@/lib/event-utils";
import { EventRowWithChildren } from "./event-row-with-children";

type ViewMode = "table" | "cards" | "calendar";

interface LoadMoreButtonProps {
	filters: EventFilters;
	initialPage: number;
	hasMore: boolean;
	viewMode?: ViewMode;
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

function EventCard({ event }: { event: EventWithOrg }) {
	const status = getEventStatus(event);
	const isEnded = status.status === "ended";
	const prize = formatPrize(event.prizePool, event.prizeCurrency);

	const eventUrl = event.shortCode ? `/e/${event.shortCode}` : `/${event.slug}`;

	return (
		<Link href={eventUrl}>
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
}

export function LoadMoreButton({
	filters,
	initialPage,
	hasMore: initialHasMore,
	viewMode = "table",
}: LoadMoreButtonProps) {
	const categoryConfig = getCategoryById(filters.category || "all");
	const [page, setPage] = useState(initialPage);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [additionalEvents, setAdditionalEvents] = useState<EventWithOrg[]>([]);
	const [isPending, startTransition] = useTransition();

	const loadMore = () => {
		startTransition(async () => {
			const nextPage = page + 1;
			const result = await getEvents({ ...filters, page: nextPage });
			setAdditionalEvents((prev) => [...prev, ...result.events]);
			setPage(nextPage);
			setHasMore(result.hasMore);
		});
	};

	const renderAdditionalEvents = () => {
		if (additionalEvents.length === 0) return null;

		if (viewMode === "cards") {
			return (
				<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{additionalEvents.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			);
		}

		return (
			<>
				{additionalEvents.map((event) => (
					<EventRowWithChildren
						key={event.id}
						event={event}
						categoryConfig={categoryConfig}
					/>
				))}
			</>
		);
	};

	return (
		<>
			{renderAdditionalEvents()}

			{hasMore && (
				<div className="flex justify-center pt-4">
					<button
						onClick={loadMore}
						disabled={isPending}
						className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
					>
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Cargando...
							</>
						) : (
							"Cargar más eventos"
						)}
					</button>
				</div>
			)}
		</>
	);
}
