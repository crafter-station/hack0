"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Check,
	Copy,
	Crown,
	Shield,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
	createCommunityInvite,
	removeCommunityMember,
	revokeInvite,
} from "@/lib/actions/community-members";
import type { CommunityInvite, CommunityMember } from "@/lib/db/schema";
import { COMMUNITY_ROLE_LABELS } from "@/lib/db/schema";

interface User {
	id: string;
	firstName: string | null;
	lastName: string | null;
	emailAddresses: Array<{ emailAddress: string }>;
	imageUrl: string | null;
}

interface MembersManagementProps {
	communitySlug: string;
	communityId: string;
	ownerUserId: string;
	members: CommunityMember[];
	invites: CommunityInvite[];
	users: User[];
	currentUserId: string | null;
	isOwner: boolean;
	isAdmin: boolean;
	isGodMode: boolean;
}

export function MembersManagement({
	communitySlug,
	communityId,
	ownerUserId,
	members: initialMembers,
	invites: initialInvites,
	users: initialUsers,
	currentUserId,
	isOwner,
	isAdmin,
	isGodMode,
}: MembersManagementProps) {
	const [showInviteDialog, setShowInviteDialog] = useState(false);
	const [selectedRole, setSelectedRole] = useState<
		"admin" | "member" | "follower"
	>("member");
	const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(false);
	const [members, setMembers] = useState(initialMembers);
	const [invites, setInvites] = useState(initialInvites);
	const [users, setUsers] = useState(initialUsers);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleCreateInvite = async () => {
		setLoading(true);
		const result = await createCommunityInvite(communityId, selectedRole);

		if (result.success && result.invite) {
			const inviteUrl = `${window.location.origin}/invite/${result.invite.inviteToken}`;
			setGeneratedInvite(inviteUrl);
		}
		setLoading(false);
	};

	const handleCopyInvite = () => {
		if (generatedInvite) {
			try {
				navigator.clipboard.writeText(generatedInvite);
				setCopied(true);
				toast.success("Información copiada");
				setTimeout(() => setCopied(false), 2000);
			} catch (_error) {
				toast.error("Error al copiar");
			}
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		if (!confirm("¿Estás seguro de remover este miembro?")) return;

		const originalMembers = members;
		const originalUsers = users;
		const memberToRemove = members.find((m) => m.id === memberId);

		// Optimistic update
		setMembers(members.filter((m) => m.id !== memberId));
		if (memberToRemove) {
			setUsers(users.filter((u) => u.id !== memberToRemove.userId));
		}

		setLoading(true);
		const result = await removeCommunityMember(memberId);
		setLoading(false);

		if (!result.success) {
			// Rollback on error
			setMembers(originalMembers);
			setUsers(originalUsers);
			toast.error("Error al remover miembro");
		} else {
			toast.success("Miembro eliminado");
		}
	};

	const handleRevokeInvite = async (inviteId: string) => {
		if (!confirm("¿Revocar esta invitación?")) return;

		const originalInvites = invites;

		// Optimistic update
		setInvites(invites.filter((i) => i.id !== inviteId));

		setLoading(true);
		const result = await revokeInvite(inviteId);
		setLoading(false);

		if (!result.success) {
			// Rollback on error
			setInvites(originalInvites);
			toast.error("Error al revocar invitación");
		} else {
			toast.success("Invitación revocada");
		}
	};

	const canManage = isOwner || isAdmin || isGodMode;

	const InviteFormContent = () => (
		<>
			{!generatedInvite ? (
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Rol a otorgar</label>
						<select
							value={selectedRole}
							onChange={(e) => setSelectedRole(e.target.value as any)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="follower">{COMMUNITY_ROLE_LABELS.follower}</option>
							<option value="member">{COMMUNITY_ROLE_LABELS.member}</option>
							<option value="admin">{COMMUNITY_ROLE_LABELS.admin}</option>
						</select>
					</div>

					<Button
						onClick={handleCreateInvite}
						disabled={loading}
						className="w-full"
					>
						Generar link de invitación
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					<div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
						{generatedInvite}
					</div>
					<Button
						onClick={handleCopyInvite}
						variant="outline"
						className="w-full gap-2"
					>
						{copied ? (
							<>
								<Check className="h-4 w-4" />
								Copiado
							</>
						) : (
							<>
								<Copy className="h-4 w-4" />
								Copiar link
							</>
						)}
					</Button>
				</div>
			)}
		</>
	);

	const activeInvites = invites.filter((i) => i.isActive);
	const isEmpty = users.length === 0 && activeInvites.length === 0;

	return (
		<div className="space-y-6">
			{/* Responsive Dialog/Drawer */}
			{isDesktop ? (
				<Dialog
					open={showInviteDialog}
					onOpenChange={(open) => {
						setShowInviteDialog(open);
						if (!open) setGeneratedInvite(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Invitar miembros</DialogTitle>
							<DialogDescription>
								Genera un link de invitación para agregar personas a tu
								comunidad.
							</DialogDescription>
						</DialogHeader>
						<InviteFormContent />
					</DialogContent>
				</Dialog>
			) : (
				<Drawer
					open={showInviteDialog}
					onOpenChange={(open) => {
						setShowInviteDialog(open);
						if (!open) setGeneratedInvite(null);
					}}
				>
					<DrawerContent>
						<DrawerHeader className="text-left">
							<DrawerTitle>Invitar miembros</DrawerTitle>
							<DrawerDescription>
								Genera un link de invitación para agregar personas a tu
								comunidad.
							</DrawerDescription>
						</DrawerHeader>
						<div className="px-4 pb-4">
							<InviteFormContent />
						</div>
					</DrawerContent>
				</Drawer>
			)}

			{/* Consolidated Empty State - No members AND no invites */}
			{isEmpty && canManage ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Users className="h-6 w-6" />
						</EmptyMedia>
						<EmptyTitle>Invita a tu equipo</EmptyTitle>
						<EmptyDescription>
							Esta comunidad aún no tiene miembros. Crea una invitación para
							comenzar a construir tu equipo.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button onClick={() => setShowInviteDialog(true)} className="gap-2">
							<UserPlus className="h-4 w-4" />
							Invitar miembros
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<>
					{/* Members Section */}
					{users.length > 0 && (
						<div className="space-y-4">
							{canManage && (
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-semibold">
										Miembros ({users.length})
									</h3>
									<Button
										onClick={() => setShowInviteDialog(true)}
										variant="outline"
										size="sm"
										className="gap-2"
									>
										<UserPlus className="h-4 w-4" />
										Invitar
									</Button>
								</div>
							)}
							<div className="rounded-lg border border-border overflow-hidden">
								<div className="divide-y divide-border">
									{users.map((user) => {
										const userIsOwner = user.id === ownerUserId;
										const member = members.find((m) => m.userId === user.id);
										const canRemove =
											canManage && !userIsOwner && user.id !== currentUserId;

										return (
											<div
												key={user.id}
												className="px-5 py-4 flex items-center justify-between gap-4"
											>
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
														{user.imageUrl ? (
															<img
																src={user.imageUrl}
																alt={user.firstName || "User"}
																className="h-full w-full object-cover"
															/>
														) : (
															<span className="text-sm font-medium text-muted-foreground">
																{(
																	user.firstName?.[0] ||
																	user.emailAddresses[0]?.emailAddress[0] ||
																	"?"
																).toUpperCase()}
															</span>
														)}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<p className="font-medium truncate">
																{user.firstName && user.lastName
																	? `${user.firstName} ${user.lastName}`
																	: user.firstName ||
																		user.emailAddresses[0]?.emailAddress ||
																		"Unknown"}
															</p>
															{userIsOwner && (
																<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 shrink-0">
																	<Crown className="h-3 w-3" />
																	Owner
																</span>
															)}
															{member?.role === "admin" && !userIsOwner && (
																<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500 shrink-0">
																	<Shield className="h-3 w-3" />
																	Admin
																</span>
															)}
															{member?.role === "member" && (
																<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
																	Miembro
																</span>
															)}
															{member?.role === "follower" && (
																<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
																	Seguidor
																</span>
															)}
														</div>
														<p className="text-sm text-muted-foreground truncate">
															{user.emailAddresses[0]?.emailAddress}
														</p>
													</div>
												</div>

												{canRemove && member && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleRemoveMember(member.id)}
														disabled={loading}
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}

					{/* Active Invites Section - only show if there are invites OR members exist */}
					{canManage && (users.length > 0 || activeInvites.length > 0) && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold">
									Invitaciones activas{" "}
									{activeInvites.length > 0 && `(${activeInvites.length})`}
								</h3>
								{activeInvites.length > 0 && (
									<Button
										onClick={() => setShowInviteDialog(true)}
										variant="outline"
										size="sm"
										className="gap-2"
									>
										<UserPlus className="h-4 w-4" />
										Nueva
									</Button>
								)}
							</div>
							{activeInvites.length === 0 ? (
								<div className="rounded-lg border border-dashed border-border p-8 text-center">
									<p className="text-sm text-muted-foreground">
										No hay invitaciones activas.{" "}
										<button
											onClick={() => setShowInviteDialog(true)}
											className="text-foreground underline underline-offset-4 hover:text-foreground/80"
										>
											Crear una invitación
										</button>
									</p>
								</div>
							) : (
								<div className="rounded-lg border border-border overflow-hidden">
									<div className="divide-y divide-border">
										{activeInvites.map((invite) => (
											<div
												key={invite.id}
												className="px-5 py-4 flex items-center justify-between gap-4"
											>
												<div className="space-y-1 flex-1">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium">
															{invite.roleGranted
																? COMMUNITY_ROLE_LABELS[invite.roleGranted]
																: "Miembro"}
														</span>
														<span className="text-xs text-muted-foreground">
															• {invite.usedCount || 0} uso
															{(invite.usedCount || 0) !== 1 ? "s" : ""}
														</span>
													</div>
													<p className="text-xs text-muted-foreground">
														Creada{" "}
														{invite.createdAt
															? formatDistanceToNow(
																	new Date(invite.createdAt),
																	{ addSuffix: true, locale: es },
																)
															: "hace poco"}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const url = `${window.location.origin}/invite/${invite.inviteToken}`;
															navigator.clipboard.writeText(url);
														}}
													>
														<Copy className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleRevokeInvite(invite.id)}
														disabled={loading}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
