"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationInputProps {
	department: string;
	city: string;
	venue: string;
	onDepartmentChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onVenueChange: (value: string) => void;
}

export function LocationInput({
	department,
	city,
	venue,
	onDepartmentChange,
	onCityChange,
	onVenueChange,
}: LocationInputProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<MapPin className="h-4 w-4" />
				Ubicación
			</div>

			<div className="rounded-lg border bg-card p-4 space-y-4 transition-colors has-[:focus]:border-primary/50 has-[:focus]:ring-1 has-[:focus]:ring-primary/20">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="group space-y-2">
						<label
							htmlFor="department"
							className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
						>
							Departamento
						</label>
						<Input
							id="department"
							value={department}
							onChange={(e) => onDepartmentChange(e.target.value)}
							placeholder="Lima, Arequipa..."
							className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
						/>
					</div>

					<div className="group space-y-2">
						<label
							htmlFor="city"
							className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
						>
							Ciudad / Distrito
						</label>
						<Input
							id="city"
							value={city}
							onChange={(e) => onCityChange(e.target.value)}
							placeholder="San Isidro, Miraflores..."
							className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
						/>
					</div>
				</div>

				<div className="group space-y-2">
					<label
						htmlFor="venue"
						className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
					>
						Lugar específico
					</label>
					<Input
						id="venue"
						value={venue}
						onChange={(e) => onVenueChange(e.target.value)}
						placeholder="Universidad del Pacífico, WeWork, Centro Cultural..."
						className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
					/>
				</div>
			</div>
		</div>
	);
}
