"use client";

import { Calendar, LayoutGrid, List, Map } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ViewToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentView =
		(searchParams.get("view") as "table" | "cards" | "calendar" | "map") || "cards";

	const handleValueChange = (value: "table" | "cards" | "calendar" | "map") => {
		if (!value) return;

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
				value="cards"
				aria-label="Vista de tarjetas"
				className="h-7 px-2.5 gap-1.5"
			>
				<LayoutGrid className="h-3.5 w-3.5" />
				<span className="text-xs">Tarjetas</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="table"
				aria-label="Vista de lista"
				className="h-7 px-2.5 gap-1.5"
			>
				<List className="h-3.5 w-3.5" />
				<span className="text-xs">Lista</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="calendar"
				aria-label="Vista de calendario"
				className="h-7 px-2.5 gap-1.5"
			>
				<Calendar className="h-3.5 w-3.5" />
				<span className="text-xs">Calendario</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="map"
				aria-label="Vista de mapa"
				className="h-7 px-2.5 gap-1.5"
			>
				<Map className="h-3.5 w-3.5" />
				<span className="text-xs">Mapa</span>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
