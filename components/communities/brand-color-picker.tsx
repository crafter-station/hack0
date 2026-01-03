"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_COLOR_PRESETS = [
	{ color: "#3B82F6", name: "Blue" },
	{ color: "#10B981", name: "Emerald" },
	{ color: "#8B5CF6", name: "Violet" },
	{ color: "#F59E0B", name: "Amber" },
	{ color: "#EF4444", name: "Red" },
	{ color: "#EC4899", name: "Pink" },
	{ color: "#06B6D4", name: "Cyan" },
	{ color: "#6366F1", name: "Indigo" },
	{ color: "#F97316", name: "Orange" },
	{ color: "#84CC16", name: "Lime" },
];

interface BrandColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	presets?: typeof DEFAULT_COLOR_PRESETS;
	label?: string;
	description?: string;
}

export function BrandColorPicker({
	value,
	onChange,
	presets = DEFAULT_COLOR_PRESETS,
	label = "Brand Color",
	description = "Used for role badges and accent elements",
}: BrandColorPickerProps) {
	const [customHex, setCustomHex] = useState(value);
	const isCustomColor = !presets.some((p) => p.color === value);

	const handlePresetClick = useCallback(
		(color: string) => {
			onChange(color);
			setCustomHex(color);
		},
		[onChange],
	);

	const handleCustomChange = useCallback(
		(hex: string) => {
			setCustomHex(hex);
			if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
				onChange(hex);
			}
		},
		[onChange],
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

			<div className="flex items-center gap-2 flex-wrap">
				{presets.map((preset) => (
					<button
						key={preset.color}
						type="button"
						onClick={() => handlePresetClick(preset.color)}
						className={cn(
							"w-8 h-8 rounded-full transition-all duration-150",
							value === preset.color
								? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
								: "hover:scale-105 opacity-80 hover:opacity-100",
						)}
						style={{ backgroundColor: preset.color }}
						title={preset.name}
					/>
				))}
			</div>

			<div className="flex items-center gap-3">
				<span className="text-xs text-muted-foreground">Custom</span>
				<div className="flex items-center gap-2">
					<Input
						type="text"
						value={customHex}
						onChange={(e) => handleCustomChange(e.target.value.toUpperCase())}
						placeholder="#3B82F6"
						className={cn(
							"w-24 h-8 font-mono text-xs",
							isCustomColor && "ring-1 ring-foreground",
						)}
						maxLength={7}
					/>
					<div
						className={cn(
							"w-8 h-8 rounded-full border border-border shrink-0 transition-all",
							isCustomColor &&
								"ring-2 ring-foreground ring-offset-2 ring-offset-background",
						)}
						style={{ backgroundColor: value }}
					/>
				</div>
			</div>
		</div>
	);
}
