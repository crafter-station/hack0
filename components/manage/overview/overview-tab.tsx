"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	Check,
	Copy,
	ExternalLink,
	Globe,
	MapPin,
	Pencil,
	Share2,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import { ShareEventDialog } from "@/components/manage/share-event-dialog";
import {
	ApprovalBadge,
	StatusBadge,
} from "@/components/manage/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import type { Event, Organization } from "@/lib/db/schema";
import {
	formatEventDate,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
} from "@/lib/event-utils";

interface OverviewTabProps {
	event: Event;
	community: Organization;
	sponsors: EventSponsorWithOrg[];
}

export function OverviewTab({ event, community, sponsors }: OverviewTabProps) {
	const [copied, setCopied] = useState(false);
	const status = getEventStatus(event);
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const eventUrl = `https://hack0.dev/e/${event.shortCode || event.slug}`;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(eventUrl);
		setCopied(true);
		toast.success("Enlace copiado");
		setTimeout(() => setCopied(false), 2000);
	};

	const now = new Date();
	const deadline = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: null;
	const hasInconsistentStatus =
		(status.status === "upcoming" && endDate && endDate < now) ||
		(status.status === "ongoing" && endDate && endDate < now) ||
		(status.status === "open" &&
			deadline &&
			deadline < now &&
			(!startDate || startDate > now));

	return (
		<div className="space-y-4">
			{(hasInconsistentStatus || !event.isApproved) && (
				<div className="space-y-2">
					{hasInconsistentStatus && (
						<div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm">
							<AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
							<span className="text-red-700 dark:text-red-400">
								El estado no coincide con las fechas
							</span>
						</div>
					)}
					{!event.isApproved && (
						<div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm">
							<AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
							<span className="text-amber-700 dark:text-amber-400">
								Pendiente de aprobación
							</span>
						</div>
					)}
				</div>
			)}

			<div className="grid grid-cols-3 gap-3">
				<Link href={`/e/${event.shortCode || event.slug}/manage?tab=edit`}>
					<Button variant="outline" className="w-full h-14 flex-col gap-1">
						<Pencil className="h-4 w-4 text-emerald-600" />
						<span className="text-xs">Editar evento</span>
					</Button>
				</Link>

				<ShareEventDialog event={event}>
					<Button variant="outline" className="h-14 flex-col gap-1">
						<Share2 className="h-4 w-4 text-pink-600" />
						<span className="text-xs">Compartir</span>
					</Button>
				</ShareEventDialog>

				<Link href={`/e/${event.shortCode || event.slug}/manage?tab=team`}>
					<Button variant="outline" className="w-full h-14 flex-col gap-1">
						<Users className="h-4 w-4 text-blue-600" />
						<span className="text-xs">Invitar equipo</span>
					</Button>
				</Link>
			</div>

			<div className="grid lg:grid-cols-[1fr_280px] gap-4">
				<div className="rounded-xl border bg-card">
					<div className="p-4 flex gap-4">
						{event.eventImageUrl ? (
							<div className="relative h-28 w-28 shrink-0 rounded-lg overflow-hidden border bg-muted">
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-28 w-28 shrink-0 rounded-lg border bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
								<Calendar className="h-8 w-8 text-muted-foreground/50" />
							</div>
						)}

						<div className="flex-1 min-w-0 space-y-2">
							<div className="flex items-center gap-2 flex-wrap">
								<StatusBadge status={status.status} label={status.label} />
								{event.approvalStatus && (
									<ApprovalBadge status={event.approvalStatus} />
								)}
							</div>

							<h3 className="font-semibold text-lg leading-tight line-clamp-2">
								{event.name}
							</h3>

							<div className="flex items-center gap-3 text-sm text-muted-foreground">
								<span>{getEventTypeLabel(event.eventType)}</span>
								<span>•</span>
								<span>{getFormatLabel(event.format)}</span>
								{event.city && (
									<>
										<span>•</span>
										<span>{event.city}</span>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="border-t px-4 py-3">
						<h4 className="text-sm font-medium text-muted-foreground mb-3">
							Cuándo y Dónde
						</h4>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/50 text-center">
									{startDate ? (
										<>
											<span className="text-[10px] font-medium uppercase text-muted-foreground">
												{formatEventDate(startDate, "MMM")}
											</span>
											<span className="text-lg font-bold leading-none">
												{formatEventDate(startDate, "d")}
											</span>
										</>
									) : (
										<Calendar className="h-5 w-5 text-muted-foreground" />
									)}
								</div>
								<div>
									<p className="font-medium">
										{startDate
											? formatEventDate(startDate, "EEEE, d 'de' MMMM")
											: "Fecha por definir"}
									</p>
									{startDate &&
										endDate &&
										startDate.getTime() !== endDate.getTime() && (
											<p className="text-sm text-muted-foreground">
												Hasta {formatEventDate(endDate, "d 'de' MMMM")}
											</p>
										)}
								</div>
							</div>

							{(event.city || event.venue || event.format) && (
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
										<MapPin className="h-5 w-5 text-muted-foreground" />
									</div>
									<div>
										<p className="font-medium">
											{getFormatLabel(event.format)}
										</p>
										{(event.venue || event.city) && (
											<p className="text-sm text-muted-foreground">
												{event.venue || event.city}
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="border-t px-4 py-3">
						<h4 className="text-sm font-medium text-muted-foreground mb-3">
							Detalles
						</h4>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground text-xs">Nivel</p>
								<p className="font-medium">
									{getSkillLevelLabel(event.skillLevel)}
								</p>
							</div>
							{event.prizePool && (
								<div>
									<p className="text-muted-foreground text-xs">Premio</p>
									<p className="font-medium text-emerald-600">
										{event.prizeCurrency === "PEN" ? "S/" : "$"}
										{event.prizePool.toLocaleString()}
									</p>
								</div>
							)}
							{event.createdAt && (
								<div>
									<p className="text-muted-foreground text-xs">Creado</p>
									<p className="font-medium">
										{formatDistanceToNow(new Date(event.createdAt), {
											addSuffix: false,
											locale: es,
										})}
									</p>
								</div>
							)}
							{event.updatedAt && (
								<div>
									<p className="text-muted-foreground text-xs">Actualizado</p>
									<p className="font-medium">
										{formatDistanceToNow(new Date(event.updatedAt), {
											addSuffix: false,
											locale: es,
										})}
									</p>
								</div>
							)}
						</div>
					</div>

					{sponsors.length > 0 && (
						<div className="border-t px-4 py-3">
							<h4 className="text-sm font-medium text-muted-foreground mb-2">
								Sponsors ({sponsors.length})
							</h4>
							<div className="flex flex-wrap gap-2">
								{sponsors.map((sponsor) => (
									<div
										key={sponsor.id}
										className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1"
									>
										{sponsor.organization.logoUrl ? (
											<div className="relative h-4 w-4 rounded-full overflow-hidden">
												<Image
													src={sponsor.organization.logoUrl}
													alt={sponsor.organization.name}
													fill
													className="object-cover"
												/>
											</div>
										) : (
											<div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium">
												{sponsor.organization.name.charAt(0)}
											</div>
										)}
										<span className="text-xs">
											{sponsor.organization.displayName ||
												sponsor.organization.name}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border bg-card p-4">
						<h4 className="text-sm font-medium mb-3">Comunidad</h4>
						<Link
							href={`/c/${community.slug}`}
							className="flex items-center gap-3 group"
						>
							{community.logoUrl ? (
								<div className="relative h-10 w-10 rounded-lg overflow-hidden border">
									<Image
										src={community.logoUrl}
										alt={community.displayName || community.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="h-10 w-10 rounded-lg bg-muted border flex items-center justify-center font-semibold text-muted-foreground">
									{(community.displayName || community.name).charAt(0)}
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="font-medium truncate group-hover:text-primary transition-colors">
									{community.displayName || community.name}
								</p>
								<p className="text-xs text-muted-foreground">
									Ver todos los eventos
								</p>
							</div>
							<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
						</Link>
					</div>

					{(event.websiteUrl || event.registrationUrl) && (
						<div className="rounded-xl border bg-card p-4">
							<h4 className="text-sm font-medium flex items-center gap-2 mb-3">
								<Globe className="h-4 w-4 text-muted-foreground" />
								Enlaces
							</h4>
							<div className="space-y-2">
								{event.websiteUrl && (
									<a
										href={event.websiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-between text-sm hover:text-primary transition-colors"
									>
										<span>Sitio web</span>
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
								)}
								{event.registrationUrl && (
									<a
										href={event.registrationUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-between text-sm hover:text-primary transition-colors"
									>
										<span>Registro</span>
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
								)}
							</div>
						</div>
					)}

					<div className="rounded-xl border bg-card p-4">
						<h4 className="text-sm font-medium mb-3">Compartir</h4>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={copyToClipboard}
								className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="Copiar enlace"
							>
								{copied ? (
									<Check className="h-4 w-4 text-emerald-600" />
								) : (
									<Copy className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
							<a
								href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(event.name)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="X (Twitter)"
							>
								<TwitterLogo className="h-3.5 w-3.5 text-muted-foreground" />
							</a>
							<a
								href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="LinkedIn"
							>
								<LinkedinLogo className="h-4 w-4" mode="currentColor" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
