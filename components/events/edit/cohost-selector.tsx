"use client";

import {
	Building2,
	Check,
	Clock,
	Loader2,
	Plus,
	Search,
	User,
	Users,
	X,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inviteCohost, removeCohostInvite } from "@/lib/actions/cohost-invites";
import { getCommunityMembersWithClerkInfo } from "@/lib/actions/community-members";
import { getAllUserOrganizations } from "@/lib/actions/organizations";

interface Cohost {
	id: string;
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	organizationLogoUrl?: string | null;
	status: "pending" | "approved" | "rejected";
	isPrimary: boolean;
}

interface CohostSelectorProps {
	eventId: string;
	organizationId: string;
	currentUserId: string;
	existingCohosts: Cohost[];
}

interface SelectableItem {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	logoUrl: string | null;
	type: "member" | "personal-org" | "organization";
	email?: string | null;
	priority: number;
}

const STATUS_CONFIG = {
	approved: {
		label: "Aceptado",
		icon: Check,
		className: "text-emerald-600",
	},
	pending: {
		label: "Pendiente",
		icon: Clock,
		className: "text-amber-600",
	},
	rejected: {
		label: "Rechazado",
		icon: XCircle,
		className: "text-red-600",
	},
};

export function CohostSelector({
	eventId,
	organizationId,
	currentUserId,
	existingCohosts,
}: CohostSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [cohosts, setCohosts] = useState<Cohost[]>(existingCohosts);
	const [selectableItems, setSelectableItems] = useState<SelectableItem[]>([]);
	const [loadingItems, setLoadingItems] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		const loadItems = async () => {
			setLoadingItems(true);
			try {
				const [members, userOrgs] = await Promise.all([
					getCommunityMembersWithClerkInfo(organizationId),
					getAllUserOrganizations(),
				]);

				const items: SelectableItem[] = [];

				// 1. Members from current org (priority 1)
				members
					.filter((member) => member.userId !== currentUserId)
					.forEach((member) => {
						items.push({
							id: member.userId,
							slug: member.email || member.userId,
							name: member.name,
							displayName: null,
							logoUrl: member.imageUrl,
							type: "member" as const,
							email: member.email,
							priority: 1,
						});
					});

				// 2. Personal orgs (priority 2) and other orgs (priority 3)
				userOrgs
					.filter((item) => item.organization.id !== organizationId)
					.forEach((item) => {
						items.push({
							id: item.organization.id,
							slug: item.organization.slug,
							name: item.organization.name,
							displayName: item.organization.displayName,
							logoUrl: item.organization.logoUrl,
							type: item.organization.isPersonalOrg
								? "personal-org"
								: "organization",
							priority: item.organization.isPersonalOrg ? 2 : 3,
						});
					});

				items.sort((a, b) => {
					if (a.priority !== b.priority) return a.priority - b.priority;
					return (a.displayName || a.name).localeCompare(
						b.displayName || b.name,
					);
				});

				setSelectableItems(items);
			} catch (error) {
				console.error("Error loading items:", error);
			} finally {
				setLoadingItems(false);
			}
		};

		loadItems();
	}, [organizationId, currentUserId]);

	const filteredItems = useMemo(() => {
		if (!searchQuery.trim()) return selectableItems;

		const query = searchQuery.toLowerCase();
		return selectableItems.filter(
			(item) =>
				item.name.toLowerCase().includes(query) ||
				item.displayName?.toLowerCase().includes(query) ||
				item.slug.toLowerCase().includes(query) ||
				item.email?.toLowerCase().includes(query),
		);
	}, [selectableItems, searchQuery]);

	const handleSelectItem = async (item: SelectableItem) => {
		setIsLoading(true);

		try {
			const result = await inviteCohost({
				eventId,
				emailOrSlug:
					item.type === "member" ? item.email || item.slug : item.slug,
			});

			if (result.success && result.invite) {
				const displayName = item.displayName || item.name;
				toast.success(`${displayName} agregado como co-organizador`);

				setCohosts([
					...cohosts,
					{
						id: result.invite.id,
						organizationId: result.invite.organizationId,
						organizationName: displayName,
						organizationSlug: item.slug,
						organizationLogoUrl: item.logoUrl,
						status: result.invite.status as "pending" | "approved" | "rejected",
						isPrimary: false,
					},
				]);

				setSearchQuery("");
				setModalOpen(false);
			} else {
				toast.error(result.error || "Error al agregar co-organizador");
			}
		} catch (_error) {
			toast.error("Error al agregar co-organizador");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemove = async (cohostId: string) => {
		try {
			const result = await removeCohostInvite(cohostId);

			if (result.success) {
				setCohosts(cohosts.filter((c) => c.id !== cohostId));
				toast.success("Co-organizador removido");
			} else {
				toast.error(result.error || "Error al remover");
			}
		} catch (_error) {
			toast.error("Error al remover");
		}
	};

	const allCohosts = cohosts.filter((c) => !c.isPrimary);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Equipo del Evento</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Gestiona los co-organizadores de este evento
					</p>
				</div>
				<Dialog open={modalOpen} onOpenChange={setModalOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Agregar
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Agregar co-organizador</DialogTitle>
							<DialogDescription>
								Selecciona un miembro del equipo u organización
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									disabled={isLoading || loadingItems}
									className="pl-9 h-9"
									autoFocus
								/>
							</div>

							<div className="border rounded-lg max-h-[320px] overflow-y-auto overflow-x-hidden">
								{loadingItems ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : filteredItems.length > 0 ? (
									<div className="divide-y">
										{filteredItems.map((item) => {
											const Icon = item.type === "member" ? User : Building2;
											const displayName = item.displayName || item.name;
											const subtitle =
												item.type === "member" ? item.email : `@${item.slug}`;

											return (
												<button
													key={`${item.type}-${item.id}`}
													type="button"
													onClick={() => handleSelectItem(item)}
													disabled={isLoading}
													className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left disabled:opacity-50 overflow-hidden"
												>
													{item.logoUrl ? (
														<div className="h-8 w-8 rounded-md overflow-hidden shrink-0 ring-1 ring-border/50">
															<Image
																src={item.logoUrl}
																alt={displayName}
																width={32}
																height={32}
																className="h-full w-full object-cover"
															/>
														</div>
													) : (
														<div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 ring-1 ring-border/50">
															<Icon className="h-4 w-4 text-muted-foreground" />
														</div>
													)}
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate max-w-[340px]">
															{displayName}
														</p>
														<p className="text-xs text-muted-foreground truncate max-w-[340px]">
															{subtitle}
														</p>
													</div>
													{item.priority === 1 && (
														<span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium shrink-0">
															Equipo
														</span>
													)}
													{isLoading && (
														<Loader2 className="h-4 w-4 animate-spin shrink-0" />
													)}
												</button>
											);
										})}
									</div>
								) : (
									<div className="py-12 text-center">
										<Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
										<p className="text-sm text-muted-foreground">
											{searchQuery
												? "No se encontraron resultados"
												: "No hay miembros u organizaciones disponibles"}
										</p>
									</div>
								)}
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{allCohosts.length > 0 ? (
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full">
						<thead className="bg-muted/50 border-b">
							<tr>
								<th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
									Organización
								</th>
								<th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
									Estado
								</th>
								<th className="w-[50px]"></th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{allCohosts.map((cohost) => {
								const statusConfig = STATUS_CONFIG[cohost.status];
								const StatusIcon = statusConfig.icon;

								return (
									<tr
										key={cohost.id}
										className="hover:bg-muted/50 transition-colors"
									>
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												{cohost.organizationLogoUrl ? (
													<div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-border">
														<img
															src={cohost.organizationLogoUrl}
															alt={cohost.organizationName}
															className="h-full w-full object-cover"
														/>
													</div>
												) : (
													<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
														<Building2 className="h-5 w-5 text-muted-foreground" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{cohost.organizationName}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														@{cohost.organizationSlug}
													</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1.5">
												<StatusIcon
													className={`h-3.5 w-3.5 ${statusConfig.className}`}
												/>
												<span className={`text-sm ${statusConfig.className}`}>
													{statusConfig.label}
												</span>
											</div>
										</td>
										<td className="px-4 py-3">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleRemove(cohost.id)}
												className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
											>
												<X className="h-4 w-4" />
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			) : (
				<div className="border rounded-lg p-12 text-center">
					<div className="flex justify-center mb-4">
						<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
							<Users className="h-6 w-6 text-muted-foreground" />
						</div>
					</div>
					<p className="text-sm font-medium mb-1">Sin co-organizadores</p>
					<p className="text-sm text-muted-foreground mb-4">
						Agrega otras organizaciones como co-organizadores
					</p>
					<Button onClick={() => setModalOpen(true)} variant="outline">
						<Plus className="h-4 w-4 mr-2" />
						Agregar organización
					</Button>
				</div>
			)}
		</div>
	);
}
