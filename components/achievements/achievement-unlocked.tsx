"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENT_RARITY_LABELS } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface Achievement {
	id: string;
	name: string;
	description: string;
	rarity: string;
	points: number;
	iconUrl?: string;
}

interface AchievementUnlockedProps {
	achievement: Achievement;
	onClose: () => void;
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

export function AchievementUnlocked({
	achievement,
	onClose,
}: AchievementUnlockedProps) {
	const [isVisible, setIsVisible] = useState(true);
	const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => {
						setIsVisible(false);
						setTimeout(onClose, 500);
					}}
				>
					<motion.div
						initial={{ scale: 0.8, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.8, opacity: 0, y: 20 }}
						transition={{ type: "spring", damping: 20, stiffness: 300 }}
						className={cn(
							"relative bg-background p-6 max-w-sm w-full shadow-xl border",
							colors.border,
						)}
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => {
								setIsVisible(false);
								setTimeout(onClose, 500);
							}}
							className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="h-4 w-4" />
						</button>

						{/* Sparkles animation */}
						<motion.div
							className="absolute -top-3 left-1/2 -translate-x-1/2"
							animate={{
								scale: [1, 1.2, 1],
								rotate: [0, 5, -5, 0],
							}}
							transition={{
								duration: 1.5,
								repeat: Number.POSITIVE_INFINITY,
							}}
						>
							<Sparkles className="h-6 w-6 text-amber-500" />
						</motion.div>

						<div className="text-center pt-3">
							<motion.p
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-3"
							>
								Logro Desbloqueado
							</motion.p>

							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", delay: 0.3, damping: 15 }}
								className={cn(
									"mx-auto w-16 h-16 flex items-center justify-center mb-3",
									colors.bg,
								)}
							>
								{achievement.iconUrl ? (
									<img
										src={achievement.iconUrl}
										alt={achievement.name}
										className="w-10 h-10"
									/>
								) : (
									<Trophy className={cn("w-8 h-8", colors.text)} />
								)}
							</motion.div>

							<motion.h3
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
								className="text-lg font-semibold text-foreground mb-1"
							>
								{achievement.name}
							</motion.h3>

							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								className="text-sm text-muted-foreground mb-3"
							>
								{achievement.description}
							</motion.p>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.6 }}
								className="flex items-center justify-center gap-3"
							>
								<span
									className={cn(
										"px-2 py-0.5 text-[10px] font-medium",
										colors.bg,
										colors.text,
									)}
								>
									{ACHIEVEMENT_RARITY_LABELS[achievement.rarity] ||
										achievement.rarity}
								</span>
								<span className="text-xs text-muted-foreground">
									+{achievement.points} pts
								</span>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.7 }}
								className="mt-4"
							>
								<Button
									onClick={() => {
										setIsVisible(false);
										setTimeout(onClose, 500);
									}}
									className="w-full"
									size="sm"
								>
									Continuar
								</Button>
							</motion.div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
