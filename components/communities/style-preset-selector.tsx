"use client";

import { Check, Wand2 } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import {
	BADGE_STYLE_PRESETS,
	CUSTOM_STYLE_ID,
} from "@/lib/badge/style-presets";
import { cn } from "@/lib/utils";

interface StylePresetSelectorProps {
	value: string;
	onChange: (styleId: string) => void;
	label?: string;
	description?: string;
}

export function StylePresetSelector({
	value,
	onChange,
	label = "AI Style",
	description = "Choose how member portraits are generated",
}: StylePresetSelectorProps) {
	const presets = BADGE_STYLE_PRESETS.filter((s) => s.id !== CUSTOM_STYLE_ID);
	const customPreset = BADGE_STYLE_PRESETS.find(
		(s) => s.id === CUSTOM_STYLE_ID,
	);

	return (
		<div className="space-y-3">
			{label && (
				<div>
					<Label className="text-sm font-medium">{label}</Label>
					{description && (
						<p className="text-xs text-muted-foreground mt-0.5">
							{description}
						</p>
					)}
				</div>
			)}

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{presets.map((style) => {
					const isSelected = value === style.id;
					const portraitImage = `/badges/styles/${style.id}-portrait.png`;
					const backgroundImage = `/badges/styles/${style.id}-background.png`;

					return (
						<button
							key={style.id}
							type="button"
							onClick={() => onChange(style.id)}
							className={cn(
								"relative rounded-lg border text-left transition-all duration-150 overflow-hidden group",
								isSelected
									? "border-foreground ring-1 ring-foreground"
									: "border-border hover:border-muted-foreground",
							)}
						>
							{isSelected && (
								<div className="absolute top-2 right-2 z-20">
									<div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
										<Check className="w-3 h-3 text-background" />
									</div>
								</div>
							)}

							<div className="aspect-square relative">
								<Image
									src={backgroundImage}
									alt=""
									fill
									className={cn(
										"object-cover transition-all duration-200",
										isSelected
											? "brightness-100"
											: "brightness-75 group-hover:brightness-90",
									)}
								/>
								<div className="absolute inset-x-0 -top-2 bottom-6 flex items-start justify-center">
									<div className="relative w-[95%] h-full">
										<Image
											src={portraitImage}
											alt={style.name}
											fill
											className="object-contain object-top drop-shadow-lg"
										/>
									</div>
								</div>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
							</div>

							<div className="absolute bottom-0 left-0 right-0 p-3">
								<div className="font-medium text-sm text-white">
									{style.name}
								</div>
								<div className="text-xs text-white/70 line-clamp-1">
									{style.description}
								</div>
							</div>
						</button>
					);
				})}

				{customPreset && (
					<button
						type="button"
						onClick={() => onChange(CUSTOM_STYLE_ID)}
						className={cn(
							"relative rounded-lg border text-left transition-all duration-150 overflow-hidden group",
							value === CUSTOM_STYLE_ID
								? "border-foreground ring-1 ring-foreground"
								: "border-border hover:border-muted-foreground border-dashed",
						)}
					>
						{value === CUSTOM_STYLE_ID && (
							<div className="absolute top-2 right-2 z-10">
								<div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
									<Check className="w-3 h-3 text-background" />
								</div>
							</div>
						)}

						<div className="aspect-square relative flex items-center justify-center bg-muted/50">
							<div className="flex flex-col items-center gap-2">
								<div
									className={cn(
										"w-12 h-12 rounded-full flex items-center justify-center transition-colors",
										value === CUSTOM_STYLE_ID
											? "bg-foreground text-background"
											: "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30",
									)}
								>
									<Wand2 className="w-6 h-6" />
								</div>
							</div>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
						</div>

						<div className="absolute bottom-0 left-0 right-0 p-3">
							<div className="font-medium text-sm text-white">
								{customPreset.name}
							</div>
							<div className="text-xs text-white/70 line-clamp-1">
								{customPreset.description}
							</div>
						</div>
					</button>
				)}
			</div>
		</div>
	);
}
