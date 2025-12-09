"use client";

import { Calendar, MapPin, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatEventDateRange } from "@/lib/event-utils";
import type { FeedEvent } from "@/lib/actions/feed";
import { SaveEventButton } from "./save-event-button";
import { ShareEventButton } from "./share-event-button";

interface FeedEventCardProps {
	event: FeedEvent;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
	const hasRelevanceReasons = event.relevanceReasons.length > 0;

	return (
		<Link
			href={
				event.organizationId
					? `/c/${event.organization?.slug}/events/${event.slug}`
					: `/${event.slug}`
			}
			className="group block"
		>
			<article className="rounded-lg border bg-card transition-all hover:border-foreground/20 hover:shadow-md overflow-hidden relative">
				{/* Quick Actions */}
				<div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<SaveEventButton eventId={event.id} eventName={event.name} />
					<ShareEventButton
						eventSlug={event.slug}
						organizationSlug={event.organization?.slug}
						eventName={event.name}
						eventDescription={event.description}
					/>
				</div>

				<div className="flex gap-4 p-4">
					{/* Image - compact side thumbnail */}
					{event.eventImageUrl && (
						<div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-md bg-muted">
							<Image
								src={event.eventImageUrl}
								alt={event.name}
								fill
								className="object-cover transition-transform group-hover:scale-105"
							/>
							{/* Status Badge */}
							{event.status === "ongoing" && (
								<div className="absolute top-2 right-2 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
									Live
								</div>
							)}
							{event.status === "open" && (
								<div className="absolute top-2 right-2 rounded-md bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
									Open
								</div>
							)}
						</div>
					)}

					<div className="flex-1 min-w-0 space-y-2">
						{/* Organization */}
						{event.organization && (
							<div className="flex items-center gap-1.5">
								{event.organization.logoUrl ? (
									<div className="relative h-4 w-4 rounded overflow-hidden">
										<Image
											src={event.organization.logoUrl}
											alt={event.organization.name}
											fill
											className="object-cover"
										/>
									</div>
								) : (
									<div className="h-4 w-4 rounded bg-muted flex items-center justify-center text-[10px] font-semibold">
										{event.organization.name.charAt(0)}
									</div>
								)}
								<span className="text-xs text-muted-foreground">
									{event.organization.displayName || event.organization.name}
								</span>
								{event.organization.isVerified && (
									<CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
								)}
							</div>
						)}

						{/* Event Name */}
						<h3 className="text-base font-semibold leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
							{event.name}
						</h3>

						{/* Metadata */}
						<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
							{/* Date */}
							{event.startDate && (
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									<span>
										{formatEventDateRange(
											new Date(event.startDate),
											event.endDate ? new Date(event.endDate) : null,
										)}
									</span>
								</div>
							)}

							{/* Location */}
							{event.format === "in-person" && event.city && (
								<div className="flex items-center gap-1">
									<MapPin className="h-3 w-3" />
									<span>{event.city}</span>
								</div>
							)}
							{event.format === "virtual" && (
								<div className="flex items-center gap-1">
									<MapPin className="h-3 w-3" />
									<span>Virtual</span>
								</div>
							)}
							{event.format === "hybrid" && (
								<div className="flex items-center gap-1">
									<MapPin className="h-3 w-3" />
									<span>Híbrido</span>
								</div>
							)}

							{/* Prize */}
							{event.prizePool && event.prizePool > 0 && (
								<div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
									<TrendingUp className="h-3 w-3" />
									<span>
										{event.prizeCurrency === "USD" ? "$" : "S/"}
										{event.prizePool.toLocaleString()}
									</span>
								</div>
							)}
						</div>

						{/* Relevance Reasons */}
						{hasRelevanceReasons && (
							<div className="flex flex-wrap gap-1">
								{event.relevanceReasons.slice(0, 2).map((reason, i) => (
									<span
										key={i}
										className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
									>
										{reason}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			</article>
		</Link>
	);
}
