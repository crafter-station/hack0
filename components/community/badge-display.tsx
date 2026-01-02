"use client";

import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/badge/defaults";

interface BadgeDisplayProps {
	generatedImageUrl: string;
	generatedBackgroundUrl?: string;
	memberName?: string;
	memberRole: string;
	badgeNumber: number;
	communityName: string;
	communityLogo?: string | null;
	primaryColor?: string | null;
	secondaryColor?: string | null;
	className?: string;
}

export function BadgeDisplay({
	generatedImageUrl,
	generatedBackgroundUrl,
	memberName,
	memberRole,
	badgeNumber,
	communityName,
	communityLogo,
	primaryColor,
	secondaryColor,
	className,
}: BadgeDisplayProps) {
	const roleLabel = ROLE_LABELS[memberRole] || memberRole;
	const primary = primaryColor || "#3b82f6";
	const secondary = secondaryColor || "#1d4ed8";

	return (
		<div
			className={cn("relative w-full aspect-[3/4] overflow-hidden rounded-xl", className)}
			style={{ backgroundColor: "#0a0a0f" }}
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
					background: `linear-gradient(to bottom, transparent 20%, rgba(10, 10, 15, 0.7) 60%, rgba(10, 10, 15, 0.95) 100%)`,
				}}
			/>

			<div className="relative h-full flex flex-col">
				<div className="absolute top-4 left-4 right-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{communityLogo && (
							<img
								src={communityLogo}
								alt={communityName}
								className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/20"
							/>
						)}
						<span className="text-xs font-medium text-white/80 max-w-[120px] truncate">
							{communityName}
						</span>
					</div>
					<div
						className="px-2 py-1 rounded-full text-[10px] font-semibold text-white"
						style={{
							background: `linear-gradient(135deg, ${primary}, ${secondary})`,
						}}
					>
						{roleLabel}
					</div>
				</div>

				<div className="flex-1 flex items-center justify-center p-4 pt-16">
					<div className="relative">
						<div
							className="absolute -inset-3 blur-2xl rounded-full opacity-60"
							style={{
								background: `linear-gradient(135deg, ${primary}40, ${secondary}40)`,
							}}
						/>
						<div
							className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-2xl"
							style={{
								border: `3px solid ${primary}`,
							}}
						>
							<img
								src={generatedImageUrl}
								alt="Badge portrait"
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
				</div>

				<div className="px-5 pb-5 text-center">
					{memberName && (
						<p className="text-lg font-bold text-white mb-1">
							{memberName}
						</p>
					)}
					<p className="text-xs text-white/60 mb-3">
						Badge #{badgeNumber.toString().padStart(4, "0")}
					</p>
					<div className="flex items-center justify-center gap-2">
						<div className="h-px w-8 bg-white/20" />
						<span className="text-[10px] font-mono tracking-wider text-white/40">
							hack0.dev
						</span>
						<div className="h-px w-8 bg-white/20" />
					</div>
				</div>
			</div>
		</div>
	);
}
