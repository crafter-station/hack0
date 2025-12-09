"use client";

import { Calendar, MapPin, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatEventDateRange } from "@/lib/event-utils";
import type { FeedEvent } from "@/lib/actions/feed";
import { SaveEventButton } from "./save-event-button";
import { ShareEventButton } from "./share-event-button";

interface HeroEventCardProps {
	event: FeedEvent;
}

export function HeroEventCard({ event }: HeroEventCardProps) {
	return (
		<Link
			href={
				event.organizationId
					? `/c/${event.organization?.slug}/events/${event.slug}`
					: `/${event.slug}`
			}
			className="group block"
		>
			<article className="rounded-xl border-2 bg-card transition-all hover:border-foreground/30 hover:shadow-lg overflow-hidden relative">
				{/* Quick Actions */}
				<div className="absolute top-4 right-4 z-20 flex gap-1.5">
					<SaveEventButton eventId={event.id} eventName={event.name} />
					<ShareEventButton
						eventSlug={event.slug}
						organizationSlug={event.organization?.slug}
						eventName={event.name}
						eventDescription={event.description}
					/>
				</div>

				{/* Hero Banner */}
				{event.eventImageUrl && (
					<div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
						<Image
							src={event.eventImageUrl}
							alt={event.name}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-105"
							priority
						/>
						{/* Gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

						{/* Status Badge */}
						{event.status === "ongoing" && (
							<div className="absolute top-4 left-4 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white">
								🔥 En curso ahora
							</div>
						)}
						{event.status === "open" && (
							<div className="absolute top-4 left-4 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white">
								✨ Inscripciones abiertas
							</div>
						)}
					</div>
				)}

				{/* Content */}
				<div className="p-6 space-y-4">
					{/* Organization */}
					{event.organization && (
						<div className="flex items-center gap-2">
							{event.organization.logoUrl ? (
								<div className="relative h-6 w-6 rounded overflow-hidden">
									<Image
										src={event.organization.logoUrl}
										alt={event.organization.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-semibold">
									{event.organization.name.charAt(0)}
								</div>
							)}
							<span className="text-sm font-medium text-muted-foreground">
								{event.organization.displayName || event.organization.name}
							</span>
							{event.organization.isVerified && (
								<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
							)}
						</div>
					)}

					{/* Event Name */}
					<h2 className="text-2xl font-bold leading-tight group-hover:text-foreground/80 transition-colors">
						{event.name}
					</h2>

					{/* Description */}
					{event.description && (
						<p className="text-base text-muted-foreground line-clamp-2">
							{event.description}
						</p>
					)}

					{/* Metadata */}
					<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
						{/* Date */}
						{event.startDate && (
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								<span className="font-medium">
									{formatEventDateRange(
										new Date(event.startDate),
										event.endDate ? new Date(event.endDate) : null,
									)}
								</span>
							</div>
						)}

						{/* Location */}
						{event.format === "in-person" && event.city && (
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								<span>{event.city}</span>
							</div>
						)}
						{event.format === "virtual" && (
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								<span>Virtual</span>
							</div>
						)}
						{event.format === "hybrid" && (
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								<span>Híbrido</span>
							</div>
						)}

						{/* Prize */}
						{event.prizePool && event.prizePool > 0 && (
							<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
								<TrendingUp className="h-4 w-4" />
								<span>
									{event.prizeCurrency === "USD" ? "$" : "S/"}
									{event.prizePool.toLocaleString()} en premios
								</span>
							</div>
						)}
					</div>

					{/* Relevance Reasons */}
					{event.relevanceReasons.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{event.relevanceReasons.slice(0, 3).map((reason, i) => (
								<span
									key={i}
									className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{reason}
								</span>
							))}
						</div>
					)}

					{/* CTA */}
					<div className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:gap-3 transition-all">
						Ver detalles del evento
						<ArrowRight className="h-4 w-4" />
					</div>
				</div>
			</article>
		</Link>
	);
}
