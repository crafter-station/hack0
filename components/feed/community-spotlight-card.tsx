"use client";

import { Users, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { organizations } from "@/lib/db/schema";

interface CommunitySpotlightCardProps {
	community: typeof organizations.$inferSelect & {
		memberCount?: number;
		upcomingEventCount?: number;
		recentActivity?: string;
	};
}

export function CommunitySpotlightCard({ community }: CommunitySpotlightCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className="relative"
		>
			<div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-full" />

			<div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 transition-all hover:border-muted-foreground/40 hover:bg-muted/50">
				<div className="flex items-start gap-2 mb-4">
					<div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-2">
						<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Comunidad destacada
						</p>
						<p className="text-xs text-muted-foreground/60 mt-0.5">
							Basado en tu actividad
						</p>
					</div>
				</div>

				<Link
					href={`/c/${community.slug}`}
					className="group block"
				>
					<div className="flex gap-4">
						<div className="relative shrink-0">
							{community.logoUrl ? (
								<div className="relative h-16 w-16 rounded-lg overflow-hidden ring-2 ring-background">
									<Image
										src={community.logoUrl}
										alt={community.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-background">
									<span className="text-2xl font-bold text-muted-foreground">
										{community.name.charAt(0)}
									</span>
								</div>
							)}
						</div>

						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2 mb-2">
								<h3 className="text-lg font-semibold leading-tight group-hover:text-foreground/80 transition-colors">
									{community.displayName || community.name}
								</h3>
								{community.isVerified && (
									<div className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
										Verificada
									</div>
								)}
							</div>

							{community.description && (
								<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
									{community.description}
								</p>
							)}

							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
								{community.memberCount !== undefined && (
									<div className="flex items-center gap-1.5">
										<Users className="h-3.5 w-3.5" />
										<span>{community.memberCount.toLocaleString()} miembros</span>
									</div>
								)}
								{community.upcomingEventCount !== undefined && community.upcomingEventCount > 0 && (
									<div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
										<Calendar className="h-3.5 w-3.5" />
										<span>{community.upcomingEventCount} eventos próximos</span>
									</div>
								)}
							</div>

							{community.recentActivity && (
								<div className="text-xs text-muted-foreground/80 italic mb-3">
									{community.recentActivity}
								</div>
							)}

							<div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
								Ver comunidad
								<ArrowRight className="h-4 w-4" />
							</div>
						</div>
					</div>
				</Link>
			</div>
		</motion.div>
	);
}
