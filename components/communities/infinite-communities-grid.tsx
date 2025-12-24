"use client";

import { CheckCircle2, Globe, Loader2, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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

interface InfiniteCommunitiesGridProps {
	initialData: CommunitiesResponse;
	isAuthenticated: boolean;
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
			className={`inline-flex items-center justify-center h-6 px-2.5 text-[11px] font-medium transition-colors ${
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

function CommunityCard({
	community,
	isAuthenticated,
}: {
	community: PublicCommunity;
	isAuthenticated: boolean;
}) {
	return (
		<div className="group relative flex flex-col border bg-card p-3 transition-colors hover:bg-muted/30">
			<Link href={`/c/${community.slug}`} className="absolute inset-0 z-0" />

			<div className="flex items-start gap-3 mb-2">
				<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
					{community.logoUrl ? (
						<Image
							src={community.logoUrl}
							alt={community.displayName || community.name}
							fill
							className="object-cover"
							sizes="40px"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
							{(community.displayName || community.name).charAt(0)}
						</div>
					)}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-sm font-medium text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
						{community.displayName || community.name}
						{community.isVerified && (
							<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
						)}
					</h3>
					<p className="text-[11px] text-muted-foreground">@{community.slug}</p>
				</div>
			</div>

			{community.description && (
				<p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
					{community.description}
				</p>
			)}

			<div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
				{(community.department || community.country) && (
					<span className="inline-flex items-center gap-1">
						<MapPin className="h-3 w-3" />
						{community.department || community.country}
					</span>
				)}
				<div className="flex items-center gap-1.5">
					{community.websiteUrl && (
						<a
							href={community.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<Globe className="h-3 w-3" />
						</a>
					)}
					{community.twitterUrl && (
						<a
							href={community.twitterUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<TwitterLogo className="h-3 w-3" />
						</a>
					)}
					{community.linkedinUrl && (
						<a
							href={community.linkedinUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<LinkedinLogo className="h-3 w-3" mode="currentColor" />
						</a>
					)}
					{community.instagramUrl && (
						<a
							href={community.instagramUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<InstagramLogo className="h-3 w-3" mode="currentColor" />
						</a>
					)}
					{community.githubUrl && (
						<a
							href={community.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="relative z-10 hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<GithubLogo className="h-3 w-3" mode="currentColor" />
						</a>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
				<div className="flex items-center gap-2">
					{community.type && (
						<span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted">
							{ORGANIZER_TYPE_LABELS[community.type] || community.type}
						</span>
					)}
					<span className="inline-flex items-center gap-1">
						<Users className="h-3 w-3" />
						{community.memberCount}
					</span>
				</div>
				<div className="relative z-10">
					<FollowButton
						communityId={community.id}
						isFollowing={community.isFollowing}
						isAuthenticated={isAuthenticated}
					/>
				</div>
			</div>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<>
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="flex flex-col border bg-card p-3 animate-pulse">
					<div className="flex items-start gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-muted" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-3/4 rounded bg-muted" />
							<div className="h-3 w-1/2 rounded bg-muted" />
						</div>
					</div>
					<div className="space-y-2 mb-2">
						<div className="h-3 w-full rounded bg-muted" />
						<div className="h-3 w-2/3 rounded bg-muted" />
					</div>
					<div className="flex items-center justify-between">
						<div className="h-5 w-20 rounded bg-muted" />
						<div className="h-6 w-16 rounded bg-muted" />
					</div>
				</div>
			))}
		</>
	);
}

export function InfiniteCommunitiesGrid({
	initialData,
	isAuthenticated,
}: InfiniteCommunitiesGridProps) {
	const searchParams = useSearchParams();

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

	// Dedupe communities by ID to avoid React key warnings
	const communities = data?.pages.flatMap((page) => page.communities) ?? [];
	const uniqueCommunities = communities.filter(
		(community, index, self) =>
			index === self.findIndex((c) => c.id === community.id),
	);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
				<LoadingSkeleton />
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
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
				{uniqueCommunities.map((community) => (
					<CommunityCard
						key={community.id}
						community={community}
						isAuthenticated={isAuthenticated}
					/>
				))}

				{isFetchingNextPage && <LoadingSkeleton />}
			</div>

			{/* Invisible trigger for infinite scroll */}
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

			{/* Show total count */}
			{data && (
				<div className="text-center text-xs text-muted-foreground pt-4">
					Mostrando {uniqueCommunities.length} de {data.pages[0]?.total ?? 0}{" "}
					comunidades
				</div>
			)}
		</>
	);
}
