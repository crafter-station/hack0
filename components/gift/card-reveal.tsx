"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { GiftCardLayoutId } from "@/lib/gift/layouts";
import type { GiftCardStyle } from "@/lib/gift/styles";
import { GiftActions } from "./gift-actions";
import { GiftBox3D } from "./gift-box-3d";
import { GiftCardDisplay } from "./gift-card-display";

const GIFT_COLORS = {
	bg: "#0a0a0f",
	text: "#fafafa",
	textMuted: "rgba(250, 250, 250, 0.5)",
};

interface CardRevealProps {
	token: string;
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	message: string;
	recipientName?: string;
	layoutId: GiftCardLayoutId;
	style: GiftCardStyle;
}

export function CardReveal({
	token,
	generatedImageUrl,
	generatedBackgroundUrl,
	message,
	recipientName,
	layoutId,
	style,
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
						className="w-full aspect-[3/4] overflow-hidden backface-hidden relative"
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

					{/* Front of card */}
					<div
						className="absolute inset-0 w-full backface-hidden"
						style={{
							backfaceVisibility: "hidden",
							transform: "rotateY(180deg)",
						}}
					>
						<GiftCardDisplay
							generatedImageUrl={generatedImageUrl}
							generatedBackgroundUrl={generatedBackgroundUrl}
							message={message}
							recipientName={recipientName}
							layoutId={layoutId}
							style={style}
						/>
					</div>
				</motion.div>
			</div>

			{/* Hint when not flipped */}
			{!isFlipped && (
				<p className="text-xs" style={{ color: GIFT_COLORS.textMuted }}>
					Toca la tarjeta para revelar tu regalo
				</p>
			)}

			{/* Actions after flip */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{
					opacity: isFlipped ? 1 : 0,
					y: isFlipped ? 0 : 10,
				}}
				transition={{ duration: 0.3, delay: 0.3 }}
				className="w-full"
			>
				{isFlipped && (
					<GiftActions
						token={token}
						generatedImageUrl={generatedImageUrl}
						message={message}
						recipientName={recipientName}
					/>
				)}
			</motion.div>
		</div>
	);
}
