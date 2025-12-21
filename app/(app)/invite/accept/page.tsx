import { auth, clerkClient } from "@clerk/nextjs/server";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { verifyHostInvite } from "@/lib/actions/host-claims";

export default async function AcceptInvitePage() {
	const { userId } = await auth();

	if (!userId) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<SiteHeader />
				<main className="flex-1 py-8">
					<div className="max-w-md mx-auto mt-20">
						<div className="rounded-lg border bg-card p-8 text-center space-y-6">
							<div className="flex justify-center">
								<div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
									<Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
								</div>
							</div>
							<div className="space-y-2">
								<h1 className="text-2xl font-bold">¡Bienvenido a Hack0!</h1>
								<p className="text-muted-foreground">
									Has sido invitado como host. Crea tu cuenta para vincular tu perfil y gestionar tus eventos.
								</p>
							</div>
							<div className="space-y-3">
								<Button asChild className="w-full">
									<a href={`/sign-up?redirect_url=${encodeURIComponent("/invite/accept")}`}>
										Crear cuenta
									</a>
								</Button>
								<Button asChild variant="outline" className="w-full">
									<a href={`/sign-in?redirect_url=${encodeURIComponent("/invite/accept")}`}>
										Ya tengo cuenta
									</a>
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Tu email ya está verificado gracias a la invitación.
							</p>
						</div>
					</div>
				</main>
				<SiteFooter />
			</div>
		);
	}

	const clerk = await clerkClient();
	const user = await clerk.users.getUser(userId);

	const lumaHostApiId = user.publicMetadata?.lumaHostApiId as string | undefined;
	const isHostInvite = user.publicMetadata?.isHostInvite as boolean | undefined;

	if (!lumaHostApiId || !isHostInvite) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<SiteHeader />
				<main className="flex-1 py-8">
					<div className="max-w-md mx-auto mt-20">
						<div className="rounded-lg border bg-card p-8 text-center space-y-4">
							<div className="flex justify-center">
								<div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
									<Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-500" />
								</div>
							</div>
							<div className="space-y-2">
								<h1 className="text-2xl font-bold">Sin invitación pendiente</h1>
								<p className="text-muted-foreground">
									No encontramos una invitación de host asociada a tu cuenta. Si recibiste un email de invitación, intenta hacer clic en el enlace del email nuevamente.
								</p>
							</div>
							<Button asChild>
								<a href="/">Ir al inicio</a>
							</Button>
						</div>
					</div>
				</main>
				<SiteFooter />
			</div>
		);
	}

	const result = await verifyHostInvite(userId, lumaHostApiId);

	if (result.success && result.organizationSlug) {
		redirect(`/c/${result.organizationSlug}?host_verified=true`);
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<main className="flex-1 py-8">
				<div className="max-w-md mx-auto mt-20">
					<div className="rounded-lg border bg-card p-8 text-center space-y-4">
						<div className="flex justify-center">
							{result.success ? (
								<div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
									<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
								</div>
							) : (
								<div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
									<XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
								</div>
							)}
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-bold">
								{result.success ? "¡Cuenta vinculada!" : "Error"}
							</h1>
							<p className="text-muted-foreground">
								{result.message || result.error}
							</p>
						</div>
						<Button asChild>
							<a href="/">Ir al inicio</a>
						</Button>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
