"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createCommunityInvite,
	deactivateInvite,
	getCommunityInvites,
} from "@/lib/actions/communities";
import type { CommunityInvite } from "@/lib/db/schema";

interface InviteManagerProps {
	communityId: string;
}

export function InviteManager({ communityId }: InviteManagerProps) {
	const [invites, setInvites] = useState<CommunityInvite[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [copiedToken, setCopiedToken] = useState<string | null>(null);

	const [roleGranted, setRoleGranted] = useState<
		"follower" | "member" | "admin"
	>("follower");
	const [maxUses, setMaxUses] = useState<string>("");
	const [expiresInDays, setExpiresInDays] = useState<string>("30");

	useEffect(() => {
		loadInvites();
	}, [loadInvites]);

	async function loadInvites() {
		setLoading(true);
		const result = await getCommunityInvites(communityId);
		if (result.success && result.invites) {
			setInvites(result.invites);
		}
		setLoading(false);
	}

	async function handleCreateInvite() {
		setCreating(true);
		const result = await createCommunityInvite({
			communityId,
			roleGranted,
			maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
			expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : undefined,
		});

		if (result.success) {
			await loadInvites();
			setMaxUses("");
			setExpiresInDays("30");
		}
		setCreating(false);
	}

	async function handleDeactivate(inviteId: string) {
		await deactivateInvite(inviteId);
		await loadInvites();
	}

	function copyInviteLink(token: string) {
		const url = `${window.location.origin}/invite/${token}`;
		try {
			navigator.clipboard.writeText(url);
			setCopiedToken(token);
			toast.success("Información copiada");
			setTimeout(() => setCopiedToken(null), 2000);
		} catch (_error) {
			toast.error("Error al copiar");
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Crear nueva invitación</CardTitle>
					<CardDescription>
						Genera un enlace para invitar usuarios a unirse a tu comunidad
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<div>
							<Label>Rol otorgado</Label>
							<Select
								value={roleGranted}
								onValueChange={(v: any) => setRoleGranted(v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="follower">Seguidor</SelectItem>
									<SelectItem value="member">Miembro</SelectItem>
									<SelectItem value="admin">Administrador</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Máximo de usos (opcional)</Label>
							<Input
								type="number"
								placeholder="Ilimitado"
								value={maxUses}
								onChange={(e) => setMaxUses(e.target.value)}
								min="1"
							/>
						</div>

						<div>
							<Label>Expira en (días)</Label>
							<Input
								type="number"
								placeholder="30"
								value={expiresInDays}
								onChange={(e) => setExpiresInDays(e.target.value)}
								min="1"
							/>
						</div>
					</div>

					<Button
						onClick={handleCreateInvite}
						disabled={creating}
						className="w-full"
					>
						<Plus className="h-4 w-4 mr-2" />
						{creating ? "Creando..." : "Crear invitación"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Invitaciones activas</CardTitle>
					<CardDescription>
						Administra los enlaces de invitación existentes
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8 text-muted-foreground">
							Cargando...
						</div>
					) : invites.filter((i) => i.isActive).length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No hay invitaciones activas
						</div>
					) : (
						<div className="space-y-3">
							{invites
								.filter((i) => i.isActive)
								.map((invite) => {
									const _url = `${window.location.origin}/invite/${invite.inviteToken}`;
									const isExpired =
										invite.expiresAt && new Date() > new Date(invite.expiresAt);
									const isMaxedOut =
										!!(invite.maxUses && (invite.usedCount ?? 0) >= invite.maxUses);

									return (
										<div
											key={invite.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="text-sm font-medium">
														{invite.roleGranted === "follower"
															? "Seguidor"
															: invite.roleGranted === "member"
																? "Miembro"
																: "Admin"}
													</span>
													{isExpired && (
														<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
															Expirado
														</span>
													)}
													{isMaxedOut && (
														<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
															Límite alcanzado
														</span>
													)}
												</div>
												<div className="text-xs text-muted-foreground space-y-0.5">
													<div>
														Usado: {invite.usedCount}
														{invite.maxUses
															? ` / ${invite.maxUses}`
															: " (ilimitado)"}
													</div>
													{invite.expiresAt && (
														<div>
															Expira:{" "}
															{format(new Date(invite.expiresAt), "PPP", {
																locale: es,
															})}
														</div>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => copyInviteLink(invite.inviteToken)}
													disabled={isExpired || isMaxedOut}
												>
													{copiedToken === invite.inviteToken ? (
														<>
															<Check className="h-4 w-4 mr-1" />
															Copiado
														</>
													) : (
														<>
															<Copy className="h-4 w-4 mr-1" />
															Copiar
														</>
													)}
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeactivate(invite.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									);
								})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
