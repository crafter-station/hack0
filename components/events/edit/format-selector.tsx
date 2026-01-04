"use client";

import { MapPin, Monitor, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatSelectorProps {
	value: "virtual" | "in-person" | "hybrid";
	onChange: (value: "virtual" | "in-person" | "hybrid") => void;
}

const formats = [
	{
		value: "in-person" as const,
		label: "Presencial",
		icon: MapPin,
		description: "Ubicación física",
	},
	{
		value: "virtual" as const,
		label: "Virtual",
		icon: Monitor,
		description: "En línea",
	},
	{
		value: "hybrid" as const,
		label: "Híbrido",
		icon: Users,
		description: "Presencial y virtual",
	},
];

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<MapPin className="h-4 w-4" />
				Modalidad
			</div>

			<div className="grid grid-cols-3 gap-3">
				{formats.map((format) => {
					const Icon = format.icon;
					const isSelected = value === format.value;

					return (
						<button
							key={format.value}
							type="button"
							onClick={() => onChange(format.value)}
							className={cn(
								"relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
								"hover:border-primary/50 hover:bg-primary/5",
								isSelected
									? "border-primary bg-primary/5"
									: "border-border bg-card",
							)}
						>
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
									isSelected
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								<Icon className="h-5 w-5" />
							</div>
							<div className="text-center">
								<p
									className={cn(
										"text-sm font-medium",
										isSelected ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{format.label}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{format.description}
								</p>
							</div>

							{isSelected && (
								<div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
