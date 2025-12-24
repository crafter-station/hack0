"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BadgeRevealContent } from "../badge/badge-reveal-content";
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
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
}

export function CardReveal({
	token,
	builderId,
	generatedImageUrl,
	generatedBackgroundUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
}: CardRevealProps) {
	const [isFlipped, setIsFlipped] = useState(false);

	return (
		<div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
			<div
				className="relative w-full perspective-1000 cursor-pointer"
				onClick={() => setIsFlipped(!isFlipped)}
			>
				<motion.div
					className="relative w-full preserve-3d"
					animate={{
						rotateY: isFlipped ? 180 : 0,
						rotateZ: isFlipped ? 0 : [0, -2, 2, -1, 1, 0],
					}}
					transition={{
						rotateY: { duration: 0.6, ease: "easeInOut" },
						rotateZ: {
							duration: 0.5,
							repeat: isFlipped ? 0 : Number.POSITIVE_INFINITY,
							repeatDelay: 2,
							ease: "easeInOut",
						},
					}}
					style={{ transformStyle: "preserve-3d" }}
				>
					{/* Back of card - AI background as cover */}
					<div
						className="w-full aspect-[4/5] overflow-hidden backface-hidden relative rounded-lg ring-2 ring-white/50"
						style={{ backfaceVisibility: "hidden" }}
					>
						{generatedBackgroundUrl ? (
							<img
								src={generatedBackgroundUrl}
								alt="Tu regalo"
								className="w-full h-full object-cover"
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
							style={{ backgroundColor: "rgba(10, 10, 15, 0.3)" }}
						>
							<h2
								className="!font-christmas text-5xl md:text-6xl mb-6"
								style={{ color: GIFT_COLORS.text }}
							>
								Feliz Navidad
							</h2>
							<motion.div
								animate={{ scale: [1, 1.05, 1] }}
								transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
								className="mb-4"
							>
								<GiftBox3D size="lg" />
							</motion.div>
							<p
								className="text-sm font-medium mt-8"
								style={{ color: GIFT_COLORS.text }}
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
						/>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
