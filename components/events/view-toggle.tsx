"use client";

import { Calendar, Eye, LayoutGrid, List, Map } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

const COOKIE_NAME = "hack0-events-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function saveViewPreference(view: ViewMode) {
	document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function ViewToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentView = (searchParams.get("view") as ViewMode) || "cards";

	const handleValueChange = (value: ViewMode) => {
		if (!value) return;

		saveViewPreference(value);

		const params = new URLSearchParams(searchParams.toString());
		params.set("view", value);
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<ToggleGroup
			type="single"
			value={currentView}
			onValueChange={handleValueChange}
			className="h-7"
		>
			<ToggleGroupItem
				value="preview"
				aria-label="Vista previa"
				className="h-7 px-2.5 gap-1.5"
			>
				<Eye className="h-3.5 w-3.5" />
				<span className="text-xs hidden sm:inline">Preview</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="cards"
				aria-label="Vista de tarjetas"
				className="h-7 px-2.5 gap-1.5"
			>
				<LayoutGrid className="h-3.5 w-3.5" />
				<span className="text-xs hidden sm:inline">Tarjetas</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="table"
				aria-label="Vista de lista"
				className="h-7 px-2.5 gap-1.5"
			>
				<List className="h-3.5 w-3.5" />
				<span className="text-xs hidden sm:inline">Lista</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="calendar"
				aria-label="Vista de calendario"
				className="h-7 px-2.5 gap-1.5"
			>
				<Calendar className="h-3.5 w-3.5" />
				<span className="text-xs hidden sm:inline">Calendario</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="map"
				aria-label="Vista de mapa"
				className="h-7 px-2.5 gap-1.5"
			>
				<Map className="h-3.5 w-3.5" />
				<span className="text-xs hidden sm:inline">Mapa</span>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
