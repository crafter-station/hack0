import { Calendar, MapPin, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EventWithOrg } from "@/lib/actions/events";
import {
	formatEventDateRange,
	getCountryFlag,
	getCountryName,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
} from "@/lib/event-utils";

interface EventsPreviewSectionProps {
	events: EventWithOrg[];
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

function EventCardSkeleton() {
	return (
		<Card className="h-full overflow-hidden p-0 gap-0">
			<div className="relative aspect-square w-full overflow-hidden border-b bg-muted animate-pulse" />
			<CardContent className="p-3 space-y-1">
				<div className="space-y-0.5">
					<div className="h-4 bg-muted rounded animate-pulse w-3/4" />
					<div className="flex items-center gap-1.5 mt-0.5">
						<div className="h-3.5 w-3.5 bg-muted rounded-[3px] animate-pulse" />
						<div className="h-3 bg-muted rounded animate-pulse w-24" />
					</div>
				</div>
				<div className="h-3 bg-muted rounded animate-pulse w-1/2" />
				<div className="flex items-center justify-between gap-2">
					<div className="h-3 bg-muted rounded animate-pulse w-16" />
					<div className="h-3 bg-muted rounded animate-pulse w-12" />
				</div>
			</CardContent>
		</Card>
	);
}

export function EventsPreviewSkeleton() {
	return (
		<section className="py-8">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<h2 className="text-lg font-semibold text-center mb-6">
					¿Qué se viene?
				</h2>

				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<EventCardSkeleton key={i} />
					))}
				</div>

				<div className="mt-8 text-center">
					<div className="inline-flex h-10 w-48 bg-muted rounded-lg animate-pulse" />
				</div>
			</div>
		</section>
	);
}

export function EventsPreviewSection({ events }: EventsPreviewSectionProps) {
	if (events.length === 0) {
		return null;
	}

	return (
		<section className="py-8">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<h2 className="text-lg font-semibold text-center mb-6">
					¿Qué se viene?
				</h2>

				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{events.slice(0, 8).map((event) => {
						const status = getEventStatus(event);
						const isEnded = status.status === "ended";
						const prize = formatPrize(event.prizePool, event.prizeCurrency);

						const eventUrl = event.shortCode
							? `/e/${event.shortCode}`
							: `/${event.slug}`;

						return (
							<Link key={event.id} href={eventUrl}>
								<Card
									className={`group h-full overflow-hidden p-0 gap-0 transition-all hover:shadow-md hover:border-foreground/20 ${isEnded ? "opacity-60" : ""}`}
								>
									<div className="relative aspect-square w-full overflow-hidden border-b">
										{event.eventImageUrl ? (
											<Image
												src={event.eventImageUrl}
												alt={event.name}
												fill
												className={`object-cover transition-transform group-hover:scale-105 ${isEnded ? "grayscale" : ""}`}
												sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
											/>
										) : (
											<div
												className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/80 to-muted ${isEnded ? "grayscale" : ""}`}
											>
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
														ya pasó
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
									<CardContent className="p-3 space-y-1">
										<div>
											<h3 className="font-medium text-sm line-clamp-2 group-hover:text-foreground transition-colors">
												{event.name}
											</h3>
											<div className="flex items-center gap-1.5 mt-0.5">
												{event.organization?.logoUrl ? (
													<Image
														src={event.organization.logoUrl}
														alt={
															event.organization.displayName ||
															event.organization.name
														}
														width={14}
														height={14}
														className="rounded-[3px] object-cover flex-shrink-0"
													/>
												) : event.organization ? (
													<div className="size-3.5 rounded-[3px] bg-muted flex items-center justify-center flex-shrink-0">
														<span className="text-[8px] font-medium text-muted-foreground">
															{(
																event.organization.displayName ||
																event.organization.name
															)
																.charAt(0)
																.toUpperCase()}
														</span>
													</div>
												) : null}
												<span className="text-xs text-muted-foreground truncate">
													{event.organization?.displayName ||
														event.organization?.name ||
														getEventTypeLabel(event.eventType)}
												</span>
											</div>
										</div>
										<div className="text-xs text-muted-foreground">
											{formatEventDateRange(
												event.startDate,
												event.endDate,
												event.timezone || undefined,
											)}
										</div>
										<div className="flex items-center justify-between gap-2 text-xs">
											<div className="flex items-center gap-2 text-muted-foreground truncate">
												{event.country && (
													<span className="flex items-center gap-0.5 shrink-0">
														{getCountryFlag(event.country)}{" "}
														{event.city || getCountryName(event.country)}
													</span>
												)}
												{!event.country && event.format && (
													<span>
														{getFormatLabel(event.format, event.department)}
													</span>
												)}
												{!event.country && event.city && (
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
					{(() => {
						const eventCount = Math.min(events.length, 8);
						const targetCount = eventCount <= 4 ? 4 : 8;
						const placeholderCount = targetCount - eventCount;
						return (
							placeholderCount > 0 &&
							Array.from({ length: placeholderCount }).map((_, i) => (
								<Link key={`placeholder-${i}`} href="/onboarding">
									<Card className="group h-full overflow-hidden p-0 gap-0 border-dashed hover:border-foreground/20 transition-all">
										<div className="relative aspect-square w-full overflow-hidden bg-muted/30 border-b">
											<div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
												<div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
													<span className="text-muted-foreground/40 text-xl">
														+
													</span>
												</div>
												<span className="text-xs text-muted-foreground/60 text-center">
													¿Tienes un evento?
												</span>
											</div>
										</div>
										<CardContent className="p-3 space-y-1">
											<div>
												<h3 className="font-medium text-sm text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
													Publica tu evento
												</h3>
												<p className="text-xs text-muted-foreground/40">
													Es gratis y toma 2 minutos
												</p>
											</div>
											<div className="text-xs text-muted-foreground/40">
												Crea tu comunidad →
											</div>
										</CardContent>
									</Card>
								</Link>
							))
						);
					})()}
				</div>

				<div className="mt-8 text-center">
					<Link
						href="/events"
						className="inline-flex h-10 items-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-muted"
					>
						Ver todos los eventos
					</Link>
				</div>
			</div>
		</section>
	);
}
