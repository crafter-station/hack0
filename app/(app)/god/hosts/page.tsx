import { auth } from "@clerk/nextjs/server";
import { Clock, Mail, User, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { InviteHostDialog } from "@/components/admin/invite-host-dialog";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUnclaimedHosts, getPendingHostVerifications } from "@/lib/actions/host-claims";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function UnclaimedHostsPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const userPref = await db.query.userPreferences.findFirst({
		where: eq(userPreferences.clerkUserId, userId),
	});

	if (userPref?.role !== "organizer") {
		redirect("/");
	}

	const [hosts, pendingVerifications] = await Promise.all([
		getUnclaimedHosts(),
		getPendingHostVerifications(),
	]);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<main className="flex-1 py-8">
				<div className="container max-w-4xl mx-auto px-4">
					<div className="space-y-8">
						{pendingVerifications.length > 0 && (
							<div className="space-y-4">
								<div>
									<h2 className="text-xl font-bold flex items-center gap-2">
										<Mail className="h-5 w-5" />
										Verificaciones pendientes
									</h2>
									<p className="text-muted-foreground text-sm">
										Usuarios que solicitaron vincular un host y están pendientes de verificar su email.
									</p>
								</div>

								<div className="rounded-lg border bg-card divide-y">
									{pendingVerifications.map((verification) => (
										<div
											key={verification.id}
											className="p-4 flex items-center gap-4"
										>
											<Avatar className="h-12 w-12">
												<AvatarImage src={verification.hostAvatarUrl || undefined} />
												<AvatarFallback>{verification.hostName?.charAt(0) || "?"}</AvatarFallback>
											</Avatar>

											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{verification.hostName || "Host desconocido"}</p>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<span className="truncate">{verification.verificationEmail}</span>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Badge variant="outline" className="gap-1">
													{verification.claimType === "personal" ? (
														<>
															<User className="h-3 w-3" />
															Personal
														</>
													) : (
														<>
															<Users className="h-3 w-3" />
															Comunidad
														</>
													)}
												</Badge>
												<Badge variant="secondary" className="gap-1">
													<Clock className="h-3 w-3" />
													Pendiente
												</Badge>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="space-y-4">
							<div>
								<h2 className="text-xl font-bold">Hosts sin vincular</h2>
								<p className="text-muted-foreground text-sm">
									Hosts de Luma que aún no tienen cuenta en Hack0. Invítalos para que puedan gestionar sus eventos.
								</p>
							</div>

							{hosts.length === 0 ? (
								<div className="rounded-lg border bg-card p-8 text-center">
									<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h2 className="text-lg font-medium">Todos los hosts están vinculados</h2>
									<p className="text-muted-foreground">
										No hay hosts pendientes de vincular.
									</p>
								</div>
							) : (
								<div className="rounded-lg border bg-card divide-y">
									{hosts.map((host) => (
										<div
											key={host.lumaHostApiId}
											className="p-4 flex items-center gap-4"
										>
											<Avatar className="h-12 w-12">
												<AvatarImage src={host.avatarUrl || undefined} alt={host.name} />
												<AvatarFallback>{host.name.charAt(0)}</AvatarFallback>
											</Avatar>

											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{host.name}</p>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<span>{host.eventCount} eventos</span>
													{host.email && (
														<>
															<span>•</span>
															<span className="truncate">{host.email}</span>
														</>
													)}
												</div>
											</div>

											<div className="flex items-center gap-2">
												{host.pendingInviteEmail ? (
													<Badge variant="outline" className="gap-1">
														<Clock className="h-3 w-3" />
														Invitación pendiente
													</Badge>
												) : (
													<InviteHostDialog
														lumaHostApiId={host.lumaHostApiId}
														hostName={host.name}
														hostAvatarUrl={host.avatarUrl}
														existingEmail={host.email}
													/>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
