import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Calendar, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AcceptCohostInviteButton } from "@/components/events/accept-cohost-invite-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import {
	acceptCohostInvite,
	rejectCohostInvite,
} from "@/lib/actions/cohost-invites";
import { db } from "@/lib/db";
import { eventHostOrganizations } from "@/lib/db/schema";
import { formatEventDateRange } from "@/lib/event-utils";

interface CohostInvitePageProps {
	params: Promise<{ slug: string; eventSlug: string; token: string }>;
	searchParams: Promise<{ error?: string }>;
}

async function CohostInviteContent({ token }: { token: string }) {
	const { userId } = await auth();

	const invite = await db.query.eventHostOrganizations.findFirst({
		where: eq(eventHostOrganizations.inviteToken, token),
		with: {
			event: true,
			organization: true,
		},
	});

	if (!invite) {
		return (
			<div className="max-w-md mx-auto mt-20">
				<div className="rounded-lg border bg-card p-8 text-center space-y-4">
					<div className="flex justify-center">
						<div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
						</div>
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-bold">Invitación no encontrada</h1>
						<p className="text-muted-foreground">
							Esta invitación no existe o ha sido eliminada.
						</p>
					</div>
					<Button asChild>
						<a href="/">Volver al inicio</a>
					</Button>
				</div>
			</div>
		);
	}

	if (invite.status !== "pending") {
		const statusText =
			invite.status === "approved"
				? "Ya aceptaste esta invitación"
				: "Esta invitación fue rechazada";

		return (
			<div className="max-w-md mx-auto mt-20">
				<div className="rounded-lg border bg-card p-8 text-center space-y-4">
					<div className="space-y-2">
						<h1 className="text-2xl font-bold">{statusText}</h1>
						<p className="text-muted-foreground">
							Esta invitación ya fue procesada.
						</p>
					</div>
					<Button asChild>
						<a href={`/events/${invite.event.slug}`}>Ver evento</a>
					</Button>
				</div>
			</div>
		);
	}

	if (!userId) {
		return (
			<div className="max-w-md mx-auto mt-20">
				<div className="rounded-lg border bg-card p-8 space-y-6">
					<div className="text-center space-y-4">
						<div className="flex justify-center">
							{invite.event.eventImageUrl ? (
								<img
									src={invite.event.eventImageUrl}
									alt={invite.event.name}
									className="h-24 w-24 rounded-lg object-cover border-2 border-border"
								/>
							) : (
								<div className="h-24 w-24 rounded-lg bg-muted border-2 border-border flex items-center justify-center">
									<Calendar className="h-12 w-12 text-muted-foreground" />
								</div>
							)}
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-bold">
								Invitación para co-organizar
							</h1>
							<p className="text-lg font-semibold">{invite.event.name}</p>
							<p className="text-sm text-muted-foreground">
								{formatEventDateRange(
									invite.event.startDate,
									invite.event.endDate,
								)}
							</p>
						</div>
					</div>

					<div className="rounded-lg bg-muted p-4 space-y-2">
						<p className="text-sm font-medium">Organización invitada:</p>
						<p className="text-lg font-semibold">
							{invite.organization.displayName || invite.organization.name}
						</p>
					</div>

					<div className="space-y-3">
						<Button asChild className="w-full">
							<a
								href={`/sign-in?redirect_url=${encodeURIComponent(`/events/${invite.event.slug}/cohost-invite/${token}`)}`}
							>
								Iniciar sesión
							</a>
						</Button>
						<Button asChild variant="outline" className="w-full">
							<a
								href={`/sign-up?redirect_url=${encodeURIComponent(`/events/${invite.event.slug}/cohost-invite/${token}`)}`}
							>
								Crear cuenta
							</a>
						</Button>
					</div>

					<p className="text-xs text-center text-muted-foreground">
						Necesitas una cuenta para aceptar esta invitación.
					</p>
				</div>
			</div>
		);
	}

	if (invite.organization.ownerUserId !== userId) {
		return (
			<div className="max-w-md mx-auto mt-20">
				<div className="rounded-lg border bg-card p-8 text-center space-y-4">
					<div className="flex justify-center">
						<div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
							<XCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
						</div>
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-bold">Sin permisos</h1>
						<p className="text-muted-foreground">
							Solo el propietario de{" "}
							<strong>
								{invite.organization.displayName || invite.organization.name}
							</strong>{" "}
							puede aceptar esta invitación.
						</p>
					</div>
					<Button asChild>
						<a href="/">Volver al inicio</a>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto mt-20">
			<div className="rounded-lg border bg-card p-8 space-y-6">
				<div className="text-center space-y-4">
					<div className="flex justify-center">
						{invite.event.eventImageUrl ? (
							<img
								src={invite.event.eventImageUrl}
								alt={invite.event.name}
								className="h-24 w-24 rounded-lg object-cover border-2 border-border"
							/>
						) : (
							<div className="h-24 w-24 rounded-lg bg-muted border-2 border-border flex items-center justify-center">
								<Calendar className="h-12 w-12 text-muted-foreground" />
							</div>
						)}
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-bold">Invitación para co-organizar</h1>
						<p className="text-lg font-semibold">{invite.event.name}</p>
						<p className="text-sm text-muted-foreground">
							{formatEventDateRange(
								invite.event.startDate,
								invite.event.endDate,
							)}
						</p>
						{invite.event.description && (
							<p className="text-sm text-muted-foreground line-clamp-2">
								{invite.event.description}
							</p>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<div className="rounded-lg bg-muted p-4 space-y-2">
						<p className="text-sm font-medium">Como co-organizador podrás:</p>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>✓ Editar la información del evento</li>
							<li>✓ Agregar miembros de tu organización</li>
							<li>✓ Acceder a las analíticas</li>
							<li>✓ Aparecer como co-organizador oficial</li>
						</ul>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<form
							action={async () => {
								"use server";
								const result = await acceptCohostInvite(token);

								if (result.success && result.eventSlug) {
									redirect(`/events/${result.eventSlug}?accepted=true`);
								} else {
									redirect(
										`/events/${invite.event.slug}/cohost-invite/${token}?error=${encodeURIComponent(result.error || "Error desconocido")}`,
									);
								}
							}}
						>
							<AcceptCohostInviteButton type="accept" />
						</form>

						<form
							action={async () => {
								"use server";
								const result = await rejectCohostInvite(token);

								if (result.success) {
									redirect(`/?rejected=true`);
								} else {
									redirect(
										`/events/${invite.event.slug}/cohost-invite/${token}?error=${encodeURIComponent(result.error || "Error desconocido")}`,
									);
								}
							}}
						>
							<AcceptCohostInviteButton type="reject" />
						</form>
					</div>
				</div>

				<p className="text-xs text-center text-muted-foreground">
					Al aceptar, tu organización aparecerá como co-organizador del evento.
				</p>
			</div>
		</div>
	);
}

function CohostInviteSkeleton() {
	return (
		<div className="max-w-md mx-auto mt-20">
			<div className="rounded-lg border bg-card p-8 space-y-6 animate-pulse">
				<div className="text-center space-y-4">
					<div className="flex justify-center">
						<div className="h-24 w-24 rounded-lg bg-muted" />
					</div>
					<div className="space-y-2">
						<div className="h-8 bg-muted rounded w-3/4 mx-auto" />
						<div className="h-6 bg-muted rounded w-2/3 mx-auto" />
						<div className="h-4 bg-muted rounded w-1/2 mx-auto" />
					</div>
				</div>
				<div className="h-32 bg-muted rounded" />
				<div className="grid grid-cols-2 gap-3">
					<div className="h-10 bg-muted rounded" />
					<div className="h-10 bg-muted rounded" />
				</div>
			</div>
		</div>
	);
}

export default async function CohostInvitePage({
	params,
	searchParams,
}: CohostInvitePageProps) {
	const { token } = await params;
	const { error } = await searchParams;

	if (error) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<SiteHeader />
				<main className="flex-1 py-8">
					<div className="max-w-md mx-auto">
						<div className="rounded-lg border bg-card p-8 text-center space-y-4">
							<div className="flex justify-center">
								<div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
									<XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
								</div>
							</div>
							<div className="space-y-2">
								<h1 className="text-2xl font-bold">Error</h1>
								<p className="text-muted-foreground">
									{decodeURIComponent(error)}
								</p>
							</div>
							<Button asChild>
								<a href={`/events/cohost-invite/${token}`}>Intentar de nuevo</a>
							</Button>
						</div>
					</div>
				</main>
				<SiteFooter />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<main className="flex-1 py-8">
				<Suspense fallback={<CohostInviteSkeleton />}>
					<CohostInviteContent token={token} />
				</Suspense>
			</main>
			<SiteFooter />
		</div>
	);
}
