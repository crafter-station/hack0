"use client";

import {
	CheckCircle2,
	Globe,
	Loader2,
	Mail,
	MapPin,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
	email: string | null;
	country: string | null;
	department: string | null;
	websiteUrl: string | null;
}

interface DiscoverOrganizationCardsProps {
	organizations: PublicCommunity[];
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
			className={`inline-flex items-center justify-center h-6 px-2.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
				optimisticFollowing
					? "bg-muted text-muted-foreground hover:bg-muted/80"
					: "border border-foreground/50 text-foreground bg-transparent hover:bg-foreground hover:text-background"
			}`}
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

export function DiscoverOrganizationCards({
	organizations,
	isAuthenticated,
}: DiscoverOrganizationCardsProps) {
	if (organizations.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron comunidades
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
			{organizations.map((org) => (
				<div
					key={org.id}
					className="group relative flex flex-col rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
				>
					<Link href={`/c/${org.slug}`} className="absolute inset-0 z-0" />

					<div className="flex items-start gap-3 mb-2">
						<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
							{org.logoUrl ? (
								<Image
									src={org.logoUrl}
									alt={org.displayName || org.name}
									fill
									className="object-cover"
									sizes="40px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
									{(org.displayName || org.name).charAt(0)}
								</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="text-sm font-medium text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
								{org.displayName || org.name}
								{org.isVerified && (
									<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
								)}
							</h3>
							<p className="text-[11px] text-muted-foreground">@{org.slug}</p>
						</div>
					</div>

					{org.description && (
						<p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
							{org.description}
						</p>
					)}

					<div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
						{org.department && (
							<span className="inline-flex items-center gap-1">
								<MapPin className="h-3 w-3" />
								{org.department}
							</span>
						)}
						{org.email && (
							<a
								href={`mailto:${org.email}`}
								className="relative z-10 inline-flex items-center gap-1 hover:text-foreground transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								<Mail className="h-3 w-3" />
							</a>
						)}
						{org.websiteUrl && (
							<a
								href={org.websiteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="relative z-10 inline-flex items-center gap-1 hover:text-foreground transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								<Globe className="h-3 w-3" />
							</a>
						)}
					</div>

					<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
						<div className="flex items-center gap-2">
							{org.type && (
								<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
									{ORGANIZER_TYPE_LABELS[org.type] || org.type}
								</span>
							)}
							<span className="inline-flex items-center gap-1">
								<Users className="h-3 w-3" />
								{org.memberCount}
							</span>
						</div>
						<div className="relative z-10">
							<FollowButton
								communityId={org.id}
								isFollowing={org.isFollowing}
								isAuthenticated={isAuthenticated}
							/>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
