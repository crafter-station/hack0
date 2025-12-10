"use client";

import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircle,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	Database,
	ExternalLink,
	Facebook,
	Globe,
	Linkedin,
	MapPin,
	Share2,
	Tag,
	Trophy,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EditEventForm } from "@/components/events/edit-event-form";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { CohostSelector } from "@/components/events/cohost-selector";
import { Button } from "@/components/ui/button";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import type { Event, Organization, WinnerClaim, ImportJob, NotificationLog, EventHostOrganization } from "@/lib/db/schema";
import { SPONSOR_TIER_LABELS } from "@/lib/db/schema";
import {
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
} from "@/lib/event-utils";

interface ManageContentProps {
	event: Event;
	community: Organization;
	slug: string;
	eventSlug: string;
	tab: string;
	sponsors: EventSponsorWithOrg[];
	cohosts: (EventHostOrganization & { organization: Organization })[];
	winnerClaims: WinnerClaim[];
	importJobs: ImportJob[];
	notificationLogs: NotificationLog[];
}

export function ManageContent({
	event,
	community,
	slug,
	eventSlug,
	tab,
	sponsors,
	cohosts,
	winnerClaims,
	importJobs,
	notificationLogs,
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

		const now = new Date();
		const hasInconsistentStatus =
			(status.status === "upcoming" && endDate && endDate < now) ||
			(status.status === "ongoing" && endDate && endDate < now) ||
			(status.status === "open" && deadline && deadline < now && (!startDate || startDate > now));

		const needsRegistrationDeadline = status.status === "open" && !deadline;

		return (
			<div className="space-y-6">
				{/* Sanity Checks */}
				{hasInconsistentStatus && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 px-4 py-3.5">
						<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-red-900 dark:text-red-100">
								Inconsistencia detectada
							</p>
							<p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
								El estado del evento ({status.label}) no coincide con las fechas. Por favor actualiza las fechas o el estado.
							</p>
						</div>
					</div>
				)}

				{needsRegistrationDeadline && (
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3.5">
						<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
								Falta fecha de cierre
							</p>
							<p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
								El evento está marcado como "Abierto" pero no tiene fecha de cierre de registro.
							</p>
						</div>
					</div>
				)}

				{!event.isApproved && (
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3.5">
						<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
								Pendiente de aprobación
							</p>
							<p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
								Este evento será visible una vez aprobado. Revisión típica:
								&lt;24h
							</p>
						</div>
					</div>
				)}

				<div className="grid lg:grid-cols-[1fr_340px] gap-6">
					<div className="space-y-6">
						<div className="rounded-lg border bg-card">
							<div className="px-5 py-4 border-b">
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<h3 className="text-sm font-semibold">Detalles del evento</h3>
									</div>
									<div className="flex items-center gap-2 flex-wrap">
										<div
											className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
												status.status === "ended"
													? "bg-muted text-muted-foreground"
													: status.status === "ongoing"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: status.status === "open"
															? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
															: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
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

										<div
											className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
												event.approvalStatus === "approved"
													? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
													: event.approvalStatus === "pending"
														? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
														: "bg-red-500/10 text-red-700 dark:text-red-400"
											}`}
										>
											{event.approvalStatus === "approved" && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
											{event.approvalStatus === "approved" ? "Aprobado" : event.approvalStatus === "pending" ? "Pendiente" : "Rechazado"}
										</div>

										{event.isFeatured && (
											<div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
												Destacado
											</div>
										)}

										{event.isOrganizerVerified && (
											<div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
												<CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
												Organizador verificado
											</div>
										)}

										{event.sourceScrapedAt && (
											<div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-muted text-muted-foreground">
												<Database className="h-3 w-3" />
												Importado
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="p-6 space-y-5">

								<div className="grid sm:grid-cols-2 gap-5">
									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<Tag className="h-4 w-4" />
											Tipo
										</div>
										<p className="text-sm font-medium capitalize">
											{getEventTypeLabel(event.eventType)}
										</p>
									</div>

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<Calendar className="h-4 w-4" />
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
											<p className="text-sm text-muted-foreground">
												Por definir
											</p>
										)}
										{deadline && (
											<p className="text-xs text-muted-foreground mt-0.5">
												Cierra {format(deadline, "d MMM", { locale: es })}
											</p>
										)}
									</div>

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<MapPin className="h-4 w-4" />
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
									<div className="pt-5 border-t">
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<Trophy className="h-4 w-4" />
											Premios
										</div>
										<p className="text-base font-semibold text-emerald-600 dark:text-emerald-500">
											{event.prizeCurrency === "PEN" ? "S/" : "$"}
											{event.prizePool.toLocaleString()}
										</p>
										{event.prizeDescription && (
											<p className="text-xs text-muted-foreground mt-1.5">
												{event.prizeDescription}
											</p>
										)}
									</div>
								)}

								<div className="pt-5 border-t grid grid-cols-3 gap-5">
									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<Users className="h-4 w-4" />
											Nivel requerido
										</div>
										<p className="text-sm font-medium">
											{getSkillLevelLabel(event.skillLevel)}
										</p>
									</div>

									<div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
											<Clock className="h-4 w-4" />
											Creado
										</div>
										<p className="text-sm font-medium">
											{formatDistanceToNow(new Date(event.createdAt), {
												addSuffix: true,
												locale: es,
											})}
										</p>
									</div>

									{event.updatedAt && (
										<div>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
												<Clock className="h-4 w-4" />
												Actualizado
											</div>
											<p className="text-sm font-medium">
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

						{sponsors.length > 0 && (
							<div className="rounded-lg border bg-card">
								<div className="px-5 py-4 border-b">
									<div className="flex items-center gap-2">
										<Trophy className="h-4 w-4 text-muted-foreground" />
										<h3 className="text-sm font-semibold">
											Sponsors ({sponsors.length})
										</h3>
									</div>
								</div>
								<div className="p-6">
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
														<Button
															variant="ghost"
															size="sm"
															className="h-7 w-7 p-0"
														>
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
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-muted-foreground" />
									<h3 className="text-sm font-semibold">Comunidad</h3>
								</div>
							</div>
							<div className="p-5">
								<div className="flex items-center gap-3 mb-3">
									{community.logoUrl ? (
										<div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-border">
											<Image
												src={community.logoUrl}
												alt={community.displayName || community.name}
												fill
												className="object-cover"
											/>
										</div>
									) : (
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted border text-lg font-semibold text-muted-foreground">
											{(community.displayName || community.name).charAt(0).toUpperCase()}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{community.displayName || community.name}
										</p>
									</div>
								</div>
								<Link href={`/c/${community.slug}`}>
									<Button variant="outline" size="sm" className="w-full h-9">
										Ver todos los eventos
									</Button>
								</Link>
							</div>
						</div>

						<div className="rounded-lg border bg-card">
							<div className="px-5 py-4 border-b">
								<div className="flex items-center gap-2">
									<Share2 className="h-4 w-4 text-muted-foreground" />
									<h3 className="text-sm font-semibold">Compartir evento</h3>
								</div>
							</div>
							<div className="p-5">
								<div className="grid grid-cols-4 gap-2">
									<button
										type="button"
										onClick={copyToClipboard}
										className="flex h-10 flex-col items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
										title="Copiar enlace"
									>
										{copied ? (
											<Check className="h-5 w-5 text-emerald-600" />
										) : (
											<Copy className="h-5 w-5 text-muted-foreground" />
										)}
									</button>
									<a
										href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex h-10 flex-col items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
										title="Compartir en Facebook"
									>
										<Facebook className="h-5 w-5 text-muted-foreground" />
									</a>
									<a
										href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(event.name)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex h-10 flex-col items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
										title="Compartir en X"
									>
										<svg
											viewBox="0 0 24 24"
											className="h-5 w-5 fill-muted-foreground"
											aria-hidden="true"
										>
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</a>
									<a
										href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex h-10 flex-col items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
										title="Compartir en LinkedIn"
									>
										<Linkedin className="h-5 w-5 text-muted-foreground" />
									</a>
								</div>
							</div>
						</div>

						{(event.websiteUrl || event.registrationUrl) && (
							<div className="rounded-lg border bg-card">
								<div className="px-5 py-4 border-b">
									<div className="flex items-center gap-2">
										<Globe className="h-4 w-4 text-muted-foreground" />
										<h3 className="text-sm font-semibold">Enlaces</h3>
									</div>
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
					</div>
				</div>
			</div>
		);
	}

	if (tab === "edit") {
		return (
			<div className="space-y-6">
				<EditEventForm event={event} sponsors={sponsors} />

				<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
					<div className="px-5 py-4 border-b border-red-200 dark:border-red-900/50">
						<h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
							Zona de peligro
						</h3>
					</div>
					<div className="p-5 space-y-3">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-medium text-red-900 dark:text-red-100">
									Borrar este evento
								</p>
								<p className="text-xs text-red-700 dark:text-red-400 mt-1">
									Una vez borrado, no hay vuelta atrás. Por favor, ten cuidado.
								</p>
							</div>
							<DeleteEventButton
								eventId={event.id}
								eventName={event.name}
								communitySlug={slug}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (tab === "team") {
		const transformedCohosts = cohosts.map((cohost) => ({
			id: cohost.id,
			organizationId: cohost.organizationId,
			organizationName: cohost.organization.displayName || cohost.organization.name,
			organizationSlug: cohost.organization.slug,
			organizationLogoUrl: cohost.organization.logoUrl,
			status: cohost.status,
			isPrimary: cohost.isPrimary,
		}));

		return (
			<CohostSelector
				eventId={event.id}
				organizationId={community.id}
				currentUserId={community.ownerUserId}
				existingCohosts={transformedCohosts}
			/>
		);
	}

	if (tab === "winners") {
		const pendingWinnerClaims = winnerClaims.filter((c) => c.status === "pending");
		const approvedWinnerClaims = winnerClaims.filter((c) => c.status === "approved");
		const rejectedWinnerClaims = winnerClaims.filter((c) => c.status === "rejected");

		return (
			<div className="space-y-6">
				{/* Winner Claims */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Trophy className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-sm font-semibold">
									Winner Claims ({winnerClaims.length})
								</h3>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<span className="text-amber-600">{pendingWinnerClaims.length} pendiente(s)</span>
								<span className="text-muted-foreground">·</span>
								<span className="text-emerald-600">{approvedWinnerClaims.length} aprobado(s)</span>
							</div>
						</div>
					</div>
					<div className="p-6">
						{winnerClaims.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No hay claims de ganadores todavía
							</p>
						) : (
							<div className="space-y-3">
								{winnerClaims.map((claim) => (
									<div
										key={claim.id}
										className="rounded-lg border p-4 space-y-2"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-lg">
														{claim.position === 1 ? "🥇" : claim.position === 2 ? "🥈" : "🥉"}
													</span>
													<p className="text-sm font-medium">
														{claim.teamName || claim.projectName || `Posición ${claim.position}`}
													</p>
												</div>
												{claim.projectName && claim.teamName && (
													<p className="text-xs text-muted-foreground">Proyecto: {claim.projectName}</p>
												)}
												{claim.projectUrl && (
													<a
														href={claim.projectUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
													>
														<ExternalLink className="h-3 w-3" />
														Ver proyecto
													</a>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													claim.status === "approved"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: claim.status === "pending"
															? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
															: "bg-red-500/10 text-red-700 dark:text-red-400"
												}`}
											>
												{claim.status === "approved" ? "Aprobado" : claim.status === "pending" ? "Pendiente" : "Rechazado"}
											</div>
										</div>
										<a
											href={claim.proofUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
										>
											<ExternalLink className="h-3 w-3" />
											Ver prueba
										</a>
										{claim.proofDescription && (
											<p className="text-xs text-muted-foreground">{claim.proofDescription}</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (tab === "analytics") {
		return (
			<div className="space-y-6">
				{/* Import Jobs */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center gap-2">
							<Database className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold">
								Import Jobs ({importJobs.length})
							</h3>
						</div>
					</div>
					<div className="p-6">
						{importJobs.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								Este evento fue creado manualmente (no importado)
							</p>
						) : (
							<div className="space-y-3">
								{importJobs.map((job) => (
									<div
										key={job.id}
										className="rounded-lg border p-4 space-y-2"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">{job.sourceType}</p>
												<a
													href={job.sourceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
												>
													<ExternalLink className="h-3 w-3" />
													{job.sourceUrl}
												</a>
												{job.createdAt && (
													<p className="text-xs text-muted-foreground">
														{format(new Date(job.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
													</p>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													job.status === "completed"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: job.status === "processing"
															? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
															: job.status === "failed"
																? "bg-red-500/10 text-red-700 dark:text-red-400"
																: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
												}`}
											>
												{job.status}
											</div>
										</div>
										{job.errorMessage && (
											<p className="text-xs text-red-600">{job.errorMessage}</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Notification Logs */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold">
								Notificaciones Enviadas ({notificationLogs.length})
							</h3>
						</div>
					</div>
					<div className="p-6">
						{notificationLogs.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No se han enviado notificaciones para este evento todavía
							</p>
						) : (
							<div className="space-y-3">
								{notificationLogs.map((log) => (
									<div
										key={log.id}
										className="rounded-lg border p-4 space-y-2"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">{log.subject}</p>
												{log.sentAt && (
													<p className="text-xs text-muted-foreground">
														{format(new Date(log.sentAt), "d MMM yyyy, HH:mm", { locale: es })}
													</p>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													log.status === "sent"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: log.status === "failed"
															? "bg-red-500/10 text-red-700 dark:text-red-400"
															: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
												}`}
											>
												{log.status}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return null;
}
