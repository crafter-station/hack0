"use client";

import { AlertCircle, Calendar, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	ApprovalBadge,
	FeaturedBadge,
	ImportedBadge,
	StatusBadge,
	VerifiedBadge,
} from "@/components/manage/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/lib/db/schema";
import {
	formatEventDate,
	getEventStatus,
	getFormatLabel,
} from "@/lib/event-utils";

interface EventHeroCardProps {
	event: Event;
}

export function EventHeroCard({ event }: EventHeroCardProps) {
	const status = getEventStatus(event);
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const deadline = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: null;

	const now = new Date();
	const hasInconsistentStatus =
		(status.status === "upcoming" && endDate && endDate < now) ||
		(status.status === "ongoing" && endDate && endDate < now) ||
		(status.status === "open" &&
			deadline &&
			deadline < now &&
			(!startDate || startDate > now));

	const needsRegistrationDeadline = status.status === "open" && !deadline;

	return (
		<Card className="overflow-hidden">
			{event.eventImageUrl && (
				<div className="relative aspect-[4/1] md:aspect-[5/1] w-full bg-muted">
					<Image
						src={event.eventImageUrl}
						alt={event.name}
						fill
						className="object-cover"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
				</div>
			)}

			<CardContent className={event.eventImageUrl ? "pt-4" : "pt-6"}>
				<div className="flex flex-col gap-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-2 flex-wrap">
							<StatusBadge status={status.status} label={status.label} />
							{event.approvalStatus && (
								<ApprovalBadge status={event.approvalStatus} />
							)}
							{event.isFeatured && <FeaturedBadge />}
							{event.isOrganizerVerified && <VerifiedBadge />}
							{event.sourceScrapedAt && <ImportedBadge />}
						</div>

						<Link href={`/e/${event.shortCode}`} target="_blank">
							<Button variant="outline" size="sm" className="gap-2 shrink-0">
								Ver página
								<ExternalLink className="h-3.5 w-3.5" />
							</Button>
						</Link>
					</div>

					<div>
						<h2 className="text-xl font-semibold tracking-tight">
							{event.name}
						</h2>
						<div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
							<span className="inline-flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5" />
								{startDate && endDate ? (
									<>
										{formatEventDate(startDate, "d MMM")} –{" "}
										{formatEventDate(endDate, "d MMM yyyy")}
									</>
								) : startDate ? (
									formatEventDate(startDate, "d MMMM yyyy")
								) : (
									"Por definir"
								)}
							</span>
							{event.city && (
								<>
									<span className="text-muted-foreground/50">•</span>
									<span className="inline-flex items-center gap-1.5">
										<MapPin className="h-3.5 w-3.5" />
										{event.city}
									</span>
								</>
							)}
							<span className="text-muted-foreground/50">•</span>
							<span>{getFormatLabel(event.format)}</span>
						</div>
					</div>

					{(hasInconsistentStatus ||
						needsRegistrationDeadline ||
						!event.isApproved) && (
						<div className="flex flex-col gap-2 pt-2">
							{hasInconsistentStatus && (
								<div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>
										El estado ({status.label}) no coincide con las fechas
									</span>
								</div>
							)}

							{needsRegistrationDeadline && (
								<div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>Falta fecha de cierre de registro</span>
								</div>
							)}

							{!event.isApproved && (
								<div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>
										Pendiente de aprobación (revisión típica: &lt;24h)
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
