"use client";

import { CheckCircle2, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type {
	EcosystemGraphData,
	GraphNode,
} from "@/lib/actions/organization-relationships";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";
import { EcosystemGraph } from "./ecosystem-graph";
import { EcosystemGraphSidebar } from "./ecosystem-graph-sidebar";

interface EcosystemGraphContainerProps {
	initialData: EcosystemGraphData;
	selectedOrgId?: string;
}

export function EcosystemGraphContainer({
	initialData,
	selectedOrgId,
}: EcosystemGraphContainerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

	const handleNodeClick = (node: GraphNode) => {
		const params = new URLSearchParams(searchParams.toString());
		if (params.get("org") === node.id) {
			params.delete("org");
		} else {
			params.set("org", node.id);
		}
		router.push(`/god/graph?${params.toString()}`);
	};

	const handleFilterChange = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value === "" || value === "all") {
			params.delete(key);
		} else {
			params.set(key, value);
		}
		router.push(`/god/graph?${params.toString()}`);
	};

	const currentType = searchParams.get("type") || "";
	const currentDepartment = searchParams.get("department") || "";
	const onlyVerified = searchParams.get("verified") === "true";

	const departments = [
		...new Set(initialData.nodes.map((n) => n.department).filter(Boolean)),
	] as string[];
	const orgTypes = [
		...new Set(initialData.nodes.map((n) => n.type).filter(Boolean)),
	] as string[];

	return (
		<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<div className="lg:col-span-3 space-y-4">
				<div className="flex items-center gap-4 flex-wrap">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<select
							value={currentType}
							onChange={(e) => handleFilterChange("type", e.target.value)}
							className="h-8 px-3 text-xs border border-border rounded-md bg-background"
						>
							<option value="">Todos los tipos</option>
							{orgTypes.map((type) => (
								<option key={type} value={type}>
									{ORGANIZER_TYPE_LABELS[type] || type}
								</option>
							))}
						</select>
					</div>

					<select
						value={currentDepartment}
						onChange={(e) => handleFilterChange("department", e.target.value)}
						className="h-8 px-3 text-xs border border-border rounded-md bg-background"
					>
						<option value="">Todas las ubicaciones</option>
						{departments.sort().map((dept) => (
							<option key={dept} value={dept}>
								{dept}
							</option>
						))}
					</select>

					<label className="flex items-center gap-2 text-xs">
						<input
							type="checkbox"
							checked={onlyVerified}
							onChange={(e) =>
								handleFilterChange("verified", e.target.checked ? "true" : "")
							}
							className="rounded border-border"
						/>
						Solo verificadas
					</label>

					{selectedOrgId && (
						<button
							onClick={() => handleFilterChange("org", "")}
							className="h-8 px-3 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
						>
							Ver todo el ecosistema
						</button>
					)}
				</div>

				<div className="relative border border-border rounded-lg bg-background overflow-hidden">
					<EcosystemGraph
						nodes={initialData.nodes}
						edges={initialData.edges}
						selectedOrgId={selectedOrgId}
						onNodeClick={handleNodeClick}
						onNodeHover={setHoveredNode}
					/>

					{hoveredNode && (
						<div className="absolute top-4 left-4 bg-background border border-border rounded-lg p-3 shadow-lg z-10 max-w-xs">
							<div className="flex items-center gap-2">
								{hoveredNode.logoUrl ? (
									<img
										src={hoveredNode.logoUrl}
										alt={hoveredNode.name}
										className="h-8 w-8 rounded-full object-cover"
									/>
								) : (
									<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
										{hoveredNode.name.charAt(0)}
									</div>
								)}
								<div>
									<div className="flex items-center gap-1.5">
										<span className="font-medium text-sm">
											{hoveredNode.name}
										</span>
										{hoveredNode.isVerified && (
											<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
										)}
									</div>
									<div className="text-xs text-muted-foreground">
										{hoveredNode.type
											? ORGANIZER_TYPE_LABELS[hoveredNode.type] ||
												hoveredNode.type
											: "Sin tipo"}
									</div>
								</div>
							</div>
							{hoveredNode.department && (
								<div className="mt-2 text-xs text-muted-foreground">
									📍 {hoveredNode.department}
								</div>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<div className="flex items-center gap-1.5">
						<div className="h-3 w-3 rounded-full bg-blue-500" />
						<span>Startup</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-3 w-3 rounded-full bg-emerald-500" />
						<span>Investor</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-3 w-3 rounded-full bg-purple-500" />
						<span>University</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-3 w-3 rounded-full bg-amber-500" />
						<span>Community</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="h-3 w-3 rounded-full bg-gray-400" />
						<span>Otros</span>
					</div>
				</div>
			</div>

			<EcosystemGraphSidebar stats={initialData.stats} />
		</div>
	);
}
