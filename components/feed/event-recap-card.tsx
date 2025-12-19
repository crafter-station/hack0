"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Sparkles, Trophy, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FeedEvent } from "@/lib/actions/feed";
import { formatEventDateRange } from "@/lib/event-utils";

interface EventRecapCardProps {
	event: FeedEvent;
	winnerCount?: number;
	participantCount?: number;
}

export function EventRecapCard({
	event,
	winnerCount,
	participantCount,
}: EventRecapCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className="relative"
		>
			<div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/50 via-orange-500/50 to-pink-500/50 rounded-full" />

			<div className="rounded-xl border-2 bg-gradient-to-br from-amber-500/5 via-background to-background overflow-hidden">
				<div className="p-4 border-b bg-gradient-to-r from-amber-500/10 to-transparent">
					<div className="flex items-center gap-2">
						<div className="rounded-full bg-amber-500/20 p-1.5">
							<Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="flex-1">
							<p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
								Recap del evento
							</p>
							<p className="text-[10px] text-muted-foreground">
								Finalizó hace poco
							</p>
						</div>
						{event.organization?.logoUrl && (
							<div className="relative h-6 w-6 rounded overflow-hidden">
								<Image
									src={event.organization.logoUrl}
									alt={event.organization.name}
									fill
									className="object-cover"
								/>
							</div>
						)}
					</div>
				</div>

				<Link
					href={
						event.organizationId
							? `/c/${event.organization?.slug}/events/${event.slug}`
							: `/${event.slug}`
					}
					className="group block"
				>
					<div className="flex gap-4 p-4">
						{event.eventImageUrl && (
							<div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-lg">
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover transition-transform group-hover:scale-105 grayscale-[0.3]"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
								<div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
									Finalizado
								</div>
							</div>
						)}

						<div className="flex-1 min-w-0 space-y-2">
							<h3 className="text-base font-semibold leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
								{event.name}
							</h3>

							<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
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

								{participantCount !== undefined && participantCount > 0 && (
									<div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
										<Users className="h-3 w-3" />
										<span>
											{participantCount.toLocaleString()} participantes
										</span>
									</div>
								)}

								{winnerCount !== undefined && winnerCount > 0 && (
									<div className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
										<Trophy className="h-3 w-3" />
										<span>{winnerCount} ganadores</span>
									</div>
								)}

								{event.prizePool && event.prizePool > 0 && (
									<div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
										<span>
											{event.prizeCurrency === "USD" ? "$" : "S/"}
											{event.prizePool.toLocaleString()} repartidos
										</span>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all pt-1">
								Ver resultados completos
								<ArrowRight className="h-3.5 w-3.5" />
							</div>
						</div>
					</div>
				</Link>
			</div>
		</motion.div>
	);
}
