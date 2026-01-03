"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface MemberShowcaseCardProps {
	badgeId: string;
	badgeNumber: number;
	shareToken: string;
	generatedImageUrl: string | null;
	generatedBackgroundUrl: string | null;
	communitySlug: string;
	campaignName?: string | null;
	className?: string;
}

export function MemberShowcaseCard({
	badgeNumber,
	shareToken,
	generatedImageUrl,
	generatedBackgroundUrl,
	communitySlug,
	campaignName,
	className,
}: MemberShowcaseCardProps) {
	const formattedNumber = badgeNumber.toString().padStart(4, "0");

	return (
		<Link
			href={`/c/${communitySlug}/badge/${shareToken}`}
			className={cn(
				"group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-foreground/20",
				className,
			)}
		>
			{generatedBackgroundUrl && (
				<img
					src={generatedBackgroundUrl}
					alt=""
					className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
				/>
			)}

			{generatedImageUrl ? (
				<img
					src={generatedImageUrl}
					alt={`Badge #${formattedNumber}`}
					className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
				/>
			) : (
				<div className="relative z-10 w-full h-full flex items-center justify-center">
					<div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
				</div>
			)}

			<div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-10">
				<div className="flex items-center justify-between">
					<span className="font-mono text-xs text-white/80">
						#{formattedNumber}
					</span>
					{campaignName && (
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 truncate max-w-[60%]">
							{campaignName}
						</span>
					)}
				</div>
			</div>

			<div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
		</Link>
	);
}
