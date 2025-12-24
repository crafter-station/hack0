"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { GiftActions } from "../gift/gift-actions";

interface BadgeRevealContentProps {
	token: string;
	builderId: number;
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
	startReveal?: boolean;
}

export function BadgeRevealContent({
	token,
	builderId,
	generatedImageUrl,
	generatedBackgroundUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
	startReveal = true,
}: BadgeRevealContentProps) {
	const [stage, setStage] = useState(0);
	const badgeRef = useRef<HTMLDivElement>(null);
	const formattedId = `#${builderId.toString().padStart(4, "0")}`;

	useEffect(() => {
		if (!startReveal) {
			setStage(0);
			return;
		}

		const timers = [
			setTimeout(() => setStage(1), 300),
			setTimeout(() => setStage(2), 800),
			setTimeout(() => setStage(3), 1500),
			setTimeout(() => setStage(4), 2200),
			setTimeout(() => setStage(5), 2800),
			setTimeout(() => setStage(6), 3300),
		];
		return () => timers.forEach(clearTimeout);
	}, [startReveal]);

	return (
		<div className="flex flex-col items-center gap-4 w-full">
			<div
				ref={badgeRef}
				className="relative w-full aspect-[4/5] overflow-hidden bg-[#0a0a0f] rounded-lg ring-2 ring-white/50"
			>
				{generatedBackgroundUrl && (
					<motion.div
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: stage >= 2 ? 1 : 0 }}
						transition={{ duration: 1 }}
					>
						<img
							src={generatedBackgroundUrl}
							alt=""
							className="w-full h-full object-cover"
						/>
						<div
							className="absolute inset-0"
							style={{
								background:
									"linear-gradient(to bottom, rgba(10, 10, 15, 0.85) 0%, rgba(10, 10, 15, 0.4) 15%, transparent 35%, transparent 50%, rgba(10, 10, 15, 0.5) 65%, rgba(10, 10, 15, 0.95) 100%)",
							}}
						/>
					</motion.div>
				)}

				<motion.svg
					className="absolute top-4 left-4 w-8 h-8 text-white/50"
					viewBox="0 0 32 32"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					initial={{ pathLength: 0, opacity: 0 }}
					animate={{
						pathLength: stage >= 1 ? 1 : 0,
						opacity: stage >= 1 ? 1 : 0,
					}}
					transition={{ duration: 0.4 }}
				>
					<motion.path d="M2 10 L2 2 L10 2" />
				</motion.svg>
				<motion.svg
					className="absolute top-4 right-4 w-8 h-8 text-white/50"
					viewBox="0 0 32 32"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					initial={{ opacity: 0 }}
					animate={{ opacity: stage >= 1 ? 1 : 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					<path d="M22 2 L30 2 L30 10" />
				</motion.svg>
				<motion.svg
					className="absolute bottom-4 left-4 w-8 h-8 text-white/50"
					viewBox="0 0 32 32"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					initial={{ opacity: 0 }}
					animate={{ opacity: stage >= 1 ? 1 : 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
				>
					<path d="M2 22 L2 30 L10 30" />
				</motion.svg>
				<motion.svg
					className="absolute bottom-4 right-4 w-8 h-8 text-white/50"
					viewBox="0 0 32 32"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					initial={{ opacity: 0 }}
					animate={{ opacity: stage >= 1 ? 1 : 0 }}
					transition={{ duration: 0.4, delay: 0.3 }}
				>
					<path d="M22 30 L30 30 L30 22" />
				</motion.svg>

				<motion.div
					className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 font-mono text-[10px] tracking-[0.4em] font-bold drop-shadow"
					style={{
						writingMode: "vertical-rl",
						textOrientation: "mixed",
						transform: "translateY(-50%) rotate(180deg)",
					}}
					initial={{ opacity: 0, x: -20 }}
					animate={{
						opacity: stage >= 3 ? 1 : 0,
						x: stage >= 3 ? 0 : -20,
					}}
					transition={{ duration: 0.5 }}
				>
					{verticalLabel}
				</motion.div>

				<div className="relative h-full flex flex-col px-6 pt-4 pb-6">
					<motion.div
						className="flex items-center justify-between mb-2"
						initial={{ opacity: 0, y: -10 }}
						animate={{
							opacity: stage >= 2 ? 1 : 0,
							y: stage >= 2 ? 0 : -10,
						}}
						transition={{ duration: 0.4 }}
					>
						<div>
							<h1 className="text-white font-bold text-lg tracking-tight drop-shadow-lg">
								HACK0.DEV
							</h1>
							<div className="flex items-center gap-2 mt-0.5">
								<div className="h-px w-6 bg-amber-400/70" />
								<span className="text-white/70 text-xs font-mono drop-shadow">
									2025
								</span>
								<div className="h-px w-6 bg-amber-400/70" />
							</div>
						</div>
						<motion.div
							className="text-right"
							initial={{ opacity: 0 }}
							animate={{ opacity: stage >= 2 ? 1 : 0 }}
							transition={{ duration: 0.3, delay: 0.2 }}
						>
							<span className="text-amber-400 font-mono text-lg font-bold drop-shadow-lg">
								{stage >= 2 ? formattedId : "#----"}
							</span>
						</motion.div>
					</motion.div>

					<motion.div
						className="flex-1 flex items-center justify-center"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{
							opacity: stage >= 3 ? 1 : 0,
							scale: stage >= 3 ? 1 : 0.8,
						}}
						transition={{ duration: 0.6, ease: "easeOut" }}
					>
						<div className="w-72 h-72 rounded-2xl overflow-hidden">
							<img
								src={generatedImageUrl}
								alt="Builder portrait"
								className="w-full h-full object-cover"
							/>
						</div>
					</motion.div>

					<div className="mt-auto text-center space-y-2">
						<motion.p
							className="text-white text-base font-medium leading-snug px-2 drop-shadow-lg"
							initial={{ opacity: 0, y: 10 }}
							animate={{
								opacity: stage >= 4 ? 1 : 0,
								y: stage >= 4 ? 0 : 10,
							}}
							transition={{ duration: 0.5 }}
						>
							"{manifestoPhrase}"
						</motion.p>

						{builderName && (
							<motion.p
								className="text-white/80 text-xs font-mono tracking-[0.2em] uppercase drop-shadow"
								initial={{ opacity: 0 }}
								animate={{ opacity: stage >= 5 ? 1 : 0 }}
								transition={{ duration: 0.4 }}
							>
								{builderName}
							</motion.p>
						)}

						<motion.p
							className="text-amber-400 text-lg !font-christmas drop-shadow"
							initial={{ opacity: 0 }}
							animate={{ opacity: stage >= 6 ? 1 : 0 }}
							transition={{ duration: 0.4, delay: 0.2 }}
						>
							❄️ Feliz Navidad 2025 ❄️
						</motion.p>
					</div>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{
					opacity: stage >= 6 ? 1 : 0,
					y: stage >= 6 ? 0 : 10,
				}}
				transition={{ duration: 0.3, delay: 0.5 }}
				className="w-full"
				onClick={(e) => e.stopPropagation()}
			>
				{stage >= 6 && (
					<GiftActions
						token={token}
						generatedImageUrl={generatedImageUrl}
						message={manifestoPhrase}
						recipientName={builderName}
						builderId={builderId}
						badgeRef={badgeRef}
					/>
				)}
			</motion.div>
		</div>
	);
}
