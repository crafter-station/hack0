"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Check,
	ChevronDown,
	Copy,
	Crown,
	Link2,
	Mail,
	MoreHorizontal,
	Plus,
	Search,
	Shield,
	Trash2,
	UserMinus,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	bulkRemoveMembers,
	bulkUpdateMemberRoles,
	createCommunityInvite,
	removeCommunityMember,
	revokeInvite,
	sendEmailInvite,
	updateMemberRole,
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

type RoleFilter = "all" | "owner" | "admin" | "member" | "follower";
type SortOption = "newest" | "oldest" | "name";

export function MembersManagement({
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
	const [members, setMembers] = useState(initialMembers);
	const [invites, setInvites] = useState(initialInvites);
	const [users, setUsers] = useState(initialUsers);
	const [loading, setLoading] = useState(false);

	const [emailInputs, setEmailInputs] = useState([
		{ email: "", role: "member" as const },
	]);
	const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false);
	const [linkRole, setLinkRole] = useState<"admin" | "member" | "follower">(
		"member",
	);
	const [generatedLink, setGeneratedLink] = useState<string | null>(null);
	const [linkCopied, setLinkCopied] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
	const [sortOption, setSortOption] = useState<SortOption>("newest");

	const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
		new Set(),
	);
	const [showManageDialog, setShowManageDialog] = useState(false);
	const [memberToManage, setMemberToManage] = useState<{
		id: string;
		userId: string;
		role: string;
	} | null>(null);

	const canManage = isOwner || isAdmin || isGodMode;

	const addEmailInput = () => {
		setEmailInputs([...emailInputs, { email: "", role: "member" }]);
	};

	const removeEmailInput = (index: number) => {
		if (emailInputs.length > 1) {
			setEmailInputs(emailInputs.filter((_, i) => i !== index));
		}
	};

	const updateEmailInput = (
		index: number,
		field: "email" | "role",
		value: string,
	) => {
		const newInputs = [...emailInputs];
		newInputs[index] = { ...newInputs[index], [field]: value };
		setEmailInputs(newInputs);
	};

	const handleSendEmailInvites = async () => {
		const validEmails = emailInputs.filter((input) => input.email.trim());
		if (validEmails.length === 0) {
			toast.error("Ingresa al menos un email");
			return;
		}

		setLoading(true);
		const emailsByRole = validEmails.reduce(
			(acc, input) => {
				const role = input.role as "admin" | "member" | "follower";
				if (!acc[role]) acc[role] = [];
				acc[role].push(input.email.trim());
				return acc;
			},
			{} as Record<string, string[]>,
		);

		let successCount = 0;
		let errorCount = 0;

		for (const [role, emails] of Object.entries(emailsByRole)) {
			const result = await sendEmailInvite(
				communityId,
				emails,
				role as "admin" | "member" | "follower",
			);
			if (result.success && result.results) {
				successCount += result.results.filter((r) => r.success).length;
				errorCount += result.results.filter((r) => !r.success).length;
			}
		}

		setLoading(false);

		if (successCount > 0) {
			toast.success(`${successCount} invitación(es) enviada(s)`);
			setEmailInputs([{ email: "", role: "member" }]);
		}
		if (errorCount > 0) {
			toast.error(`${errorCount} invitación(es) fallaron`);
		}
	};

	const handleGenerateLink = async () => {
		setLoading(true);
		const result = await createCommunityInvite(communityId, linkRole);
		setLoading(false);

		if (result.success && result.invite) {
			const url = `${window.location.origin}/invite/${result.invite.inviteToken}`;
			setGeneratedLink(url);
			setInvites([...invites, result.invite]);
		} else {
			toast.error("Error al generar link");
		}
	};

	const handleCopyLink = () => {
		if (generatedLink) {
			navigator.clipboard.writeText(generatedLink);
			setLinkCopied(true);
			toast.success("Link copiado");
			setTimeout(() => setLinkCopied(false), 2000);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		const originalMembers = members;
		const originalUsers = users;
		const memberToRemove = members.find((m) => m.id === memberId);

		setMembers(members.filter((m) => m.id !== memberId));
		if (memberToRemove) {
			setUsers(users.filter((u) => u.id !== memberToRemove.userId));
		}
		setSelectedMembers((prev) => {
			const next = new Set(prev);
			next.delete(memberId);
			return next;
		});

		const result = await removeCommunityMember(memberId);

		if (!result.success) {
			setMembers(originalMembers);
			setUsers(originalUsers);
			toast.error(result.error || "Error al remover");
		} else {
			toast.success("Miembro removido");
		}
	};

	const handleBulkRemove = async () => {
		if (selectedMembers.size === 0) return;
		if (!confirm(`¿Remover ${selectedMembers.size} miembro(s)?`)) return;

		setLoading(true);
		const result = await bulkRemoveMembers(Array.from(selectedMembers));
		setLoading(false);

		if (result.success) {
			setMembers(members.filter((m) => !selectedMembers.has(m.id)));
			const removedUserIds = members
				.filter((m) => selectedMembers.has(m.id))
				.map((m) => m.userId);
			setUsers(users.filter((u) => !removedUserIds.includes(u.id)));
			setSelectedMembers(new Set());
			toast.success(`${result.removedCount} miembro(s) removido(s)`);
		} else {
			toast.error(result.error || "Error al remover");
		}
	};

	const handleUpdateRole = async (
		memberId: string,
		newRole: "admin" | "member" | "follower",
	) => {
		const result = await updateMemberRole(memberId, newRole);

		if (result.success) {
			setMembers(
				members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
			);
			toast.success("Rol actualizado");
			setShowManageDialog(false);
			setMemberToManage(null);
		} else {
			toast.error(result.error || "Error al actualizar");
		}
	};

	const handleBulkUpdateRole = async (
		newRole: "admin" | "member" | "follower",
	) => {
		if (selectedMembers.size === 0) return;

		setLoading(true);
		const result = await bulkUpdateMemberRoles(
			Array.from(selectedMembers),
			newRole,
		);
		setLoading(false);

		if (result.success) {
			setMembers(
				members.map((m) =>
					selectedMembers.has(m.id) ? { ...m, role: newRole } : m,
				),
			);
			setSelectedMembers(new Set());
			toast.success(`${result.updatedCount} rol(es) actualizado(s)`);
		} else {
			toast.error(result.error || "Error al actualizar");
		}
	};

	const handleRevokeInvite = async (inviteId: string) => {
		const originalInvites = invites;
		setInvites(invites.filter((i) => i.id !== inviteId));

		const result = await revokeInvite(inviteId);

		if (!result.success) {
			setInvites(originalInvites);
			toast.error("Error al revocar");
		} else {
			toast.success("Invitación revocada");
		}
	};

	const toggleSelectAll = () => {
		if (selectedMembers.size === filteredUsers.length) {
			setSelectedMembers(new Set());
		} else {
			const selectableIds = filteredUsers
				.map((u) => members.find((m) => m.userId === u.id))
				.filter((m) => m && m.role !== "owner" && m.userId !== currentUserId)
				.map((m) => m!.id);
			setSelectedMembers(new Set(selectableIds));
		}
	};

	const toggleSelectMember = (memberId: string) => {
		setSelectedMembers((prev) => {
			const next = new Set(prev);
			if (next.has(memberId)) {
				next.delete(memberId);
			} else {
				next.add(memberId);
			}
			return next;
		});
	};

	const filteredUsers = useMemo(() => {
		const result = users.filter((user) => {
			const member = members.find((m) => m.userId === user.id);
			const userIsOwner = user.id === ownerUserId;
			const role = userIsOwner ? "owner" : member?.role;

			if (roleFilter !== "all" && role !== roleFilter) return false;

			if (searchQuery) {
				const name =
					`${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
				const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() || "";
				const query = searchQuery.toLowerCase();
				if (!name.includes(query) && !email.includes(query)) return false;
			}

			return true;
		});

		result.sort((a, b) => {
			if (sortOption === "name") {
				const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
				const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
				return nameA.localeCompare(nameB);
			}
			const memberA = members.find((m) => m.userId === a.id);
			const memberB = members.find((m) => m.userId === b.id);
			const dateA = memberA?.joinedAt
				? new Date(memberA.joinedAt).getTime()
				: 0;
			const dateB = memberB?.joinedAt
				? new Date(memberB.joinedAt).getTime()
				: 0;
			return sortOption === "newest" ? dateB - dateA : dateA - dateB;
		});

		return result;
	}, [users, members, ownerUserId, roleFilter, searchQuery, sortOption]);

	const activeInvites = invites.filter((i) => i.isActive);
	const emailInvites = activeInvites.filter(
		(i) => i.inviteType === "email" || i.email,
	);
	const linkInvites = activeInvites.filter(
		(i) => i.inviteType === "link" || (!i.email && !i.inviteType),
	);

	return (
		<div className="space-y-6">
			{/* Invite Section */}
			<Card className="gap-0">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 py-5 px-6">
					<div className="space-y-1">
						<h3 className="font-medium">Invitar nuevos miembros por email</h3>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="gap-2"
						onClick={() => setShowInviteLinkDialog(true)}
					>
						<Link2 className="h-4 w-4" />
						Invite Link
					</Button>
				</CardHeader>
				<CardContent className="space-y-4 px-6 pb-6">
					{emailInputs.map((input, index) => (
						<div key={index} className="flex items-center gap-4">
							<div className="flex-1">
								<Input
									type="email"
									placeholder="jane@example.com"
									value={input.email}
									onChange={(e) =>
										updateEmailInput(index, "email", e.target.value)
									}
								/>
							</div>
							<Select
								value={input.role}
								onValueChange={(value) =>
									updateEmailInput(index, "role", value)
								}
							>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="follower">Seguidor</SelectItem>
									<SelectItem value="member">Miembro</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
							{emailInputs.length > 1 && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeEmailInput(index)}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}

					<div className="flex items-center justify-between pt-4 border-t">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2"
							onClick={addEmailInput}
						>
							<Plus className="h-4 w-4" />
							Agregar más
						</Button>
						<Button
							onClick={handleSendEmailInvites}
							disabled={loading}
							className="gap-2"
						>
							<Mail className="h-4 w-4" />
							Invitar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Invite Link Dialog */}
			<Dialog
				open={showInviteLinkDialog}
				onOpenChange={(open) => {
					setShowInviteLinkDialog(open);
					if (!open) {
						setGeneratedLink(null);
						setLinkCopied(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Generar link de invitación</DialogTitle>
						<DialogDescription>
							Crea un link compartible para invitar personas a tu comunidad.
						</DialogDescription>
					</DialogHeader>
					{!generatedLink ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">Rol a otorgar</label>
								<Select
									value={linkRole}
									onValueChange={(v) => setLinkRole(v as any)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="follower">Seguidor</SelectItem>
										<SelectItem value="member">Miembro</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleGenerateLink}
								disabled={loading}
								className="w-full"
							>
								Generar link
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
								{generatedLink}
							</div>
							<Button
								onClick={handleCopyLink}
								variant="outline"
								className="w-full gap-2"
							>
								{linkCopied ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
								{linkCopied ? "Copiado" : "Copiar link"}
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Tabs */}
			<Tabs defaultValue="members">
				<TabsList>
					<TabsTrigger value="members" className="gap-2">
						<Users className="h-4 w-4" />
						Miembros ({users.length})
					</TabsTrigger>
					<TabsTrigger value="invitations" className="gap-2">
						<Mail className="h-4 w-4" />
						Invitaciones ({activeInvites.length})
					</TabsTrigger>
				</TabsList>

				{/* Members Tab */}
				<TabsContent value="members" className="space-y-4">
					{/* Filters */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
						<div className="relative flex-1 w-full sm:max-w-xs">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select
							value={roleFilter}
							onValueChange={(v) => setRoleFilter(v as RoleFilter)}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Todos los roles" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los roles</SelectItem>
								<SelectItem value="owner">Owner</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
								<SelectItem value="member">Miembro</SelectItem>
								<SelectItem value="follower">Seguidor</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={sortOption}
							onValueChange={(v) => setSortOption(v as SortOption)}
						>
							<SelectTrigger className="w-36">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Más reciente</SelectItem>
								<SelectItem value="oldest">Más antiguo</SelectItem>
								<SelectItem value="name">Nombre</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Members List */}
					<div className="rounded-lg border">
						{/* Select All Header */}
						<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
							<div className="flex items-center gap-3">
								<Checkbox
									checked={
										selectedMembers.size > 0 &&
										selectedMembers.size ===
											filteredUsers.filter((u) => {
												const m = members.find((m) => m.userId === u.id);
												return (
													m && m.role !== "owner" && m.userId !== currentUserId
												);
											}).length
									}
									onCheckedChange={toggleSelectAll}
								/>
								<span className="text-sm text-muted-foreground">
									Seleccionar todo ({filteredUsers.length})
								</span>
							</div>
							{selectedMembers.size > 0 && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-2">
											Acciones ({selectedMembers.size})
											<ChevronDown className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => handleBulkUpdateRole("admin")}
										>
											Cambiar a Admin
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleBulkUpdateRole("member")}
										>
											Cambiar a Miembro
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleBulkUpdateRole("follower")}
										>
											Cambiar a Seguidor
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleBulkRemove}
											className="text-red-600"
										>
											<UserMinus className="h-4 w-4 mr-2" />
											Remover seleccionados
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>

						{/* Member Rows */}
						<div className="divide-y">
							{filteredUsers.map((user) => {
								const userIsOwner = user.id === ownerUserId;
								const member = members.find((m) => m.userId === user.id);
								const canSelect =
									canManage &&
									!userIsOwner &&
									user.id !== currentUserId &&
									member;
								const canRemove = canSelect;

								return (
									<div
										key={user.id}
										className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30"
									>
										<div className="w-6">
											{canSelect && member && (
												<Checkbox
													checked={selectedMembers.has(member.id)}
													onCheckedChange={() => toggleSelectMember(member.id)}
												/>
											)}
										</div>
										<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
											{user.imageUrl ? (
												<img
													src={user.imageUrl}
													alt=""
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
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">
												{user.firstName && user.lastName
													? `${user.firstName} ${user.lastName}`
													: user.firstName ||
														user.emailAddresses[0]?.emailAddress ||
														"Unknown"}
											</p>
											<p className="text-sm text-muted-foreground truncate">
												{user.emailAddresses[0]?.emailAddress}
											</p>
										</div>
										<div className="flex items-center gap-2">
											{userIsOwner ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
													<Crown className="h-3 w-3" />
													Owner
												</span>
											) : member?.role === "admin" ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
													<Shield className="h-3 w-3" />
													Admin
												</span>
											) : (
												<span className="text-sm text-muted-foreground">
													{member?.role
														? COMMUNITY_ROLE_LABELS[member.role]
														: ""}
												</span>
											)}
										</div>
										{canManage && !userIsOwner && member && (
											<>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setMemberToManage({
															id: member.id,
															userId: user.id,
															role: member.role || "member",
														});
														setShowManageDialog(true);
													}}
												>
													Manage Access
												</Button>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														{canRemove && (
															<DropdownMenuItem
																onClick={() => handleRemoveMember(member.id)}
																className="text-red-600"
															>
																<Trash2 className="h-4 w-4 mr-2" />
																Remover
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</>
										)}
									</div>
								);
							})}
							{filteredUsers.length === 0 && (
								<div className="px-4 py-8 text-center text-muted-foreground">
									No se encontraron miembros
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				{/* Invitations Tab */}
				<TabsContent value="invitations" className="space-y-4">
					{activeInvites.length === 0 ? (
						<div className="rounded-lg border border-dashed p-8 text-center">
							<p className="text-muted-foreground">
								No hay invitaciones pendientes
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{emailInvites.length > 0 && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium text-muted-foreground">
										Por email
									</h4>
									<div className="rounded-lg border divide-y">
										{emailInvites.map((invite) => (
											<div
												key={invite.id}
												className="flex items-center justify-between px-4 py-3"
											>
												<div className="space-y-1">
													<p className="font-medium">{invite.email}</p>
													<p className="text-sm text-muted-foreground">
														{invite.roleGranted
															? COMMUNITY_ROLE_LABELS[invite.roleGranted]
															: "Miembro"}{" "}
														•{" "}
														{invite.createdAt
															? formatDistanceToNow(
																	new Date(invite.createdAt),
																	{ addSuffix: true, locale: es },
																)
															: ""}
													</p>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRevokeInvite(invite.id)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								</div>
							)}

							{linkInvites.length > 0 && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium text-muted-foreground">
										Links de invitación
									</h4>
									<div className="rounded-lg border divide-y">
										{linkInvites.map((invite) => (
											<div
												key={invite.id}
												className="flex items-center justify-between px-4 py-3"
											>
												<div className="space-y-1">
													<p className="font-medium">
														{invite.roleGranted
															? COMMUNITY_ROLE_LABELS[invite.roleGranted]
															: "Miembro"}
													</p>
													<p className="text-sm text-muted-foreground">
														{invite.usedCount || 0} uso
														{(invite.usedCount || 0) !== 1 ? "s" : ""} •{" "}
														{invite.createdAt
															? formatDistanceToNow(
																	new Date(invite.createdAt),
																	{ addSuffix: true, locale: es },
																)
															: ""}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															navigator.clipboard.writeText(
																`${window.location.origin}/invite/${invite.inviteToken}`,
															);
															toast.success("Link copiado");
														}}
													>
														<Copy className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleRevokeInvite(invite.id)}
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
				</TabsContent>
			</Tabs>

			{/* Manage Access Dialog */}
			<Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Gestionar acceso</DialogTitle>
						<DialogDescription>
							Cambia el rol de este miembro en la comunidad.
						</DialogDescription>
					</DialogHeader>
					{memberToManage && (
						<div className="space-y-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">Nuevo rol</label>
								<Select
									value={memberToManage.role}
									onValueChange={(v) =>
										setMemberToManage({ ...memberToManage, role: v })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="follower">Seguidor</SelectItem>
										<SelectItem value="member">Miembro</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setShowManageDialog(false)}
								>
									Cancelar
								</Button>
								<Button
									onClick={() =>
										handleUpdateRole(
											memberToManage.id,
											memberToManage.role as "admin" | "member" | "follower",
										)
									}
								>
									Guardar cambios
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
