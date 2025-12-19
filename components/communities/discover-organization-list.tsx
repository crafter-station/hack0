"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { followCommunity, unfollowCommunity } from "@/lib/actions/communities";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

interface PublicCommunity {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	description: string | null;
	type: string | null;
	logoUrl: string | null;
	isVerified: boolean | null;
	memberCount: number;
	isFollowing: boolean;
}

interface DiscoverOrganizationListProps {
	organizations: PublicCommunity[];
	isAuthenticated: boolean;
}

type SortField = "name" | "type" | "members";
type SortDirection = "asc" | "desc";

function FollowButton({
	communityId,
	isFollowing,
	isAuthenticated,
}: {
	communityId: string;
	isFollowing: boolean;
	isAuthenticated: boolean;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isAuthenticated) {
			router.push(`/sign-in?redirect_url=/c/discover`);
			return;
		}

		startTransition(async () => {
			try {
				if (optimisticFollowing) {
					setOptimisticFollowing(false);
					const result = await unfollowCommunity(communityId);
					if (!result.success) {
						setOptimisticFollowing(true);
						toast.error(result.error);
					}
				} else {
					setOptimisticFollowing(true);
					const result = await followCommunity(communityId);
					if (!result.success) {
						setOptimisticFollowing(false);
						toast.error(result.error);
					}
				}
			} catch {
				setOptimisticFollowing(isFollowing);
				toast.error("Error al procesar la solicitud");
			}
		});
	};

	return (
		<button
			onClick={handleClick}
			disabled={isPending}
			className={`inline-flex items-center justify-center h-7 px-3 text-[11px] font-medium rounded-md transition-colors ${
				optimisticFollowing
					? "bg-muted text-muted-foreground hover:bg-muted/80"
					: "bg-foreground text-background hover:bg-foreground/90"
			} disabled:opacity-50`}
		>
			{isPending ? (
				<Loader2 className="h-3 w-3 animate-spin" />
			) : optimisticFollowing ? (
				"Siguiendo"
			) : (
				"Seguir"
			)}
		</button>
	);
}

export function DiscoverOrganizationList({
	organizations,
	isAuthenticated,
}: DiscoverOrganizationListProps) {
	const [sortField, setSortField] = useState<SortField>("members");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const sortedOrganizations = useMemo(() => {
		const result = [...organizations];

		result.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "name":
					comparison = (a.displayName || a.name).localeCompare(
						b.displayName || b.name,
					);
					break;
				case "type":
					comparison = (a.type || "").localeCompare(b.type || "");
					break;
				case "members":
					comparison = a.memberCount - b.memberCount;
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [organizations, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection(field === "members" ? "desc" : "asc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field)
			return <ChevronDown className="h-2.5 w-2.5 opacity-30" />;
		return sortDirection === "asc" ? (
			<ChevronUp className="h-2.5 w-2.5" />
		) : (
			<ChevronDown className="h-2.5 w-2.5" />
		);
	};

	if (organizations.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron comunidades
			</div>
		);
	}

	return (
		<div className="text-xs">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-border text-left text-muted-foreground">
							<th className="pb-2 pr-4 font-medium">
								<button
									onClick={() => handleSort("name")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Comunidad <SortIcon field="name" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden md:table-cell">
								<button
									onClick={() => handleSort("type")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Tipo <SortIcon field="type" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden sm:table-cell">
								<button
									onClick={() => handleSort("members")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Miembros <SortIcon field="members" />
								</button>
							</th>
							<th className="pb-2 font-medium text-right">
								<span className="sr-only">Acciones</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrganizations.map((org) => (
							<tr
								key={org.id}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="py-2 pr-4">
									<Link
										href={`/c/${org.slug}`}
										className="group flex items-center gap-2"
									>
										<div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
											{org.logoUrl ? (
												<Image
													src={org.logoUrl}
													alt={org.displayName || org.name}
													fill
													className="object-cover"
													sizes="24px"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-muted-foreground">
													{(org.displayName || org.name).charAt(0)}
												</div>
											)}
										</div>
										<div className="min-w-0">
											<span className="text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
												{org.displayName || org.name}
												{org.isVerified && (
													<CheckCircle2 className="h-3 w-3 text-emerald-500" />
												)}
											</span>
											<div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
												@{org.slug}
											</div>
										</div>
									</Link>
								</td>
								<td className="py-2 pr-4 text-muted-foreground hidden md:table-cell">
									{org.type ? ORGANIZER_TYPE_LABELS[org.type] || org.type : "—"}
								</td>
								<td className="py-2 pr-4 hidden sm:table-cell">
									<span
										className={
											org.memberCount > 0
												? "text-foreground"
												: "text-muted-foreground/50"
										}
									>
										{org.memberCount}
									</span>
								</td>
								<td className="py-2 text-right">
									<FollowButton
										communityId={org.id}
										isFollowing={org.isFollowing}
										isAuthenticated={isAuthenticated}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
