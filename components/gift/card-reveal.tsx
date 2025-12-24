"use client";

import Atropos from "atropos/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { BadgeRevealContent } from "../badge/badge-reveal-content";
import { GiftActions } from "./gift-actions";
import { GiftBox3D } from "./gift-box-3d";

const GIFT_COLORS = {
	bg: "#0a0a0f",
	text: "#fafafa",
	textMuted: "rgba(250, 250, 250, 0.5)",
};

interface CardRevealProps {
	token: string;
	builderId: number;
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	coverBackgroundUrl?: string;
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
}

export function CardReveal({
	token,
	builderId,
	generatedImageUrl,
	generatedBackgroundUrl,
	coverBackgroundUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
}: CardRevealProps) {
	const [isFlipped, setIsFlipped] = useState(false);
	const [revealComplete, setRevealComplete] = useState(false);

	const handleClick = () => {
		setIsFlipped(!isFlipped);
		if (!isFlipped) {
			setTimeout(() => setRevealComplete(true), 3600);
		}
	};

	return (
		<div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
			{/* Shake animation wrapper - moves everything including Atropos */}
			<motion.div
				className="w-full cursor-pointer"
				animate={{
					rotateZ: isFlipped ? 0 : [0, -2, 2, -1, 1, 0],
				}}
				transition={{
					rotateZ: {
						duration: 0.5,
						repeat: isFlipped ? 0 : Number.POSITIVE_INFINITY,
						repeatDelay: 2,
						ease: "easeInOut",
					},
				}}
				onClick={handleClick}
			>
				<Atropos
					className="w-full"
					activeOffset={40}
					shadowScale={1.05}
					rotateXMax={15}
					rotateYMax={15}
					shadow={true}
					highlight={true}
				>
					<div className="relative w-full perspective-1000">
						<motion.div
							className="relative w-full preserve-3d"
							animate={{
								rotateY: isFlipped ? 180 : 0,
							}}
							transition={{
								rotateY: { duration: 0.6, ease: "easeInOut" },
							}}
							style={{ transformStyle: "preserve-3d" }}
						>
							{/* Back of card - AI background as cover */}
							<div
								className="w-full aspect-[4/5] overflow-hidden backface-hidden relative rounded-lg ring-2 ring-white/50"
								style={{ backfaceVisibility: "hidden" }}
							>
								{coverBackgroundUrl || generatedBackgroundUrl ? (
									<img
										src={coverBackgroundUrl || generatedBackgroundUrl}
										alt="Tu regalo"
										className="w-full h-full object-cover"
										data-atropos-offset="-5"
									/>
								) : (
									<div
										className="w-full h-full"
										style={{ backgroundColor: GIFT_COLORS.bg }}
									/>
								)}
								{/* Overlay with tap hint */}
								<div
									className="absolute inset-0 flex flex-col items-center justify-center"
									style={{ backgroundColor: "rgba(10, 10, 15, 0.2)" }}
								>
									{/* Red ribbon behind text */}
									<div
										className="relative w-full flex items-center justify-center mb-6 -rotate-3"
										data-atropos-offset="2"
									>
										<div
											className="absolute w-[120%] h-20"
											style={{
												background:
													"linear-gradient(90deg, transparent 0%, #b91c1c 10%, #dc2626 50%, #b91c1c 90%, transparent 100%)",
												boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
											}}
										/>
										<h2
											className="!font-christmas text-5xl md:text-6xl relative z-10 drop-shadow-lg"
											style={{ color: GIFT_COLORS.text }}
										>
											Feliz Navidad
										</h2>
									</div>
									<motion.div
										animate={{ scale: [1, 1.05, 1] }}
										transition={{
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
										}}
										className="mb-4 -translate-y-4 -translate-x-4"
										data-atropos-offset="10"
									>
										<GiftBox3D size="lg" />
									</motion.div>
									<p
										className="text-sm font-medium mt-8 px-4 py-2 rounded-full"
										style={{
											color: GIFT_COLORS.text,
											backgroundColor: "rgba(0, 0, 0, 0.6)",
											backdropFilter: "blur(4px)",
										}}
										data-atropos-offset="5"
									>
										Toca para abrir
									</p>
								</div>
							</div>

							{/* Front of card - Badge */}
							<div
								className="absolute inset-0 w-full backface-hidden"
								style={{
									backfaceVisibility: "hidden",
									transform: "rotateY(180deg)",
								}}
							>
								<BadgeRevealContent
									token={token}
									builderId={builderId}
									generatedImageUrl={generatedImageUrl}
									generatedBackgroundUrl={generatedBackgroundUrl}
									manifestoPhrase={manifestoPhrase}
									verticalLabel={verticalLabel}
									builderName={builderName}
									startReveal={isFlipped}
									hideActions={true}
								/>
							</div>
						</motion.div>
					</div>
				</Atropos>
			</motion.div>

			{/* Social actions outside Atropos - always rendered to prevent layout shift */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{
					opacity: revealComplete ? 1 : 0,
					pointerEvents: revealComplete ? "auto" : "none",
				}}
				transition={{ duration: 0.3 }}
				className="w-full"
			>
				<GiftActions
					token={token}
					generatedImageUrl={generatedImageUrl}
					message={manifestoPhrase}
					recipientName={builderName}
					builderId={builderId}
				/>
			</motion.div>
		</div>
	);
}
