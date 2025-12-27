"use client";

import Image from "next/image";
import Link from "next/link";
import type { GiftCard } from "@/lib/db/schema";

interface GalleryCardProps {
	card: GiftCard;
}

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "ahora";
	if (diffMins < 60) return `hace ${diffMins}m`;
	if (diffHours < 24) return `hace ${diffHours}h`;
	if (diffDays < 7) return `hace ${diffDays}d`;
	return date.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function GalleryCard({ card }: GalleryCardProps) {
	const builderId = card.builderId
		? `#${String(card.builderId).padStart(4, "0")}`
		: null;

	return (
		<Link
			href={`/gift/card/${card.shareToken}`}
			className="group relative aspect-[4/5] overflow-hidden border border-white/10 bg-zinc-900 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
		>
			{card.generatedImageUrl ? (
				<Image
					src={card.generatedImageUrl}
					alt={card.recipientName || "Gift card"}
					fill
					className="object-cover transition-transform duration-500 group-hover:scale-105"
					sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
					<span className="text-4xl">🎁</span>
				</div>
			)}

			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

			<div className="absolute bottom-0 left-0 right-0 p-3">
				<div className="flex items-end justify-between gap-2">
					<div className="min-w-0 flex-1">
						{card.recipientName && (
							<p className="text-xs text-white/80 truncate mb-0.5">
								{card.recipientName}
							</p>
						)}
						{builderId && (
							<p className="font-mono text-sm font-medium text-white">
								{builderId}
							</p>
						)}
					</div>
					{card.createdAt && (
						<span className="text-[10px] text-white/50 shrink-0">
							{formatTimeAgo(new Date(card.createdAt))}
						</span>
					)}
				</div>
			</div>

			{card.verticalLabel && (
				<div className="absolute top-3 right-3">
					<span className="text-[9px] font-mono font-medium tracking-wider text-white/60 bg-black/40 px-1.5 py-0.5">
						{card.verticalLabel}
					</span>
				</div>
			)}
		</Link>
	);
}
