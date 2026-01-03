"use client";

import { ROLE_LABELS } from "@/lib/badge/defaults";
import { cn } from "@/lib/utils";

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
			className={cn(
				"relative w-full aspect-[3/4] overflow-hidden rounded-xl",
				className,
			)}
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

			<div className="relative h-full flex flex-col p-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						{communityLogo && (
							<img
								src={communityLogo}
								alt={communityName}
								className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/20"
							/>
						)}
						<span className="text-[11px] font-medium text-white/80 max-w-[100px] truncate">
							{communityName}
						</span>
					</div>
					<div
						className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white"
						style={{
							background: `linear-gradient(135deg, ${primary}, ${secondary})`,
						}}
					>
						{roleLabel}
					</div>
				</div>

				<div className="flex-1 flex items-start justify-center min-h-0 -mt-4">
					<div className="relative w-full h-[115%]">
						<div
							className="absolute -inset-4 blur-2xl opacity-40"
							style={{
								background: `linear-gradient(135deg, ${primary}, ${secondary})`,
							}}
						/>
						<img
							src={generatedImageUrl}
							alt="Badge portrait"
							className="relative w-full h-full object-contain object-top drop-shadow-2xl"
						/>
					</div>
				</div>

				<div className="mt-2 text-center">
					{memberName && (
						<p className="text-sm font-bold text-white mb-0.5">{memberName}</p>
					)}
					<p className="text-[10px] text-white/60 mb-2">
						Badge #{badgeNumber.toString().padStart(4, "0")}
					</p>
					<div className="flex items-center justify-center gap-2">
						<div className="h-px w-6 bg-white/20" />
						<span className="text-[9px] font-mono tracking-wider text-white/40">
							hack0.dev
						</span>
						<div className="h-px w-6 bg-white/20" />
					</div>
				</div>
			</div>
		</div>
	);
}
