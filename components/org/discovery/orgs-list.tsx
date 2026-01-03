"use client";

import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Globe,
	Loader2,
	Mail,
	MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { GithubLogo } from "@/components/logos/github";
import { InstagramLogo } from "@/components/logos/instagram";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import {
	type CommunitiesResponse,
	type OrderBy,
	type PublicCommunity,
	useCommunities,
} from "@/hooks/use-communities";
import { followCommunity, unfollowCommunity } from "@/lib/actions/communities";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

interface OrgsListProps {
	initialData: CommunitiesResponse;
	isAuthenticated: boolean;
}

type SortColumn = "name" | "contact" | "members";

function getContactCount(community: PublicCommunity): number {
	let count = 0;
	if (community.websiteUrl) count++;
	if (community.email) count++;
	if (community.twitterUrl) count++;
	if (community.linkedinUrl) count++;
	if (community.instagramUrl) count++;
	if (community.githubUrl) count++;
	return count;
}

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
					<span
						className={`tabular-nums min-w-[1ch] ${
							getContactCount(community) > 0
								? "text-foreground"
								: "text-muted-foreground/50"
						}`}
					>
						{getContactCount(community)}
					</span>
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
					{community.email && (
						<a
							href={`mailto:${community.email}`}
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
							title={community.email}
						>
							<Mail className="h-3.5 w-3.5" />
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

function getOrderByFromParams(orderBy: string | null): {
	column: SortColumn | null;
	direction: "asc" | "desc";
} {
	switch (orderBy) {
		case "name":
			return { column: "name", direction: "asc" };
		case "contact":
			return { column: "contact", direction: "desc" };
		case "contact_asc":
			return { column: "contact", direction: "asc" };
		case "popular":
			return { column: "members", direction: "desc" };
		default:
			return { column: null, direction: "desc" };
	}
}

export function OrgsList({ initialData, isAuthenticated }: OrgsListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const search = searchParams.get("search") || undefined;
	const type = searchParams.get("type") || undefined;
	const verifiedOnly = searchParams.get("verified") === "true";
	const orderByParam = (searchParams.get("orderBy") as OrderBy) || "popular";

	const { column: sortColumn, direction: sortDirection } =
		getOrderByFromParams(orderByParam);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		refetch,
	} = useCommunities({
		search,
		type,
		verifiedOnly,
		orderBy: orderByParam,
		initialData: orderByParam === "popular" ? initialData : undefined,
	});

	useEffect(() => {
		if (orderByParam !== "popular") {
			refetch();
		}
	}, [orderByParam, refetch]);

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
	const uniqueCommunities = communities.filter(
		(community, index, self) =>
			index === self.findIndex((c) => c.id === community.id),
	);

	const handleSort = useCallback(
		(column: SortColumn) => {
			const params = new URLSearchParams(searchParams.toString());
			let newOrderBy: OrderBy;

			if (column === "name") {
				newOrderBy = "name";
			} else if (column === "members") {
				newOrderBy = "popular";
			} else if (column === "contact") {
				if (sortColumn === "contact") {
					newOrderBy = sortDirection === "desc" ? "contact_asc" : "contact";
				} else {
					newOrderBy = "contact";
				}
			} else {
				newOrderBy = "popular";
			}

			params.set("orderBy", newOrderBy);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[router, pathname, searchParams, sortColumn, sortDirection],
	);

	const SortIcon = ({ column }: { column: SortColumn }) => {
		if (sortColumn !== column)
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
									Comunidad <SortIcon column="name" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden md:table-cell">
								Tipo
							</th>
							<th className="pb-2 pr-4 font-medium hidden lg:table-cell">
								Ubicación
							</th>
							<th className="pb-2 pr-4 font-medium hidden xl:table-cell">
								<button
									type="button"
									onClick={() => handleSort("contact")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Contacto <SortIcon column="contact" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden sm:table-cell">
								<button
									onClick={() => handleSort("members")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Miembros <SortIcon column="members" />
								</button>
							</th>
							<th className="pb-2 font-medium text-right">
								<span className="sr-only">Acciones</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{uniqueCommunities.map((community) => (
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
