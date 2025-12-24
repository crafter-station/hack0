"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PHASES = [
	{ time: 0, message: "Los duendes despiertan", icon: "🧝" },
	{ time: 6, message: "Buscando tu nombre en la lista", icon: "📜" },
	{ time: 12, message: "Pintando tu retrato mágico", icon: "🎨" },
	{ time: 20, message: "Espolvoreando nieve", icon: "❄️" },
	{ time: 28, message: "Decorando el árbol", icon: "🎄" },
	{ time: 36, message: "Escribiendo tu carta", icon: "✉️" },
	{ time: 44, message: "Envolviendo tu regalo", icon: "🎁" },
];

const ESTIMATED_DURATION = 55;

const GIFT_COLORS = {
	text: "#fafafa",
	textMuted: "rgba(250, 250, 250, 0.6)",
	textDim: "rgba(250, 250, 250, 0.3)",
	border: "rgba(250, 250, 250, 0.1)",
	bg: "rgba(250, 250, 250, 0.05)",
};

interface GiftLoadingProps {
	token: string;
}

export function GiftLoading({ token }: GiftLoadingProps) {
	const router = useRouter();
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [isCompleting, setIsCompleting] = useState(false);

	const { data } = useQuery({
		queryKey: ["gift-status", token],
		queryFn: async () => {
			const res = await fetch(`/api/gift/status/${token}`);
			if (!res.ok) throw new Error("Failed to fetch status");
			return res.json();
		},
		refetchInterval: 2000,
	});

	useEffect(() => {
		if (data?.status === "completed") {
			setIsCompleting(true);
			setTimeout(() => {
				router.push(`/gift/card/${token}`);
			}, 600);
		}
	}, [data?.status, router, token]);

	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedSeconds((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const currentPhase = PHASES.reduce((acc, phase, index) => {
		if (elapsedSeconds >= phase.time) return index;
		return acc;
	}, 0);

	const currentMessage = PHASES[currentPhase];
	const showLongWaitMessage = elapsedSeconds >= 30;

	const progress = isCompleting
		? 100
		: Math.min((elapsedSeconds / ESTIMATED_DURATION) * 95, 95);

	if (data?.status === "failed") {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
				<div
					className="p-4"
					style={{
						border: "1px solid rgba(239, 68, 68, 0.2)",
						backgroundColor: "rgba(239, 68, 68, 0.1)",
					}}
				>
					<Gift className="h-10 w-10 text-red-400" />
				</div>
				<div>
					<h2
						className="text-lg font-semibold mb-1"
						style={{ color: GIFT_COLORS.text }}
					>
						¡Oh no! El regalo se perdió
					</h2>
					<p className="text-sm" style={{ color: GIFT_COLORS.textMuted }}>
						Los renos tuvieron un pequeño accidente. Intentemos de nuevo.
					</p>
				</div>
				<Button
					onClick={() => router.push("/gift")}
					variant="outline"
					style={{ borderColor: GIFT_COLORS.border, color: GIFT_COLORS.text }}
				>
					Pedir otro regalo 🎁
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 px-4">
			<motion.div
				className="relative"
				animate={{
					scale: [1, 1.05, 1],
					rotate: [0, 2, -2, 0],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			>
				<div className="absolute -inset-4 bg-gradient-to-br from-red-500/20 via-transparent to-emerald-500/20 blur-2xl" />
				<div
					className="relative p-6 backdrop-blur-sm"
					style={{
						border: `1px solid ${GIFT_COLORS.border}`,
						backgroundColor: GIFT_COLORS.bg,
					}}
				>
					<Gift className="h-12 w-12" style={{ color: GIFT_COLORS.text }} />
				</div>
			</motion.div>

			<div className="text-center space-y-3 min-h-[60px]">
				<div className="h-6 overflow-hidden">
					<AnimatePresence mode="wait">
						<motion.p
							key={currentPhase}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4 }}
							className="text-base font-medium"
							style={{ color: GIFT_COLORS.text }}
						>
							{currentMessage.icon} {currentMessage.message}
						</motion.p>
					</AnimatePresence>
				</div>

				{showLongWaitMessage && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-xs"
						style={{ color: "rgba(250, 250, 250, 0.4)" }}
					>
						Santa está muy ocupado esta noche...
					</motion.p>
				)}
			</div>

			<div className="w-full max-w-[240px] space-y-2">
				<div
					className="h-3 rounded-full overflow-hidden"
					style={{
						backgroundColor: "rgba(250, 250, 250, 0.1)",
						border: "1px solid rgba(250, 250, 250, 0.15)",
					}}
				>
					<motion.div
						className="h-full rounded-full overflow-hidden"
						style={{
							background:
								"repeating-linear-gradient(45deg, #ffffff, #ffffff 8px, #dc2626 8px, #dc2626 16px)",
						}}
						initial={{ width: 0 }}
						animate={{ width: `${progress}%` }}
						transition={{
							duration: isCompleting ? 0.4 : 0.8,
							ease: "easeOut",
						}}
					/>
				</div>
				<div
					className="flex justify-between text-[10px] font-mono"
					style={{ color: GIFT_COLORS.textDim }}
				>
					<span>{Math.round(progress)}%</span>
					<span>~{Math.max(0, ESTIMATED_DURATION - elapsedSeconds)}s</span>
				</div>
			</div>
		</div>
	);
}
