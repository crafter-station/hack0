"use client";

import { BadgeCheck, Loader2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followCommunity } from "@/lib/actions/communities";
import type { PublicCommunity } from "@/lib/actions/communities";

const TYPE_LABELS: Record<string, string> = {
	community: "Comunidad",
	university: "Universidad",
	company: "Empresa",
	government: "Gobierno",
	ngo: "ONG",
	accelerator: "Aceleradora",
	media: "Media",
	other: "Otro",
};

interface DiscoverCommunityCardProps {
	community: PublicCommunity;
	isAuthenticated: boolean;
}

export function DiscoverCommunityCard({
	community,
	isAuthenticated,
}: DiscoverCommunityCardProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isFollowing, setIsFollowing] = useState(community.isFollowing);

	const handleFollow = async () => {
		if (!isAuthenticated) {
			router.push(`/sign-in?redirect_url=/c/discover`);
			return;
		}

		startTransition(async () => {
			const result = await followCommunity(community.id);
			if (result.success) {
				setIsFollowing(true);
			}
		});
	};

	return (
		<div className="group relative rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-muted-foreground/30">
			<Link href={`/c/${community.slug}`} className="absolute inset-0 z-0" />

			<div className="relative z-10 flex gap-4">
				<div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
					{community.logoUrl ? (
						<Image
							src={community.logoUrl}
							alt={community.name}
							width={56}
							height={56}
							className="h-full w-full object-cover"
						/>
					) : (
						<span className="text-xl font-bold text-muted-foreground">
							{community.name.charAt(0).toUpperCase()}
						</span>
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-semibold truncate group-hover:text-foreground transition-colors">
							{community.displayName || community.name}
						</h3>
						{community.isVerified && (
							<BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
						)}
					</div>

					{community.type && (
						<p className="text-xs text-muted-foreground mb-2">
							{TYPE_LABELS[community.type] || community.type}
						</p>
					)}

					{community.description && (
						<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
							{community.description}
						</p>
					)}

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<Users className="h-3.5 w-3.5" />
							<span>
								{community.memberCount}{" "}
								{community.memberCount === 1 ? "miembro" : "miembros"}
							</span>
						</div>

						{isFollowing ? (
							<Button
								variant="outline"
								size="sm"
								className="relative z-20 pointer-events-none"
								disabled
							>
								Siguiendo
							</Button>
						) : (
							<Button
								variant="default"
								size="sm"
								onClick={handleFollow}
								disabled={isPending}
								className="relative z-20"
							>
								{isPending ? (
									<>
										<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
										Siguiendo...
									</>
								) : (
									"Seguir"
								)}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
