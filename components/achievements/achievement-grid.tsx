"use client";

import type { Achievement, UserAchievement } from "@/lib/db/schema";
import { AchievementCard } from "./achievement-card";

interface AchievementGridProps {
	achievements: Achievement[];
	userAchievements: UserAchievement[];
}

export function AchievementGrid({
	achievements,
	userAchievements,
}: AchievementGridProps) {
	const userAchievementMap = new Map(
		userAchievements.map((ua) => [ua.achievementId, ua]),
	);

	const unlockedAchievements = achievements.filter((a) =>
		userAchievementMap.has(a.id),
	);
	const lockedAchievements = achievements.filter(
		(a) => !userAchievementMap.has(a.id),
	);

	const totalPoints = unlockedAchievements.reduce(
		(sum, a) => sum + (a.points || 10),
		0,
	);

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-3 gap-3">
				<div className="bg-muted/30 border border-border p-3 text-center">
					<p className="text-2xl font-bold text-foreground font-mono">
						{unlockedAchievements.length}
					</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Desbloqueados
					</p>
				</div>
				<div className="bg-muted/30 border border-border p-3 text-center">
					<p className="text-2xl font-bold text-foreground font-mono">
						{totalPoints}
					</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Puntos
					</p>
				</div>
				<div className="bg-muted/30 border border-border p-3 text-center">
					<p className="text-2xl font-bold text-foreground font-mono">
						{achievements.length}
					</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Total
					</p>
				</div>
			</div>

			{/* Unlocked */}
			{unlockedAchievements.length > 0 && (
				<div>
					<h2 className="text-sm font-medium text-foreground mb-3">
						Logros Desbloqueados
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{unlockedAchievements.map((achievement) => (
							<AchievementCard
								key={achievement.id}
								achievement={achievement}
								isUnlocked={true}
								unlockedAt={userAchievementMap.get(achievement.id)?.unlockedAt}
							/>
						))}
					</div>
				</div>
			)}

			{/* Locked */}
			{lockedAchievements.length > 0 && (
				<div>
					<h2 className="text-sm font-medium text-foreground mb-3">
						Por Desbloquear
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{lockedAchievements
							.filter((a) => !a.isSecret)
							.map((achievement) => (
								<AchievementCard
									key={achievement.id}
									achievement={achievement}
									isUnlocked={false}
								/>
							))}
					</div>
				</div>
			)}
		</div>
	);
}
