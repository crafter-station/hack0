"use client";

import {
	Calendar,
	Eye,
	LayoutGrid,
	List,
	Map as MapIcon,
	Search,
	X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

const COOKIE_NAME = "hack0-events-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function saveViewPreference(view: ViewMode) {
	document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface OrgEventsToolbarProps {
	initialView?: ViewMode;
}

export function OrgEventsToolbar({
	initialView = "cards",
}: OrgEventsToolbarProps) {
	const [view, setView] = useQueryState("view", {
		defaultValue: initialView,
		shallow: false,
	});
	const [search, setSearch] = useQueryState("search", {
		defaultValue: "",
		shallow: false,
	});

	const handleViewChange = (value: ViewMode) => {
		if (!value) return;
		saveViewPreference(value);
		setView(value);
	};

	return (
		<div className="flex items-center justify-between gap-2 mb-4">
			<div className="relative flex-1 max-w-xs">
				<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar eventos..."
					value={search}
					onChange={(e) => setSearch(e.target.value || null)}
					className="h-7 w-full border border-border/50 bg-background pl-7 pr-7 text-xs placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none transition-colors"
				/>
				{search && (
					<button
						onClick={() => setSearch(null)}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			<ButtonGroup>
				<ToggleGroup
					type="single"
					value={view}
					onValueChange={handleViewChange}
					className="h-7"
				>
					<ToggleGroupItem
						value="cards"
						aria-label="Tarjetas"
						className="h-7 px-2"
					>
						<LayoutGrid className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem
						value="table"
						aria-label="Lista"
						className="h-7 px-2"
					>
						<List className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem
						value="calendar"
						aria-label="Calendario"
						className="h-7 px-2"
					>
						<Calendar className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="map" aria-label="Mapa" className="h-7 px-2">
						<MapIcon className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem
						value="preview"
						aria-label="Vista previa"
						className="h-7 px-2"
					>
						<Eye className="h-3.5 w-3.5" />
					</ToggleGroupItem>
				</ToggleGroup>
			</ButtonGroup>
		</div>
	);
}
