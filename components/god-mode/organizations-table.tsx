"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleOrganizationVerification } from "@/lib/actions/organizations";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrganizationsTableProps {
	organizations: Array<{
		id: string;
		name: string;
		displayName: string | null;
		slug: string;
		isVerified: boolean;
		logoUrl: string | null;
		createdAt: Date;
		events: Array<{ id: string }>;
	}>;
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
	const [optimisticOrgs, setOptimisticOrgs] = useState(organizations);

	async function handleToggleVerification(orgId: string) {
		const org = optimisticOrgs.find((o) => o.id === orgId);
		if (!org) return;

		setOptimisticOrgs((prev) =>
			prev.map((o) =>
				o.id === orgId ? { ...o, isVerified: !o.isVerified } : o
			)
		);

		try {
			await toggleOrganizationVerification(orgId);
			toast.success(
				org.isVerified
					? "Verificación removida"
					: "Organización verificada"
			);
		} catch (error) {
			setOptimisticOrgs(organizations);
			toast.error(
				error instanceof Error ? error.message : "Error al actualizar verificación"
			);
		}
	}

	return (
		<div className="rounded-lg border border-border overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="border-b bg-muted/30">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Organización
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Eventos
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Creada
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Estado
							</th>
							<th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{optimisticOrgs.map((org) => (
							<tr
								key={org.id}
								className="hover:bg-muted/50 transition-colors"
							>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										{org.logoUrl ? (
											<img
												src={org.logoUrl}
												alt={org.name}
												className="h-8 w-8 rounded object-cover"
											/>
										) : (
											<div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
												<Building2 className="h-4 w-4 text-muted-foreground" />
											</div>
										)}
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<p className="font-medium truncate">
													{org.displayName || org.name}
												</p>
												{org.isVerified && (
													<Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
												)}
											</div>
											<p className="text-xs text-muted-foreground truncate">
												/{org.slug}
											</p>
										</div>
									</div>
								</td>
								<td className="px-4 py-3 text-sm">
									{org.events.length}
								</td>
								<td className="px-4 py-3 text-sm text-muted-foreground">
									{formatDistanceToNow(new Date(org.createdAt), {
										addSuffix: true,
										locale: es,
									})}
								</td>
								<td className="px-4 py-3">
									{org.isVerified ? (
										<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
											<Check className="h-3 w-3" />
											Verificada
										</span>
									) : (
										<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
											<X className="h-3 w-3" />
											Sin verificar
										</span>
									)}
								</td>
								<td className="px-4 py-3 text-right">
									<div className="flex items-center justify-end gap-2">
										<Link
											href={`/c/${org.slug}`}
											className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
											title="Ver comunidad"
										>
											<ExternalLink className="h-4 w-4" />
										</Link>
										<Button
											size="sm"
											variant={org.isVerified ? "outline" : "default"}
											onClick={() => handleToggleVerification(org.id)}
										>
											{org.isVerified ? (
												<>
													<X className="h-3.5 w-3.5 mr-1.5" />
													Quitar verificación
												</>
											) : (
												<>
													<Check className="h-3.5 w-3.5 mr-1.5" />
													Verificar
												</>
											)}
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
