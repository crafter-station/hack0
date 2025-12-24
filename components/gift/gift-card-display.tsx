"use client";

import type { GiftCardLayoutId } from "@/lib/gift/layouts";
import type { GiftCardStyle } from "@/lib/gift/styles";
import { cn } from "@/lib/utils";

const GIFT_COLORS = {
	bg: "#0a0a0f",
	text: "#fafafa",
	textMuted: "rgba(250, 250, 250, 0.5)",
	textDim: "rgba(250, 250, 250, 0.3)",
	border: "rgba(250, 250, 250, 0.2)",
};

interface GiftCardDisplayProps {
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	message: string;
	recipientName?: string;
	layoutId: GiftCardLayoutId;
	style: GiftCardStyle;
	className?: string;
}

export function GiftCardDisplay({
	generatedImageUrl,
	generatedBackgroundUrl,
	message,
	recipientName,
	className,
}: GiftCardDisplayProps) {
	return (
		<div
			className={cn("relative w-full aspect-[3/4] overflow-hidden", className)}
			style={{ backgroundColor: GIFT_COLORS.bg }}
		>
			{generatedBackgroundUrl && (
				<div className="absolute inset-0">
					<img
						src={generatedBackgroundUrl}
						alt=""
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			<div
				className="absolute inset-0"
				style={{
					background: `linear-gradient(to bottom, transparent 30%, ${GIFT_COLORS.bg}cc 70%, ${GIFT_COLORS.bg} 100%)`,
				}}
			/>

			<div className="relative h-full flex flex-col">
				<div className="flex-1 flex items-center justify-center p-4 pt-6">
					<div className="relative">
						<div className="absolute -inset-3 bg-gradient-to-br from-red-500/40 via-transparent to-emerald-500/40 blur-2xl rounded-full" />
						<div
							className="relative w-72 h-72 rounded-full overflow-hidden shadow-2xl"
							style={{ border: `3px solid ${GIFT_COLORS.border}` }}
						>
							<img
								src={generatedImageUrl}
								alt="Tu retrato navideño"
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
				</div>

				<div className="px-5 pb-5 text-center">
					{recipientName && (
						<p
							className="text-[10px] font-medium tracking-[0.2em] uppercase mb-2"
							style={{ color: GIFT_COLORS.textMuted }}
						>
							Para {recipientName}
						</p>
					)}
					<p
						className="text-sm leading-relaxed font-light"
						style={{ color: "rgba(250, 250, 250, 0.95)" }}
					>
						{message}
					</p>
					<div className="mt-4 flex items-center justify-center gap-2">
						<div
							className="h-px w-8"
							style={{ backgroundColor: GIFT_COLORS.border }}
						/>
						<span
							className="text-[10px] font-mono tracking-wider"
							style={{ color: GIFT_COLORS.textDim }}
						>
							hack0.dev
						</span>
						<div
							className="h-px w-8"
							style={{ backgroundColor: GIFT_COLORS.border }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
