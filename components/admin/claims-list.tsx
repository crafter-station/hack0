"use client";

import { Check, ChevronDown, Clock, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TrophyIcon } from "@/components/icons/trophy";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { approveWinnerClaim, rejectWinnerClaim } from "@/lib/actions/claims";

interface WinnerClaim {
	id: string;
	eventId: string;
	userId: string;
	position: number;
	teamName: string | null;
	projectName: string | null;
	projectUrl: string | null;
	proofUrl: string | null;
	proofDescription: string | null;
	status: string | null;
	createdAt: Date | null;
	eventName: string | null;
	eventSlug: string | null;
	organizationSlug: string | null;
}

interface AdminClaimsListProps {
	title: string;
	type: "winner";
	claims: WinnerClaim[];
}

export function AdminClaimsList({ title, claims }: AdminClaimsListProps) {
	const [filter, setFilter] = useState<
		"all" | "pending" | "approved" | "rejected"
	>("pending");

	const filteredClaims = claims.filter((claim) => {
		if (filter === "all") return true;
		return claim.status === filter;
	});

	const pendingCount = claims.filter((c) => c.status === "pending").length;

	return (
		<div className="rounded-lg border">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<TrophyIcon className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-medium">{title}</h2>
					{pendingCount > 0 && (
						<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-medium text-amber-500">
							{pendingCount}
						</span>
					)}
				</div>

				{/* Filter tabs */}
				<div className="flex gap-1 rounded-lg bg-muted p-1">
					{(["pending", "approved", "rejected", "all"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
								filter === f
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{f === "pending"
								? "Pendientes"
								: f === "approved"
									? "Aprobados"
									: f === "rejected"
										? "Rechazados"
										: "Todos"}
						</button>
					))}
				</div>
			</div>

			{/* List */}
			<div className="divide-y">
				{filteredClaims.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-muted-foreground">
						No hay solicitudes{" "}
						{filter === "pending"
							? "pendientes"
							: filter === "approved"
								? "aprobadas"
								: filter === "rejected"
									? "rechazadas"
									: ""}
					</div>
				) : (
					filteredClaims.map((claim) => (
						<ClaimRow key={claim.id} claim={claim} />
					))
				)}
			</div>
		</div>
	);
}

function ClaimRow({ claim }: { claim: WinnerClaim }) {
	const [loading, setLoading] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const handleApprove = async () => {
		setLoading(true);
		await approveWinnerClaim(claim.id);
		setLoading(false);
	};

	const handleReject = async () => {
		setLoading(true);
		await rejectWinnerClaim(claim.id);
		setLoading(false);
	};

	const isPending = claim.status === "pending";
	const isApproved = claim.status === "approved";
	const _isRejected = claim.status === "rejected";

	return (
		<Collapsible open={expanded} onOpenChange={setExpanded}>
			<div className="px-4 py-3">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						{/* Event link */}
						<div className="flex items-center gap-2 mb-1">
							<Link
								href={
									claim.organizationSlug
										? `/c/${claim.organizationSlug}/events/${claim.eventSlug}`
										: `/${claim.eventSlug}`
								}
								className="font-medium hover:underline truncate"
							>
								{claim.eventName}
							</Link>
							<span className="text-lg">
								{claim.position === 1
									? "🥇"
									: claim.position === 2
										? "🥈"
										: "🥉"}
							</span>
						</div>

						{/* Info */}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
							{claim.teamName && <span>Equipo: {claim.teamName}</span>}
							{claim.projectName && <span>· {claim.projectName}</span>}
						</div>

						{/* Date */}
						<div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70">
							<Clock className="h-3 w-3" />
							{claim.createdAt
								? new Date(claim.createdAt).toLocaleDateString("es-PE", {
										day: "numeric",
										month: "short",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})
								: "—"}
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Status badge */}
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
								isPending
									? "bg-amber-500/10 text-amber-500"
									: isApproved
										? "bg-emerald-500/10 text-emerald-500"
										: "bg-red-500/10 text-red-500"
							}`}
						>
							{isPending ? "Pendiente" : isApproved ? "Aprobado" : "Rechazado"}
						</span>

						{isPending && (
							<>
								<Button
									size="sm"
									variant="outline"
									className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
									onClick={handleApprove}
									disabled={loading}
								>
									<Check className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-500"
									onClick={handleReject}
									disabled={loading}
								>
									<X className="h-4 w-4" />
								</Button>
							</>
						)}

						<CollapsibleTrigger asChild>
							<Button size="sm" variant="ghost" className="h-8 w-8 p-0">
								<ChevronDown
									className={`h-4 w-4 transition-transform ${
										expanded ? "rotate-180" : ""
									}`}
								/>
							</Button>
						</CollapsibleTrigger>
					</div>
				</div>

				{/* Expanded content */}
				<CollapsibleContent>
					<div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm space-y-2">
						{/* Proof URL */}
						{claim.proofUrl && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Prueba:</span>
								<a
									href={claim.proofUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-blue-500 hover:underline"
								>
									{claim.proofUrl.slice(0, 50)}...
									<ExternalLink className="h-3 w-3" />
								</a>
							</div>
						)}

						{/* Project URL */}
						{claim.projectUrl && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Proyecto:</span>
								<a
									href={claim.projectUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-blue-500 hover:underline"
								>
									{claim.projectUrl.slice(0, 50)}...
									<ExternalLink className="h-3 w-3" />
								</a>
							</div>
						)}

						{/* Description */}
						{claim.proofDescription && (
							<div>
								<span className="text-muted-foreground">Descripción:</span>
								<p className="mt-1">{claim.proofDescription}</p>
							</div>
						)}

						{/* User ID */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground/70">
							<span>User ID: {claim.userId}</span>
						</div>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
