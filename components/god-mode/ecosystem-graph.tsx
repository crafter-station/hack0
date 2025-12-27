"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type {
	GraphEdge,
	GraphNode,
} from "@/lib/actions/organization-relationships";

interface EcosystemGraphProps {
	nodes: GraphNode[];
	edges: GraphEdge[];
	selectedOrgId?: string;
	onNodeClick: (node: GraphNode) => void;
	onNodeHover: (node: GraphNode | null) => void;
}

const TYPE_COLORS: Record<string, string> = {
	startup: "#3b82f6",
	investor: "#10b981",
	university: "#8b5cf6",
	community: "#f59e0b",
	company: "#6366f1",
	government: "#ef4444",
	ngo: "#ec4899",
	law_firm: "#64748b",
	consulting: "#0ea5e9",
	coworking: "#14b8a6",
};

interface D3Node extends d3.SimulationNodeDatum {
	id: string;
	slug: string;
	name: string;
	type: string | null;
	logoUrl: string | null;
	department: string | null;
	memberCount: number;
	isVerified: boolean | null;
	websiteUrl: string | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
	id: string;
	type: string;
	strength: number;
	label: string;
	isVerified: boolean;
}

function getNodeColor(type: string | null) {
	return TYPE_COLORS[type || ""] || "#9ca3af";
}

export function EcosystemGraph({
	nodes,
	edges,
	selectedOrgId,
	onNodeClick,
	onNodeHover,
}: EcosystemGraphProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const onNodeClickRef = useRef(onNodeClick);
	const onNodeHoverRef = useRef(onNodeHover);

	onNodeClickRef.current = onNodeClick;
	onNodeHoverRef.current = onNodeHover;

	useEffect(() => {
		if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

		const container = containerRef.current;
		const width = container.clientWidth;
		const height = 600;

		d3.select(svgRef.current).selectAll("*").remove();

		const svg = d3
			.select(svgRef.current)
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", [0, 0, width, height]);

		const g = svg.append("g");

		const zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.1, 4])
			.on("zoom", (event) => {
				g.attr("transform", event.transform);
			});

		svg.call(zoom);

		const d3Nodes: D3Node[] = nodes.map((n) => ({ ...n }));
		const d3Links: D3Link[] = edges.map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			type: e.type,
			strength: e.strength,
			label: e.label,
			isVerified: e.isVerified,
		}));

		const simulation = d3
			.forceSimulation(d3Nodes)
			.force(
				"link",
				d3
					.forceLink<D3Node, D3Link>(d3Links)
					.id((d) => d.id)
					.distance(120),
			)
			.force("charge", d3.forceManyBody().strength(-200))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force("collision", d3.forceCollide().radius(25))
			.alphaDecay(0.05);

		setTimeout(() => {
			simulation.stop();
			d3Nodes.forEach((d) => {
				d.fx = d.x;
				d.fy = d.y;
			});
		}, 3000);

		svg
			.append("defs")
			.append("marker")
			.attr("id", "arrowhead")
			.attr("viewBox", "-0 -5 10 10")
			.attr("refX", 20)
			.attr("refY", 0)
			.attr("orient", "auto")
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.append("path")
			.attr("d", "M 0,-5 L 10 ,0 L 0,5")
			.attr("fill", "#9ca3af");

		const link = g
			.append("g")
			.attr("stroke-opacity", 0.6)
			.selectAll("line")
			.data(d3Links)
			.join("line")
			.attr("stroke", (d) => (d.isVerified ? "#10b981" : "#9ca3af"))
			.attr("stroke-width", (d) => Math.max(1, d.strength / 3))
			.attr("stroke-dasharray", (d) => (d.isVerified ? "none" : "4,2"))
			.attr("marker-end", "url(#arrowhead)");

		const drag = d3
			.drag<SVGGElement, D3Node>()
			.on("start", (event, d) => {
				d.fx = d.x;
				d.fy = d.y;
			})
			.on("drag", (event, d) => {
				d.fx = event.x;
				d.fy = event.y;
				d.x = event.x;
				d.y = event.y;
				d3.select(event.sourceEvent.target.parentNode).attr(
					"transform",
					`translate(${event.x},${event.y})`,
				);
				link
					.attr("x1", (l) => (l.source as D3Node).x!)
					.attr("y1", (l) => (l.source as D3Node).y!)
					.attr("x2", (l) => (l.target as D3Node).x!)
					.attr("y2", (l) => (l.target as D3Node).y!);
			})
			.on("end", (event, d) => {
				d.fx = event.x;
				d.fy = event.y;
				d.x = event.x;
				d.y = event.y;
			});

		const nodeGroup = g
			.append("g")
			.selectAll<SVGGElement, D3Node>("g")
			.data(d3Nodes)
			.join("g")
			.attr("cursor", "pointer")
			.call(drag);

		nodeGroup
			.append("circle")
			.attr("r", (d) => (d.id === selectedOrgId ? 20 : 15))
			.attr("fill", (d) => getNodeColor(d.type))
			.attr("stroke", (d) => (d.id === selectedOrgId ? "#000" : "transparent"))
			.attr("stroke-width", 3)
			.attr("opacity", (d) =>
				selectedOrgId
					? d.id === selectedOrgId ||
						edges.some(
							(e) =>
								(e.source === selectedOrgId && e.target === d.id) ||
								(e.target === selectedOrgId && e.source === d.id),
						)
						? 1
						: 0.3
					: 1,
			);

		nodeGroup
			.filter((d) => d.isVerified === true)
			.append("circle")
			.attr("r", 5)
			.attr("cx", 10)
			.attr("cy", -10)
			.attr("fill", "#10b981");

		nodeGroup
			.append("text")
			.text((d) => d.name.slice(0, 12) + (d.name.length > 12 ? "..." : ""))
			.attr("x", 0)
			.attr("y", 30)
			.attr("text-anchor", "middle")
			.attr("font-size", "10px")
			.attr("fill", "currentColor")
			.attr("opacity", 0.8);

		nodeGroup
			.on("click", (_, d) => {
				const originalNode = nodes.find((n) => n.id === d.id);
				if (originalNode) onNodeClickRef.current(originalNode);
			})
			.on("mouseenter", (_, d) => {
				const originalNode = nodes.find((n) => n.id === d.id);
				if (originalNode) onNodeHoverRef.current(originalNode);
			})
			.on("mouseleave", () => {
				onNodeHoverRef.current(null);
			});

		simulation.on("tick", () => {
			link
				.attr("x1", (d) => (d.source as D3Node).x!)
				.attr("y1", (d) => (d.source as D3Node).y!)
				.attr("x2", (d) => (d.target as D3Node).x!)
				.attr("y2", (d) => (d.target as D3Node).y!);

			nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
		});

		return () => {
			simulation.stop();
		};
	}, [nodes, edges, selectedOrgId]);

	if (nodes.length === 0) {
		return (
			<div className="h-[600px] flex items-center justify-center text-muted-foreground">
				<div className="text-center">
					<p className="text-sm">No hay organizaciones para mostrar</p>
					<p className="text-xs mt-1">Ajusta los filtros o agrega relaciones</p>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="w-full">
			<svg ref={svgRef} className="w-full" style={{ height: 600 }} />
		</div>
	);
}
