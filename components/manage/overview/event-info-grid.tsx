"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowRight,
	Calendar,
	Check,
	Clock,
	Copy,
	ExternalLink,
	Facebook,
	Globe,
	Linkedin,
	MapPin,
	Tag,
	Trophy,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, Organization } from "@/lib/db/schema";
import {
	formatEventDate,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
} from "@/lib/event-utils";

interface EventInfoGridProps {
	event: Event;
	community: Organization;
}

export function EventInfoGrid({ event, community }: EventInfoGridProps) {
	const [copied, setCopied] = useState(false);
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const deadline = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: null;
	const eventUrl = `https://hack0.dev/e/${event.shortCode}`;

	const copyToClipboard = () => {
		try {
			navigator.clipboard.writeText(eventUrl);
			setCopied(true);
			toast.success("Enlace copiado");
			setTimeout(() => setCopied(false), 2000);
		} catch (_error) {
			toast.error("Error al copiar");
		}
	};

	return (
		<div className="grid lg:grid-cols-[1fr_320px] gap-4">
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						Detalles del evento
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Tag className="h-3.5 w-3.5" />
								Tipo
							</div>
							<p className="text-sm font-medium">
								{getEventTypeLabel(event.eventType)}
							</p>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<MapPin className="h-3.5 w-3.5" />
								Formato
							</div>
							<p className="text-sm font-medium">
								{getFormatLabel(event.format)}
								{event.city && (
									<span className="text-muted-foreground"> • {event.city}</span>
								)}
							</p>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Users className="h-3.5 w-3.5" />
								Nivel
							</div>
							<p className="text-sm font-medium">
								{getSkillLevelLabel(event.skillLevel)}
							</p>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Calendar className="h-3.5 w-3.5" />
								Fechas
							</div>
							<p className="text-sm font-medium">
								{startDate && endDate ? (
									<>
										{formatEventDate(startDate, "d MMM")} –{" "}
										{formatEventDate(endDate, "d MMM yyyy")}
									</>
								) : startDate ? (
									formatEventDate(startDate, "d MMMM yyyy")
								) : (
									<span className="text-muted-foreground">Por definir</span>
								)}
							</p>
							{deadline && (
								<p className="text-xs text-muted-foreground">
									Cierra {formatEventDate(deadline, "d MMM")}
								</p>
							)}
						</div>
					</div>

					{event.prizePool && (
						<div className="pt-4 border-t space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Trophy className="h-3.5 w-3.5" />
								Premios
							</div>
							<p className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">
								{event.prizeCurrency === "PEN" ? "S/" : "$"}
								{event.prizePool.toLocaleString()}
							</p>
							{event.prizeDescription && (
								<p className="text-xs text-muted-foreground">
									{event.prizeDescription}
								</p>
							)}
						</div>
					)}

					<div className="pt-4 border-t grid grid-cols-2 gap-4">
						{event.createdAt && (
							<div className="space-y-1">
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Clock className="h-3.5 w-3.5" />
									Creado
								</div>
								<p className="text-sm">
									{formatDistanceToNow(new Date(event.createdAt), {
										addSuffix: true,
										locale: es,
									})}
								</p>
							</div>
						)}

						{event.updatedAt && (
							<div className="space-y-1">
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Clock className="h-3.5 w-3.5" />
									Actualizado
								</div>
								<p className="text-sm">
									{formatDistanceToNow(new Date(event.updatedAt), {
										addSuffix: true,
										locale: es,
									})}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="space-y-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Comunidad</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							{community.logoUrl ? (
								<div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border">
									<Image
										src={community.logoUrl}
										alt={community.displayName || community.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border text-sm font-semibold text-muted-foreground">
									{(community.displayName || community.name)
										.charAt(0)
										.toUpperCase()}
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{community.displayName || community.name}
								</p>
							</div>
						</div>
						<Link href={`/c/${community.slug}`}>
							<Button
								variant="ghost"
								size="sm"
								className="w-full mt-3 justify-between text-muted-foreground hover:text-foreground"
							>
								Ver todos los eventos
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				{(event.websiteUrl || event.registrationUrl) && (
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								<Globe className="h-4 w-4 text-muted-foreground" />
								Enlaces
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{event.websiteUrl && (
								<a
									href={event.websiteUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									<Globe className="h-3.5 w-3.5" />
									<span className="flex-1 truncate">Sitio web</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							)}
							{event.registrationUrl && (
								<a
									href={event.registrationUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									<ExternalLink className="h-3.5 w-3.5" />
									<span className="flex-1 truncate">Registro</span>
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Compartir</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-4 gap-2">
							<button
								type="button"
								onClick={copyToClipboard}
								className="flex h-10 flex-col items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="Copiar enlace"
							>
								{copied ? (
									<Check className="h-4 w-4 text-emerald-600" />
								) : (
									<Copy className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
							<a
								href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 flex-col items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="Facebook"
							>
								<Facebook className="h-4 w-4 text-muted-foreground" />
							</a>
							<a
								href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(event.name)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 flex-col items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="X"
							>
								<svg
									viewBox="0 0 24 24"
									className="h-4 w-4 fill-muted-foreground"
									aria-hidden="true"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
							<a
								href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 flex-col items-center justify-center rounded-lg border hover:bg-muted transition-colors"
								title="LinkedIn"
							>
								<Linkedin className="h-4 w-4 text-muted-foreground" />
							</a>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
