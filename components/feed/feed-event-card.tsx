"use client";

import { Calendar, MapPin, TrendingUp, Users, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatEventDateSmart } from "@/lib/event-utils";
import type { FeedEvent } from "@/lib/actions/feed";

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
			<article className="rounded-lg border bg-card transition-all hover:border-foreground/20 hover:shadow-sm">
				{/* Image Banner */}
				{event.eventImageUrl && (
					<div className="relative aspect-[2.5/1] w-full overflow-hidden rounded-t-lg bg-muted">
						<Image
							src={event.eventImageUrl}
							alt={event.name}
							fill
							className="object-cover transition-transform group-hover:scale-[1.02]"
						/>
						{/* Status Badge */}
						{event.status === "ongoing" && (
							<div className="absolute top-3 right-3 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
								En curso
							</div>
						)}
						{event.status === "open" && (
							<div className="absolute top-3 right-3 rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white">
								Inscripciones abiertas
							</div>
						)}
					</div>
				)}

				<div className="p-5 space-y-4">
					{/* Header */}
					<div className="space-y-2">
						{/* Organization */}
						{event.organization && (
							<div className="flex items-center gap-2">
								{event.organization.logoUrl ? (
									<div className="relative h-5 w-5 rounded overflow-hidden">
										<Image
											src={event.organization.logoUrl}
											alt={event.organization.name}
											fill
											className="object-cover"
										/>
									</div>
								) : (
									<div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-semibold">
										{event.organization.name.charAt(0)}
									</div>
								)}
								<span className="text-sm text-muted-foreground">
									{event.organization.displayName || event.organization.name}
								</span>
								{event.organization.isVerified && (
									<BadgeCheck className="h-4 w-4 text-emerald-500" />
								)}
							</div>
						)}

						{/* Event Name */}
						<h3 className="text-lg font-semibold leading-tight group-hover:text-foreground/80 transition-colors">
							{event.name}
						</h3>

						{/* Description */}
						{event.description && (
							<p className="text-sm text-muted-foreground line-clamp-2">
								{event.description}
							</p>
						)}
					</div>

					{/* Metadata */}
					<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
						{/* Date */}
						{event.startDate && (
							<div className="flex items-center gap-1.5">
								<Calendar className="h-4 w-4" />
								<span>
									{formatEventDateSmart(
										new Date(event.startDate),
										event.endDate ? new Date(event.endDate) : undefined,
									)}
								</span>
							</div>
						)}

						{/* Location */}
						{event.format === "in-person" && event.city && (
							<div className="flex items-center gap-1.5">
								<MapPin className="h-4 w-4" />
								<span>{event.city}</span>
							</div>
						)}
						{event.format === "virtual" && (
							<div className="flex items-center gap-1.5">
								<MapPin className="h-4 w-4" />
								<span>Virtual</span>
							</div>
						)}
						{event.format === "hybrid" && (
							<div className="flex items-center gap-1.5">
								<MapPin className="h-4 w-4" />
								<span>Híbrido</span>
							</div>
						)}

						{/* Skill Level */}
						{event.skillLevel && event.skillLevel !== "all" && (
							<div className="flex items-center gap-1.5">
								<TrendingUp className="h-4 w-4" />
								<span className="capitalize">{event.skillLevel}</span>
							</div>
						)}

						{/* Prize */}
						{event.prizePool && event.prizePool > 0 && (
							<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
								<TrendingUp className="h-4 w-4" />
								<span>
									{event.prizeCurrency === "USD" ? "$" : "S/"}
									{event.prizePool.toLocaleString()}
								</span>
							</div>
						)}
					</div>

					{/* Relevance Reasons */}
					{hasRelevanceReasons && (
						<div className="flex flex-wrap gap-1.5">
							{event.relevanceReasons.slice(0, 3).map((reason, i) => (
								<span
									key={i}
									className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
								>
									{reason}
								</span>
							))}
						</div>
					)}
				</div>
			</article>
		</Link>
	);
}
