"use client";

import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Globe,
	Loader2,
	MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { GithubLogo } from "@/components/logos/github";
import { InstagramLogo } from "@/components/logos/instagram";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import {
	type CommunitiesResponse,
	type PublicCommunity,
	useCommunities,
} from "@/hooks/use-communities";
import { followCommunity, unfollowCommunity } from "@/lib/actions/communities";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

interface InfiniteCommunitiesListProps {
	initialData: CommunitiesResponse;
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

	useEffect(() => {
		setOptimisticFollowing(isFollowing);
	}, [isFollowing]);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isAuthenticated) {
			router.push("/sign-in?redirect_url=/c/discover");
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
			className={`inline-flex items-center justify-center h-7 px-3 text-[11px] font-medium transition-colors ${
				optimisticFollowing
					? "bg-muted text-muted-foreground hover:bg-muted/80"
					: "border border-foreground/50 text-foreground bg-transparent hover:bg-foreground hover:text-background"
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

function CommunityRow({
	community,
	isAuthenticated,
}: {
	community: PublicCommunity;
	isAuthenticated: boolean;
}) {
	return (
		<tr className="border-b border-border/50 hover:bg-muted/30">
			<td className="py-2 pr-4">
				<Link
					href={`/c/${community.slug}`}
					className="group flex items-center gap-2"
				>
					<div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
						{community.logoUrl ? (
							<Image
								src={community.logoUrl}
								alt={community.displayName || community.name}
								fill
								className="object-cover"
								sizes="24px"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-muted-foreground">
								{(community.displayName || community.name).charAt(0)}
							</div>
						)}
					</div>
					<div className="min-w-0">
						<span className="text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
							{community.displayName || community.name}
							{community.isVerified && (
								<CheckCircle2 className="h-3 w-3 text-emerald-500" />
							)}
						</span>
						<div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
							@{community.slug}
						</div>
					</div>
				</Link>
			</td>
			<td className="py-2 pr-4 text-muted-foreground hidden md:table-cell">
				{community.type
					? ORGANIZER_TYPE_LABELS[community.type] || community.type
					: "—"}
			</td>
			<td className="py-2 pr-4 text-muted-foreground hidden lg:table-cell">
				{community.department ? (
					<span className="inline-flex items-center gap-1">
						<MapPin className="h-3 w-3" />
						{community.department}
					</span>
				) : (
					"—"
				)}
			</td>
			<td className="py-2 pr-4 hidden xl:table-cell">
				<div className="flex items-center gap-1.5">
					{community.websiteUrl && (
						<a
							href={community.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<Globe className="h-3.5 w-3.5" />
						</a>
					)}
					{community.twitterUrl && (
						<a
							href={community.twitterUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<TwitterLogo className="h-3.5 w-3.5" />
						</a>
					)}
					{community.linkedinUrl && (
						<a
							href={community.linkedinUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<LinkedinLogo className="h-3.5 w-3.5" mode="currentColor" />
						</a>
					)}
					{community.instagramUrl && (
						<a
							href={community.instagramUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<InstagramLogo className="h-3.5 w-3.5" mode="currentColor" />
						</a>
					)}
					{community.githubUrl && (
						<a
							href={community.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<GithubLogo className="h-3.5 w-3.5" mode="currentColor" />
						</a>
					)}
					{!community.websiteUrl &&
						!community.twitterUrl &&
						!community.linkedinUrl &&
						!community.instagramUrl &&
						!community.githubUrl && (
							<span className="text-muted-foreground/50">—</span>
						)}
				</div>
			</td>
			<td className="py-2 pr-4 hidden sm:table-cell">
				<span
					className={
						community.memberCount > 0
							? "text-foreground"
							: "text-muted-foreground/50"
					}
				>
					{community.memberCount}
				</span>
			</td>
			<td className="py-2 text-right">
				<FollowButton
					communityId={community.id}
					isFollowing={community.isFollowing}
					isAuthenticated={isAuthenticated}
				/>
			</td>
		</tr>
	);
}

function LoadingRows() {
	return (
		<>
			{Array.from({ length: 4 }).map((_, i) => (
				<tr key={i} className="border-b border-border/50 animate-pulse">
					<td className="py-2 pr-4">
						<div className="flex items-center gap-2">
							<div className="h-6 w-6 rounded-full bg-muted" />
							<div className="space-y-1">
								<div className="h-3 w-32 rounded bg-muted" />
								<div className="h-2 w-20 rounded bg-muted" />
							</div>
						</div>
					</td>
					<td className="py-2 pr-4 hidden md:table-cell">
						<div className="h-3 w-16 rounded bg-muted" />
					</td>
					<td className="py-2 pr-4 hidden lg:table-cell">
						<div className="h-3 w-20 rounded bg-muted" />
					</td>
					<td className="py-2 pr-4 hidden xl:table-cell">
						<div className="flex gap-1">
							<div className="h-3.5 w-3.5 rounded bg-muted" />
							<div className="h-3.5 w-3.5 rounded bg-muted" />
						</div>
					</td>
					<td className="py-2 pr-4 hidden sm:table-cell">
						<div className="h-3 w-8 rounded bg-muted" />
					</td>
					<td className="py-2 text-right">
						<div className="h-7 w-16 rounded bg-muted ml-auto" />
					</td>
				</tr>
			))}
		</>
	);
}

export function InfiniteCommunitiesList({
	initialData,
	isAuthenticated,
}: InfiniteCommunitiesListProps) {
	const searchParams = useSearchParams();
	const [sortField, setSortField] = useState<SortField>("members");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const search = searchParams.get("search") || undefined;
	const type = searchParams.get("type") || undefined;
	const verifiedOnly = searchParams.get("verified") === "true";

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
	} = useCommunities({
		search,
		type,
		verifiedOnly,
		initialData,
	});

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const communities = data?.pages.flatMap((page) => page.communities) ?? [];
	// Dedupe communities by ID to avoid React key warnings
	const uniqueCommunities = communities.filter(
		(community, index, self) =>
			index === self.findIndex((c) => c.id === community.id),
	);

	const sortedCommunities = useMemo(() => {
		const result = [...uniqueCommunities];
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
	}, [uniqueCommunities, sortField, sortDirection]);

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

	if (isLoading) {
		return (
			<div className="text-xs">
				<div className="overflow-x-auto">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-border text-left text-muted-foreground">
								<th className="pb-2 pr-4 font-medium">Comunidad</th>
								<th className="pb-2 pr-4 font-medium hidden md:table-cell">
									Tipo
								</th>
								<th className="pb-2 pr-4 font-medium hidden lg:table-cell">
									Ubicación
								</th>
								<th className="pb-2 pr-4 font-medium hidden xl:table-cell">
									Contacto
								</th>
								<th className="pb-2 pr-4 font-medium hidden sm:table-cell">
									Miembros
								</th>
								<th className="pb-2 font-medium text-right">
									<span className="sr-only">Acciones</span>
								</th>
							</tr>
						</thead>
						<tbody>
							<LoadingRows />
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="py-12 text-center text-sm text-muted-foreground">
				Error al cargar las comunidades. Por favor, intenta de nuevo.
			</div>
		);
	}

	if (uniqueCommunities.length === 0) {
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
							<th className="pb-2 pr-4 font-medium hidden lg:table-cell">
								Ubicación
							</th>
							<th className="pb-2 pr-4 font-medium hidden xl:table-cell">
								Contacto
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
						{sortedCommunities.map((community) => (
							<CommunityRow
								key={community.id}
								community={community}
								isAuthenticated={isAuthenticated}
							/>
						))}
						{isFetchingNextPage && <LoadingRows />}
					</tbody>
				</table>
			</div>

			{hasNextPage && (
				<div
					ref={loadMoreRef}
					className="flex justify-center py-8"
					aria-hidden="true"
				>
					{isFetchingNextPage && (
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					)}
				</div>
			)}

			{data && (
				<div className="text-center text-xs text-muted-foreground pt-4">
					Mostrando {uniqueCommunities.length} de {data.pages[0]?.total ?? 0}{" "}
					comunidades
				</div>
			)}
		</div>
	);
}
