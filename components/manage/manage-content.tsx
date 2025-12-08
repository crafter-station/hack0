"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircle,
	Building2,
	Calendar,
	Check,
	Copy,
	ExternalLink,
	Eye,
	Globe,
	MapPin,
	Tag,
	Trophy,
	Users,
} from "lucide-react";
import { EditEventForm } from "@/components/events/edit-event-form";
import { Button } from "@/components/ui/button";
import {
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
} from "@/lib/event-utils";
import type { Event, Organization } from "@/lib/db/schema";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import { SPONSOR_TIER_LABELS } from "@/lib/db/schema";
import { useState } from "react";

interface ManageContentProps {
	event: Event;
	community: Organization;
	slug: string;
	eventSlug: string;
	tab: string;
	sponsors: EventSponsorWithOrg[];
}

export function ManageContent({
	event,
	community,
	slug,
	eventSlug,
	tab,
	sponsors,
}: ManageContentProps) {
	const status = getEventStatus(event);
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const deadline = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: null;

	if (tab === "overview") {
		const [copied, setCopied] = useState(false);
		const eventUrl = `https://hack0.dev/c/${slug}/events/${eventSlug}`;

		const copyToClipboard = () => {
			navigator.clipboard.writeText(eventUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		};

		return (
			<div className="space-y-6">
				{!event.isApproved && (
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3">
						<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
								Pendiente de aprobación
							</p>
							<p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
								Este evento será visible una vez aprobado. Revisión típica: &lt;24h
							</p>
						</div>
					</div>
				)}

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
					<div className="flex items-start gap-3 p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
							<Eye className="h-4 w-4 text-blue-600 dark:text-blue-500" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1">
								Vista pública
							</p>
							<Link
								href={`/c/${slug}/events/${eventSlug}`}
								target="_blank"
								className="text-sm font-medium hover:underline inline-flex items-center gap-1"
							>
								Ver página
								<ExternalLink className="h-3 w-3" />
							</Link>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
							<Copy className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1">
								Compartir
							</p>
							<button
								type="button"
								onClick={copyToClipboard}
								className="text-sm font-medium hover:underline text-left"
							>
								{copied ? (
									<span className="inline-flex items-center gap-1 text-emerald-600">
										<Check className="h-3 w-3" />
										Copiado
									</span>
								) : (
									"Copiar enlace"
								)}
							</button>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-muted/20 opacity-60">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Users className="h-4 w-4 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1">
								Equipo
							</p>
							<p className="text-sm font-medium text-muted-foreground">
								Próximamente
							</p>
						</div>
					</div>
				</div>

				<div className="grid lg:grid-cols-[1fr_320px] gap-6">
					<div className="space-y-6">
						<div className="rounded-lg border bg-card">
							<div className="px-5 py-4 border-b">
								<h3 className="text-sm font-semibold">Detalles del evento</h3>
							</div>
							<div className="p-5 space-y-4">
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
											<Calendar className="h-3.5 w-3.5" />
											Estado
										</div>
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

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
											<Tag className="h-3.5 w-3.5" />
											Tipo
										</div>
										<p className="text-sm font-medium capitalize">
											{getEventTypeLabel(event.eventType)}
										</p>
									</div>

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
											<Calendar className="h-3.5 w-3.5" />
											Fechas
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
											<p className="text-sm text-muted-foreground">Por definir</p>
										)}
										{deadline && (
											<p className="text-xs text-muted-foreground mt-0.5">
												Cierra {format(deadline, "d MMM", { locale: es })}
											</p>
										)}
									</div>

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
											<MapPin className="h-3.5 w-3.5" />
											Formato
										</div>
										<p className="text-sm font-medium capitalize">
											{getFormatLabel(event.format)}
										</p>
										{event.city && (
											<p className="text-xs text-muted-foreground mt-0.5">
												{event.city}
											</p>
										)}
									</div>
								</div>

								{event.prizePool && (
									<div className="pt-4 border-t">
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
											<Trophy className="h-3.5 w-3.5" />
											Premios
										</div>
										<p className="text-sm font-semibold">
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

								<div className="pt-4 border-t">
									<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
										Nivel requerido
									</div>
									<p className="text-sm font-medium">
										{getSkillLevelLabel(event.skillLevel)}
									</p>
								</div>
							</div>
						</div>

						{sponsors.length > 0 && (
							<div className="rounded-lg border bg-card">
								<div className="px-5 py-4 border-b">
									<h3 className="text-sm font-semibold">
										Sponsors ({sponsors.length})
									</h3>
								</div>
								<div className="p-5">
									<div className="space-y-3">
										{sponsors.map((sponsor) => (
											<div
												key={sponsor.id}
												className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30"
											>
												<div className="flex h-8 w-8 items-center justify-center rounded bg-background border shrink-0">
													<Building2 className="h-4 w-4 text-muted-foreground" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{sponsor.organization.name}
													</p>
													<p className="text-xs text-muted-foreground">
														{SPONSOR_TIER_LABELS[sponsor.tier]}
													</p>
												</div>
												{sponsor.organization.websiteUrl && (
													<a
														href={sponsor.organization.websiteUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="shrink-0"
													>
														<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
															<ExternalLink className="h-3.5 w-3.5" />
														</Button>
													</a>
												)}
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="space-y-4">
						<div className="rounded-lg border bg-card">
							<div className="px-5 py-4 border-b">
								<h3 className="text-sm font-semibold">Comunidad</h3>
							</div>
							<div className="p-5">
								<div className="flex items-center gap-3 mb-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border">
										<Building2 className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{community.displayName || community.name}
										</p>
									</div>
								</div>
								<Link href={`/c/${community.slug}`}>
									<Button variant="outline" size="sm" className="w-full h-8 text-xs">
										Ver todos los eventos
									</Button>
								</Link>
							</div>
						</div>

						{(event.websiteUrl || event.registrationUrl) && (
							<div className="rounded-lg border bg-card">
								<div className="px-5 py-4 border-b">
									<h3 className="text-sm font-semibold">Enlaces</h3>
								</div>
								<div className="p-5 space-y-2">
									{event.websiteUrl && (
										<a
											href={event.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 text-sm hover:underline"
										>
											<Globe className="h-3.5 w-3.5 text-muted-foreground" />
											Sitio web
											<ExternalLink className="h-3 w-3 ml-auto" />
										</a>
									)}
									{event.registrationUrl && (
										<a
											href={event.registrationUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 text-sm hover:underline"
										>
											<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
											Registro
											<ExternalLink className="h-3 w-3 ml-auto" />
										</a>
									)}
								</div>
							</div>
						)}

						<div className="rounded-lg border bg-card">
							<div className="px-5 py-4 border-b">
								<h3 className="text-sm font-semibold">Metadata</h3>
							</div>
							<div className="p-5 space-y-3 text-xs">
								<div>
									<p className="text-muted-foreground mb-0.5">Creado</p>
									<p className="font-medium">
										{formatDistanceToNow(new Date(event.createdAt), {
											addSuffix: true,
											locale: es,
										})}
									</p>
								</div>
								{event.updatedAt && (
									<div>
										<p className="text-muted-foreground mb-0.5">
											Última actualización
										</p>
										<p className="font-medium">
											{formatDistanceToNow(new Date(event.updatedAt), {
												addSuffix: true,
												locale: es,
											})}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (tab === "edit") {
		return <EditEventForm event={event} sponsors={sponsors} />;
	}

	return null;
}
