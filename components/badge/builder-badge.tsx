"use client";

import { cn } from "@/lib/utils";

interface BuilderBadgeProps {
	builderId: number;
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	manifestoPhrase: string;
	verticalLabel: string;
	builderName?: string;
	className?: string;
}

export function BuilderBadge({
	builderId,
	generatedImageUrl,
	generatedBackgroundUrl,
	manifestoPhrase,
	verticalLabel,
	builderName,
	className,
}: BuilderBadgeProps) {
	const formattedId = `#${builderId.toString().padStart(4, "0")}`;

	return (
		<div
			className={cn(
				"relative w-full aspect-[4/5] overflow-hidden bg-[#0a0a0f] rounded-lg ring-2 ring-white/50",
				className,
			)}
		>
			{generatedBackgroundUrl && (
				<div className="absolute inset-0">
					<img
						src={generatedBackgroundUrl}
						alt=""
						className="w-full h-full object-cover"
					/>
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, rgba(10, 10, 15, 0.3) 0%, transparent 30%, transparent 70%, rgba(10, 10, 15, 0.5) 100%)",
						}}
					/>
				</div>
			)}

			<svg
				className="absolute top-4 left-4 w-8 h-8 text-white/50"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M2 10 L2 2 L10 2" />
			</svg>
			<svg
				className="absolute top-4 right-4 w-8 h-8 text-white/50"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M22 2 L30 2 L30 10" />
			</svg>
			<svg
				className="absolute bottom-4 left-4 w-8 h-8 text-white/50"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M2 22 L2 30 L10 30" />
			</svg>
			<svg
				className="absolute bottom-4 right-4 w-8 h-8 text-white/50"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M22 30 L30 30 L30 22" />
			</svg>

			<div
				className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 font-mono text-[10px] tracking-[0.4em] font-bold drop-shadow"
				style={{
					writingMode: "vertical-rl",
					textOrientation: "mixed",
					transform: "translateY(-50%) rotate(180deg)",
				}}
			>
				{verticalLabel}
			</div>

			<div className="relative h-full flex flex-col px-6 pt-4 pb-6">
				<div className="flex items-center justify-between mb-2">
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
					<div className="text-right">
						<span className="text-amber-400 font-mono text-lg font-bold drop-shadow-lg">
							{formattedId}
						</span>
					</div>
				</div>

				<div className="flex-1 flex items-center justify-center">
					<div className="w-72 h-72 rounded-2xl overflow-hidden">
						<img
							src={generatedImageUrl}
							alt="Builder portrait"
							className="w-full h-full object-cover"
						/>
					</div>
				</div>

				<div className="mt-auto text-center space-y-2">
					<p className="text-white text-base font-medium leading-snug px-2 drop-shadow-lg">
						"{manifestoPhrase}"
					</p>

					{builderName && (
						<p className="text-white/80 text-xs font-mono tracking-[0.2em] uppercase drop-shadow">
							{builderName}
						</p>
					)}

					<p className="text-amber-400 text-lg !font-christmas drop-shadow">
						❄️ Feliz Navidad 2025 ❄️
					</p>
				</div>
			</div>
		</div>
	);
}
