"use client";

import {
	CheckCircle2,
	Loader2,
	Plus,
	Search,
	User,
	Users,
	X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
	assignEventHost,
	getAssignableMembers,
	removeEventHost,
} from "@/lib/actions/event-hosts";

interface EventHost {
	id: string;
	name: string;
	avatarUrl: string | null;
	source: "luma" | "manual";
	userId: string | null;
}

interface AssignableMember {
	userId: string;
	role: string;
	displayName: string;
	avatarUrl: string | null;
}

interface HostAssignmentProps {
	eventId: string;
	initialHosts: EventHost[];
}

function getInitials(name: string): string {
	const words = name.split(/\s+/).filter(Boolean);
	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}
	return words
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
}

export function HostAssignment({ eventId, initialHosts }: HostAssignmentProps) {
	const [hosts, setHosts] = useState<EventHost[]>(initialHosts);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [members, setMembers] = useState<AssignableMember[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		const loadMembers = async () => {
			setLoadingMembers(true);
			try {
				const result = await getAssignableMembers(eventId);
				setMembers(result);
			} catch (error) {
				console.error("Error loading members:", error);
			} finally {
				setLoadingMembers(false);
			}
		};

		loadMembers();
	}, [eventId]);

	const availableMembers = useMemo(() => {
		const assignedUserIds = new Set(hosts.map((h) => h.userId).filter(Boolean));
		return members.filter((m) => !assignedUserIds.has(m.userId));
	}, [members, hosts]);

	const filteredMembers = useMemo(() => {
		if (!searchQuery.trim()) return availableMembers;

		const query = searchQuery.toLowerCase();
		return availableMembers.filter((member) =>
			member.displayName.toLowerCase().includes(query),
		);
	}, [availableMembers, searchQuery]);

	const handleAssign = async (member: AssignableMember) => {
		setIsLoading(true);

		try {
			const result = await assignEventHost(eventId, member.userId);

			if (result.success) {
				toast.success(`${member.displayName} agregado como host`);
				setHosts([
					...hosts,
					{
						id: crypto.randomUUID(),
						name: member.displayName,
						avatarUrl: member.avatarUrl,
						source: "manual",
						userId: member.userId,
					},
				]);
				setSearchQuery("");
				setModalOpen(false);
			} else {
				toast.error(result.error || "Error al agregar host");
			}
		} catch (_error) {
			toast.error("Error al agregar host");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemove = async (hostId: string) => {
		try {
			const result = await removeEventHost(hostId);

			if (result.success) {
				setHosts(hosts.filter((h) => h.id !== hostId));
				toast.success("Host removido");
			} else {
				toast.error(result.error || "Error al remover");
			}
		} catch (_error) {
			toast.error("Error al remover");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Hosts del Evento</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Personas que representan y organizan este evento
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
							<DialogTitle>Agregar host</DialogTitle>
							<DialogDescription>
								Selecciona un miembro de la comunidad para asignar como host
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar miembro..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									disabled={isLoading || loadingMembers}
									className="pl-9 h-9"
									autoFocus
								/>
							</div>

							<div className="border rounded-lg max-h-[320px] overflow-y-auto overflow-x-hidden">
								{loadingMembers ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : filteredMembers.length > 0 ? (
									<div className="divide-y">
										{filteredMembers.map((member) => (
											<button
												key={member.userId}
												type="button"
												onClick={() => handleAssign(member)}
												disabled={isLoading}
												className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left disabled:opacity-50 overflow-hidden"
											>
												{member.avatarUrl ? (
													<div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-1 ring-border/50">
														<Image
															src={member.avatarUrl}
															alt={member.displayName}
															width={32}
															height={32}
															className="h-full w-full object-cover"
														/>
													</div>
												) : (
													<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-border/50">
														<User className="h-4 w-4 text-muted-foreground" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate max-w-[340px]">
														{member.displayName}
													</p>
													<p className="text-xs text-muted-foreground capitalize">
														{member.role}
													</p>
												</div>
												{isLoading && (
													<Loader2 className="h-4 w-4 animate-spin shrink-0" />
												)}
											</button>
										))}
									</div>
								) : (
									<div className="py-12 text-center">
										<Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
										<p className="text-sm text-muted-foreground">
											{searchQuery
												? "No se encontraron miembros"
												: "No hay miembros disponibles para asignar"}
										</p>
									</div>
								)}
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{hosts.length > 0 ? (
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full">
						<thead className="bg-muted/50 border-b">
							<tr>
								<th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
									Host
								</th>
								<th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
									Origen
								</th>
								<th className="w-[50px]" />
							</tr>
						</thead>
						<tbody className="divide-y">
							{hosts.map((host) => (
								<tr
									key={host.id}
									className="hover:bg-muted/50 transition-colors"
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10">
												{host.avatarUrl && (
													<AvatarImage src={host.avatarUrl} alt={host.name} />
												)}
												<AvatarFallback>
													{getInitials(host.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium truncate">
														{host.name}
													</p>
													{host.userId && (
														<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
													)}
												</div>
												{host.source === "luma" && (
													<p className="text-xs text-muted-foreground">
														Importado de Luma
													</p>
												)}
											</div>
										</div>
									</td>
									<td className="px-4 py-3">
										<span
											className={`text-xs px-2 py-1 rounded-full ${
												host.source === "luma"
													? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
													: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
											}`}
										>
											{host.source === "luma" ? "Luma" : "Manual"}
										</span>
									</td>
									<td className="px-4 py-3">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemove(host.id)}
											className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
										>
											<X className="h-4 w-4" />
										</Button>
									</td>
								</tr>
							))}
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
					<p className="text-sm font-medium mb-1">Sin hosts asignados</p>
					<p className="text-sm text-muted-foreground mb-4">
						Agrega miembros de tu comunidad como hosts del evento
					</p>
					<Button onClick={() => setModalOpen(true)} variant="outline">
						<Plus className="h-4 w-4 mr-2" />
						Agregar host
					</Button>
				</div>
			)}
		</div>
	);
}
