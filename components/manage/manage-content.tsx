"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Share2, Users } from "lucide-react";
import { EditEventForm } from "@/components/events/edit-event-form";
import { Button } from "@/components/ui/button";
import { getEventStatus } from "@/lib/event-utils";
import type { Event, Organization } from "@/lib/db/schema";

interface ManageContentProps {
	event: Event;
	community: Organization;
	slug: string;
	eventSlug: string;
	tab: string;
}

export function ManageContent({
	event,
	community,
	slug,
	eventSlug,
	tab,
}: ManageContentProps) {
	const status = getEventStatus(event);
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const deadline = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: null;

	if (tab === "overview") {
		return (
			<div className="space-y-6">
				{/* Critical Status - Only if needs attention */}
				{!event.isApproved && (
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3.5">
						<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
								Este evento será visible una vez aprobado
							</p>
							<p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
								Típicamente revisamos eventos en menos de 24 horas.
							</p>
						</div>
					</div>
				)}

				{/* Quick Actions Grid - Luma Style */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
							<Share2 className="h-5 w-5 text-pink-600 dark:text-pink-500" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium mb-2">Compartir evento</p>
							<div className="flex items-center gap-2">
								<input
									type="text"
									readOnly
									value={`https://hack0.dev/c/${slug}/events/${eventSlug}`}
									className="flex-1 px-2 py-1 rounded text-xs font-mono bg-muted border-0 text-muted-foreground min-w-0"
									onClick={(e) => {
										e.currentTarget.select();
										navigator.clipboard.writeText(e.currentTarget.value);
									}}
								/>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 text-xs shrink-0"
									onClick={() => {
										navigator.clipboard.writeText(
											`https://hack0.dev/c/${slug}/events/${eventSlug}`,
										);
									}}
								>
									Copiar
								</Button>
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20 opacity-60">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Users className="h-5 w-5 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium mb-1">Gestionar equipo</p>
							<p className="text-xs text-muted-foreground">
								Próximamente
							</p>
						</div>
					</div>
				</div>

				{/* Event Info Grid */}
				<div className="grid md:grid-cols-2 gap-6">
					{/* Left Column - Event Details */}
					<div className="space-y-4">
						<div className="rounded-lg border bg-card p-5 space-y-4">
							<div>
								<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
									Cuándo
								</p>
								<div className="flex items-center gap-2 mb-1">
									<div
										className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
											status.status === "ended"
												? "bg-muted text-muted-foreground"
												: status.status === "ongoing"
													? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
													: status.status === "open"
														? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
														: "bg-muted text-muted-foreground"
										}`}
									>
										<span
											className={`h-1.5 w-1.5 rounded-full ${
												status.status === "ongoing"
													? "bg-emerald-500 animate-pulse"
													: "bg-current opacity-60"
											}`}
										/>
										{status.label}
									</div>
								</div>
								{startDate && endDate ? (
									<p className="text-sm font-medium">
										{format(startDate, "d MMM", { locale: es })} –{" "}
										{format(endDate, "d MMM yyyy", { locale: es })}
									</p>
								) : startDate ? (
									<p className="text-sm font-medium">
										{format(startDate, "d MMMM yyyy", { locale: es })}
									</p>
								) : (
									<p className="text-sm text-muted-foreground">
										Fecha por definir
									</p>
								)}
								{deadline && (
									<p className="text-xs text-muted-foreground mt-1">
										Cierra {format(deadline, "d MMM", { locale: es })}
									</p>
								)}
							</div>

							<div className="border-t pt-4">
								<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
									Dónde
								</p>
								<p className="text-sm font-medium capitalize">{event.format}</p>
								{event.city && (
									<p className="text-sm text-muted-foreground">{event.city}</p>
								)}
							</div>
						</div>

						{event.prizePool && (
							<div className="rounded-lg border bg-card p-5">
								<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
									Premios
								</p>
								<p className="text-sm font-medium">
									{event.prizeCurrency === "PEN" ? "S/" : "$"}
									{event.prizePool.toLocaleString()}
								</p>
								{event.prizeDescription && (
									<p className="text-xs text-muted-foreground mt-1">
										{event.prizeDescription}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Right Column - Links & Community */}
					<div className="space-y-4">
						<div className="rounded-lg border bg-card p-5">
							<p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
								Comunidad
							</p>
							<div className="flex items-center justify-between gap-4">
								<p className="text-sm font-medium truncate">
									{community.displayName || community.name}
								</p>
								<Link href={`/c/${community.slug}`} className="shrink-0">
									<Button variant="outline" size="sm" className="h-8 text-xs">
										Ver todos
									</Button>
								</Link>
							</div>
						</div>

						{(event.websiteUrl || event.registrationUrl) && (
							<div className="rounded-lg border bg-card p-5">
								<p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
									Enlaces
								</p>
								<div className="space-y-2">
									{event.websiteUrl && (
										<a
											href={event.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
										>
											Sitio web ↗
										</a>
									)}
									{event.registrationUrl && (
										<a
											href={event.registrationUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
										>
											Registro ↗
										</a>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

			</div>
		);
	}

	if (tab === "edit") {
		return <EditEventForm event={event} />;
	}

	return null;
}
