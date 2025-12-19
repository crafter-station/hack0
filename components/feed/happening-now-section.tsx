"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FeedEvent } from "@/lib/actions/feed";

interface HappeningNowSectionProps {
	events: FeedEvent[];
}

export function HappeningNowSection({ events }: HappeningNowSectionProps) {
	const ongoingEvents = events
		.filter((e) => e.status === "ongoing")
		.slice(0, 3);

	if (ongoingEvents.length === 0) return null;

	return (
		<div className="mb-6">
			<div className="flex items-center gap-2 mb-3">
				<motion.div
					animate={{ scale: [1, 1.1, 1] }}
					transition={{ duration: 1.5, repeat: Infinity }}
				>
					<Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
				</motion.div>
				<h2 className="text-base font-semibold">Happening Now</h2>
				<span className="text-xs text-muted-foreground">
					{ongoingEvents.length}{" "}
					{ongoingEvents.length === 1 ? "evento" : "eventos"}
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{ongoingEvents.map((event, index) => (
					<Link
						key={event.id}
						href={
							event.organizationId
								? `/c/${event.organization?.slug}/events/${event.slug}`
								: `/${event.slug}`
						}
						className="group block"
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted"
						>
							{/* Image with gradient overlay */}
							{event.eventImageUrl ? (
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover transition-transform group-hover:scale-105"
								/>
							) : (
								<div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
							)}

							{/* Gradient overlay */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

							{/* Pulsing indicator */}
							<div className="absolute top-2 right-2 flex items-center gap-1">
								<motion.div
									animate={{ opacity: [0.4, 1, 0.4] }}
									transition={{ duration: 2, repeat: Infinity }}
									className="h-1.5 w-1.5 rounded-full bg-emerald-400"
								/>
								<span className="text-[10px] font-medium text-white">
									EN VIVO
								</span>
							</div>

							{/* Content */}
							<div className="absolute bottom-0 left-0 right-0 p-3 text-white">
								{/* Organization */}
								{event.organization && (
									<div className="flex items-center gap-1.5 mb-1">
										{event.organization.logoUrl && (
											<div className="relative h-3 w-3 rounded overflow-hidden">
												<Image
													src={event.organization.logoUrl}
													alt={event.organization.name}
													fill
													className="object-cover"
												/>
											</div>
										)}
										<span className="text-[10px] opacity-90">
											{event.organization.displayName ||
												event.organization.name}
										</span>
									</div>
								)}

								{/* Event name */}
								<h3 className="font-semibold text-xs line-clamp-2 group-hover:text-white/90 transition-colors">
									{event.name}
								</h3>
							</div>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
