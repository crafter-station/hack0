"use client";

import { Check, ChevronDown, Clock, ExternalLink, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { approveHostClaim, rejectHostClaim } from "@/lib/actions/host-claims";

interface HostClaim {
	id: string;
	eventHostId: string;
	userId: string;
	proofUrl: string | null;
	proofDescription: string | null;
	status: string | null;
	createdAt: Date | null;
	hostName: string | null;
	hostAvatarUrl: string | null;
	eventId: string | null;
	eventName: string | null;
	eventShortCode: string | null;
	organizationSlug: string | null;
}

interface HostClaimsListProps {
	title: string;
	claims: HostClaim[];
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

export function HostClaimsList({ title, claims }: HostClaimsListProps) {
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
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<User className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-medium">{title}</h2>
					{pendingCount > 0 && (
						<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-medium text-amber-500">
							{pendingCount}
						</span>
					)}
				</div>

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
						<HostClaimRow key={claim.id} claim={claim} />
					))
				)}
			</div>
		</div>
	);
}

function HostClaimRow({ claim }: { claim: HostClaim }) {
	const [loading, setLoading] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const handleApprove = async () => {
		setLoading(true);
		await approveHostClaim(claim.id);
		setLoading(false);
	};

	const handleReject = async () => {
		setLoading(true);
		await rejectHostClaim(claim.id);
		setLoading(false);
	};

	const isPending = claim.status === "pending";
	const isApproved = claim.status === "approved";

	return (
		<Collapsible open={expanded} onOpenChange={setExpanded}>
			<div className="px-4 py-3">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 mb-1">
							<Avatar className="h-8 w-8">
								{claim.hostAvatarUrl && (
									<AvatarImage
										src={claim.hostAvatarUrl}
										alt={claim.hostName || ""}
									/>
								)}
								<AvatarFallback className="text-xs">
									{getInitials(claim.hostName || "?")}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">{claim.hostName}</p>
								<Link
									href={
										claim.eventShortCode ? `/e/${claim.eventShortCode}` : "#"
									}
									className="text-sm text-muted-foreground hover:underline"
								>
									{claim.eventName}
								</Link>
							</div>
						</div>

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

					<div className="flex items-center gap-2">
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

				<CollapsibleContent>
					<div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm space-y-2">
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

						{claim.proofDescription && (
							<div>
								<span className="text-muted-foreground">Descripción:</span>
								<p className="mt-1">{claim.proofDescription}</p>
							</div>
						)}

						<div className="flex items-center gap-2 text-xs text-muted-foreground/70">
							<span>User ID: {claim.userId}</span>
						</div>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
