"use client";

import { ArrowRight, Edit3, Share2, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EditEventDialog } from "@/components/events/edit";
import type { Event, Organization } from "@/lib/db/schema";
import { InviteDialog } from "./invite-dialog";
import { ShareEventDialog } from "./share-event-dialog";

interface ManageDashboardProps {
	event: Event & {
		organization?: Organization | null;
	};
}

export function ManageDashboard({ event }: ManageDashboardProps) {
	return (
		<div className="space-y-6">
			<div className="rounded-lg border bg-card divide-y">
				<InviteDialog event={event}>
					<button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
								<Users className="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<p className="text-sm font-medium">Invitar miembros</p>
								<p className="text-xs text-muted-foreground">
									Gestionar invitaciones a la comunidad
								</p>
							</div>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
					</button>
				</InviteDialog>

				<ShareEventDialog event={event}>
					<button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-md bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
								<Share2 className="h-4 w-4 text-pink-600" />
							</div>
							<div>
								<p className="text-sm font-medium">Compartir evento</p>
								<p className="text-xs text-muted-foreground">
									Redes sociales y enlaces
								</p>
							</div>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
					</button>
				</ShareEventDialog>

				<EditEventDialog event={event}>
					<button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
								<Edit3 className="h-4 w-4 text-emerald-600" />
							</div>
							<div>
								<p className="text-sm font-medium">Editar detalles</p>
								<p className="text-xs text-muted-foreground">
									Actualizar información del evento
								</p>
							</div>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
					</button>
				</EditEventDialog>

				<button
					disabled
					className="w-full flex items-center justify-between p-4 text-left opacity-50 cursor-not-allowed"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
							<Sparkles className="h-4 w-4 text-amber-600" />
						</div>
						<div>
							<p className="text-sm font-medium">Generar banner con IA</p>
							<p className="text-xs text-muted-foreground">
								Próximamente con Nano Banana 🍌
							</p>
						</div>
					</div>
				</button>
			</div>

			{event.organization && (
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-4">
						{/* Organization logo */}
						{event.organization.logoUrl ? (
							<div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-border">
								<Image
									src={event.organization.logoUrl}
									alt={
										event.organization.displayName || event.organization.name
									}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-20 w-20 shrink-0 rounded-lg bg-muted border border-border flex items-center justify-center text-2xl font-semibold text-muted-foreground">
								{(event.organization.displayName || event.organization.name)
									.charAt(0)
									.toUpperCase()}
							</div>
						)}

						<div className="flex-1 min-w-0">
							<p className="text-xs text-muted-foreground mb-1">Comunidad</p>
							<p className="text-lg font-semibold truncate">
								{event.organization.displayName || event.organization.name}
							</p>
							<Link
								href={`/c/${event.organization.slug}`}
								className="inline-flex items-center gap-1.5 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Ver todos los eventos
								<ArrowRight className="h-3.5 w-3.5" />
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
