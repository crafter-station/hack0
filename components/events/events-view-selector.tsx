"use client";

import { Calendar, Eye, LayoutGrid, List, Map as MapIcon } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

const COOKIE_NAME = "hack0-events-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function saveViewPreference(view: ViewMode) {
	document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

const VIEW_OPTIONS: {
	value: ViewMode;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ value: "cards", label: "Cards", icon: LayoutGrid },
	{ value: "table", label: "Tabla", icon: List },
	{ value: "calendar", label: "Calendario", icon: Calendar },
	{ value: "map", label: "Mapa", icon: MapIcon },
	{ value: "preview", label: "Preview", icon: Eye },
];

interface EventsViewSelectorProps {
	value: ViewMode;
	onChange: (value: ViewMode) => void;
}

export function EventsViewSelector({
	value,
	onChange,
}: EventsViewSelectorProps) {
	const selectedOption = VIEW_OPTIONS.find((opt) => opt.value === value);
	const Icon = selectedOption?.icon || LayoutGrid;

	const handleChange = (newValue: string) => {
		const viewValue = newValue as ViewMode;
		saveViewPreference(viewValue);
		onChange(viewValue);
	};

	return (
		<Select value={value} onValueChange={handleChange}>
			<SelectTrigger className="h-7 w-[100px] text-xs border-border/50 gap-1.5">
				<Icon className="h-3.5 w-3.5 shrink-0" />
				<span>{selectedOption?.label}</span>
			</SelectTrigger>
			<SelectContent align="end">
				{VIEW_OPTIONS.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						className="text-xs"
					>
						<div className="flex items-center gap-2">
							<option.icon className="h-3.5 w-3.5" />
							{option.label}
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
