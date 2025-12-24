"use client";

import { Lock, Trophy } from "lucide-react";
import { ACHIEVEMENT_RARITY_LABELS } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
	achievement: {
		id: string;
		name: string;
		description: string;
		iconUrl?: string | null;
		type: string;
		rarity: string | null;
		points: number | null;
	};
	isUnlocked: boolean;
	unlockedAt?: Date | null;
}

const RARITY_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	common: {
		bg: "bg-zinc-500/10",
		border: "border-zinc-500/30",
		text: "text-zinc-500",
	},
	uncommon: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/30",
		text: "text-emerald-500",
	},
	rare: {
		bg: "bg-blue-500/10",
		border: "border-blue-500/30",
		text: "text-blue-500",
	},
	epic: {
		bg: "bg-purple-500/10",
		border: "border-purple-500/30",
		text: "text-purple-500",
	},
	legendary: {
		bg: "bg-amber-500/10",
		border: "border-amber-500/30",
		text: "text-amber-500",
	},
};

export function AchievementCard({
	achievement,
	isUnlocked,
	unlockedAt,
}: AchievementCardProps) {
	const rarity = achievement.rarity || "common";
	const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;

	return (
		<div
			className={cn(
				"relative border p-4 transition-all",
				isUnlocked
					? cn(colors.border, colors.bg)
					: "border-border bg-muted/30 opacity-60",
			)}
		>
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"w-10 h-10 flex items-center justify-center shrink-0",
						isUnlocked ? colors.bg : "bg-muted",
					)}
				>
					{isUnlocked ? (
						achievement.iconUrl ? (
							<img
								src={achievement.iconUrl}
								alt={achievement.name}
								className="w-6 h-6"
							/>
						) : (
							<Trophy className={cn("w-5 h-5", colors.text)} />
						)
					) : (
						<Lock className="w-4 h-4 text-muted-foreground" />
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<h3
							className={cn(
								"text-sm font-medium truncate",
								isUnlocked ? "text-foreground" : "text-muted-foreground",
							)}
						>
							{achievement.name}
						</h3>
					</div>

					<p
						className={cn(
							"text-xs line-clamp-2",
							isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60",
						)}
					>
						{achievement.description}
					</p>

					<div className="flex items-center gap-2 mt-2">
						<span
							className={cn(
								"px-1.5 py-0.5 text-[10px] font-medium",
								isUnlocked
									? cn(colors.bg, colors.text)
									: "bg-muted text-muted-foreground",
							)}
						>
							{ACHIEVEMENT_RARITY_LABELS[rarity] || rarity}
						</span>
						<span className="text-[10px] text-muted-foreground">
							+{achievement.points || 10} pts
						</span>
						{isUnlocked && unlockedAt && (
							<span className="text-[10px] text-muted-foreground">
								{new Date(unlockedAt).toLocaleDateString("es-PE", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
