"use client";

import Link from "next/link";
import type { CommunityBadge } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface BadgeGalleryCardProps {
	badge: CommunityBadge;
	communitySlug: string;
	className?: string;
}

export function BadgeGalleryCard({
	badge,
	communitySlug,
	className,
}: BadgeGalleryCardProps) {
	const badgeNumber = badge.badgeNumber.toString().padStart(4, "0");

	return (
		<Link
			href={`/c/${communitySlug}/comunidad/badge/${badge.shareToken}`}
			className={cn(
				"group relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-muted-foreground/50",
				className,
			)}
		>
			{badge.generatedImageUrl ? (
				<img
					src={badge.generatedImageUrl}
					alt={`Badge #${badgeNumber}`}
					className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			) : (
				<div className="w-full h-full flex items-center justify-center">
					<span className="text-muted-foreground text-sm">No image</span>
				</div>
			)}

			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-8">
				<div className="text-white">
					<p className="font-mono text-xs text-white/70">#{badgeNumber}</p>
				</div>
			</div>

			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
		</Link>
	);
}
