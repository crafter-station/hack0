"use client";

import {
	AlertCircle,
	BarChart3,
	Link2,
	Network,
	Trophy,
	Users,
} from "lucide-react";
import type { GraphStats } from "@/lib/actions/organization-relationships";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/db/schema";

interface EcosystemGraphSidebarProps {
	stats: GraphStats;
}

export function EcosystemGraphSidebar({ stats }: EcosystemGraphSidebarProps) {
	return (
		<div className="space-y-4">
			<div className="border border-border rounded-lg p-4 bg-background">
				<h3 className="font-medium text-sm flex items-center gap-2 mb-4">
					<BarChart3 className="h-4 w-4" />
					Estadísticas
				</h3>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Network className="h-3.5 w-3.5" />
							<span className="text-xs">Nodos</span>
						</div>
						<div className="text-2xl font-semibold">{stats.totalNodes}</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Link2 className="h-3.5 w-3.5" />
							<span className="text-xs">Conexiones</span>
						</div>
						<div className="text-2xl font-semibold">{stats.totalEdges}</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<AlertCircle className="h-3.5 w-3.5" />
							<span className="text-xs">Pendientes</span>
						</div>
						<div className="text-2xl font-semibold text-amber-500">
							{stats.pendingVerification}
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Users className="h-3.5 w-3.5" />
							<span className="text-xs">Sin conexión</span>
						</div>
						<div className="text-2xl font-semibold text-muted-foreground">
							{stats.orgsWithoutConnections}
						</div>
					</div>
				</div>
			</div>

			{stats.topConnected.length > 0 && (
				<div className="border border-border rounded-lg p-4 bg-background">
					<h3 className="font-medium text-sm flex items-center gap-2 mb-4">
						<Trophy className="h-4 w-4" />
						Más conectados
					</h3>

					<div className="space-y-3">
						{stats.topConnected.map((org, index) => (
							<div
								key={org.id}
								className="flex items-center justify-between text-sm"
							>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground w-4">
										{index + 1}.
									</span>
									<span className="truncate max-w-[140px]">{org.name}</span>
								</div>
								<span className="text-muted-foreground text-xs">
									{org.connections}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{Object.keys(stats.byType).length > 0 && (
				<div className="border border-border rounded-lg p-4 bg-background">
					<h3 className="font-medium text-sm flex items-center gap-2 mb-4">
						<Link2 className="h-4 w-4" />
						Por tipo de relación
					</h3>

					<div className="space-y-2">
						{Object.entries(stats.byType)
							.sort((a, b) => b[1] - a[1])
							.map(([type, count]) => (
								<div
									key={type}
									className="flex items-center justify-between text-sm"
								>
									<span className="text-muted-foreground truncate max-w-[140px]">
										{RELATIONSHIP_TYPE_LABELS[type] || type}
									</span>
									<span className="font-medium">{count}</span>
								</div>
							))}
					</div>
				</div>
			)}

			<div className="border border-border rounded-lg p-4 bg-background">
				<h3 className="font-medium text-sm mb-3">Leyenda</h3>
				<div className="space-y-2 text-xs">
					<div className="flex items-center gap-2">
						<div className="h-0.5 w-6 bg-emerald-500" />
						<span className="text-muted-foreground">Relación verificada</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className="h-0.5 w-6 bg-gray-400"
							style={{
								backgroundImage:
									"repeating-linear-gradient(90deg, currentColor, currentColor 4px, transparent 4px, transparent 8px)",
							}}
						/>
						<span className="text-muted-foreground">
							Pendiente de verificar
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
						<span className="text-muted-foreground">Org verificada</span>
					</div>
				</div>
			</div>
		</div>
	);
}
