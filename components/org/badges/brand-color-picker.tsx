"use client";

import { Ban } from "lucide-react";
import { useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
	{ color: "#3B82F6", name: "Azul" },
	{ color: "#10B981", name: "Esmeralda" },
	{ color: "#8B5CF6", name: "Violeta" },
	{ color: "#F59E0B", name: "Ámbar" },
	{ color: "#EC4899", name: "Rosa" },
	{ color: "#06B6D4", name: "Cian" },
];

interface BrandColorPickerProps {
	value: string | null;
	onChange: (color: string | null) => void;
	label?: string;
	description?: string;
	disabled?: boolean;
}

export function BrandColorPicker({
	value,
	onChange,
	label = "Color de acento",
	description = "Iluminación y detalles del badge",
	disabled,
}: BrandColorPickerProps) {
	const colorInputRef = useRef<HTMLInputElement>(null);
	const isCustomColor =
		value !== null && !COLOR_PRESETS.some((p) => p.color === value);

	const handlePresetClick = useCallback(
		(color: string | null) => {
			onChange(color);
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
				<button
					type="button"
					onClick={() => handlePresetClick(null)}
					disabled={disabled}
					className={cn(
						"w-8 h-8 rounded-full transition-all duration-150 border border-border bg-background flex items-center justify-center",
						value === null
							? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
							: "hover:scale-105 opacity-80 hover:opacity-100",
						disabled && "opacity-50 cursor-not-allowed",
					)}
					title="Sin color"
				>
					<Ban className="w-4 h-4 text-muted-foreground" />
				</button>
				{COLOR_PRESETS.map((preset) => (
					<button
						key={preset.color}
						type="button"
						onClick={() => handlePresetClick(preset.color)}
						disabled={disabled}
						className={cn(
							"w-8 h-8 rounded-full transition-all duration-150",
							value === preset.color
								? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
								: "hover:scale-105 opacity-80 hover:opacity-100",
							disabled && "opacity-50 cursor-not-allowed",
						)}
						style={{ backgroundColor: preset.color }}
						title={preset.name}
					/>
				))}
				<button
					type="button"
					onClick={() => colorInputRef.current?.click()}
					disabled={disabled}
					className={cn(
						"w-8 h-8 rounded-full transition-all duration-150 border-2 border-dashed border-muted-foreground/50 overflow-hidden relative",
						isCustomColor
							? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 border-solid"
							: "hover:scale-105 hover:border-muted-foreground",
						disabled && "opacity-50 cursor-not-allowed",
					)}
					style={isCustomColor ? { backgroundColor: value } : undefined}
					title="Color personalizado"
				>
					{!isCustomColor && (
						<div className="absolute inset-0 bg-gradient-conic from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500" />
					)}
					<input
						ref={colorInputRef}
						type="color"
						value={value || "#3B82F6"}
						onChange={(e) => onChange(e.target.value)}
						disabled={disabled}
						className="sr-only"
					/>
				</button>
			</div>
		</div>
	);
}
