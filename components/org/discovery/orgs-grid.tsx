"use client";

import { Globe, Loader2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/icons/verified-badge";
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

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

function generateGradient(name: string): { light: string; dark: string } {
	const hash = hashString(name);
	const hue1 = hash % 360;
	const hue2 = (hash * 7) % 360;
	const saturation = 25 + (hash % 15);
	return {
		light: `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, 92%) 0%, hsl(${hue2}, ${saturation}%, 88%) 100%)`,
		dark: `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, 12%) 0%, hsl(${hue2}, ${saturation}%, 16%) 100%)`,
	};
}

interface OrgsGridProps {
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

function CommunityCard({
	community,
	isAuthenticated,
}: {
	community: PublicCommunity;
	isAuthenticated: boolean;
}) {
	const gradients = useMemo(
		() => generateGradient(community.displayName || community.name),
		[community.displayName, community.name],
	);

	return (
		<Link
			href={`/c/${community.slug}`}
			className="group relative flex flex-col border bg-card overflow-hidden transition-colors hover:bg-muted/30"
		>
			<div className="relative aspect-[3/1] w-full overflow-hidden">
				{community.coverUrl ? (
					<Image
						src={community.coverUrl}
						alt={`${community.displayName || community.name} cover`}
						fill
						className="object-cover"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<>
						<div
							className="absolute inset-0 dark:hidden"
							style={{ background: gradients.light }}
						/>
						<div
							className="absolute inset-0 hidden dark:block"
							style={{ background: gradients.dark }}
						/>
					</>
				)}
			</div>

			<div className="relative -mt-5 ml-3 z-10">
				{community.logoUrl ? (
					<div className="relative h-10 w-10 rounded-lg border-2 border-background shadow-md overflow-hidden bg-background">
						<Image
							src={community.logoUrl}
							alt={community.displayName || community.name}
							fill
							className="object-cover"
							sizes="40px"
						/>
					</div>
				) : (
					<div className="h-10 w-10 rounded-lg border-2 border-background shadow-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
						{(community.displayName || community.name).charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			<div className="p-3 pt-2 flex flex-col flex-1">
				<div className="flex items-center gap-1.5 mb-1">
					<h3 className="text-sm font-semibold text-foreground group-hover:underline underline-offset-2 line-clamp-1">
						{community.displayName || community.name}
					</h3>
					{community.isVerified && (
						<VerifiedBadge className="h-4 w-4 text-blue-500 shrink-0" />
					)}
				</div>

				{community.description && (
					<p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
						{community.description}
					</p>
				)}

				<div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
					<div className="flex items-center gap-1.5">
						{community.websiteUrl && (
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(community.websiteUrl!, "_blank");
								}}
								className="hover:text-foreground transition-colors cursor-pointer"
							>
								<Globe className="h-3 w-3" />
							</span>
						)}
						{community.twitterUrl && (
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(community.twitterUrl!, "_blank");
								}}
								className="hover:text-foreground transition-colors cursor-pointer"
							>
								<TwitterLogo className="h-3 w-3" />
							</span>
						)}
						{community.linkedinUrl && (
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(community.linkedinUrl!, "_blank");
								}}
								className="hover:text-foreground transition-colors cursor-pointer"
							>
								<LinkedinLogo className="h-3 w-3" mode="currentColor" />
							</span>
						)}
						{community.instagramUrl && (
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(community.instagramUrl!, "_blank");
								}}
								className="hover:text-foreground transition-colors cursor-pointer"
							>
								<InstagramLogo className="h-3 w-3" mode="currentColor" />
							</span>
						)}
						{community.githubUrl && (
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(community.githubUrl!, "_blank");
								}}
								className="hover:text-foreground transition-colors cursor-pointer"
							>
								<GithubLogo className="h-3 w-3" mode="currentColor" />
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mt-auto">
					<div className="flex items-center gap-2">
						{community.type && (
							<span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted text-[10px]">
								{ORGANIZER_TYPE_LABELS[community.type] || community.type}
							</span>
						)}
						<span className="inline-flex items-center gap-1">
							<Users className="h-3 w-3" />
							{community.memberCount}
						</span>
					</div>
					<div onClick={(e) => e.preventDefault()} className="relative z-10">
						<FollowButton
							communityId={community.id}
							isFollowing={community.isFollowing}
							isAuthenticated={isAuthenticated}
						/>
					</div>
				</div>
			</div>
		</Link>
	);
}

function LoadingSkeleton() {
	return (
		<>
			{Array.from({ length: 4 }).map((_, i) => (
				<div
					key={i}
					className="flex flex-col border bg-card overflow-hidden animate-pulse"
				>
					<div className="aspect-[3/1] w-full bg-muted" />
					<div className="relative -mt-5 ml-3 z-10">
						<div className="h-10 w-10 rounded-lg border-2 border-background bg-muted" />
					</div>
					<div className="p-3 pt-2 space-y-2">
						<div className="h-4 w-3/4 rounded bg-muted" />
						<div className="h-3 w-full rounded bg-muted" />
						<div className="h-3 w-2/3 rounded bg-muted" />
						<div className="flex items-center justify-between pt-1">
							<div className="h-5 w-20 rounded bg-muted" />
							<div className="h-6 w-16 rounded bg-muted" />
						</div>
					</div>
				</div>
			))}
		</>
	);
}

export function OrgsGrid({ initialData, isAuthenticated }: OrgsGridProps) {
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
