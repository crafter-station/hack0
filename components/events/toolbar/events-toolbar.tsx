"use client";

import { Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { searchParamsParsers } from "@/lib/search-params";
import { EventsFiltersPopover } from "./events-filters-popover";
import { EventsViewSelector } from "./events-view-selector";

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

export function EventsToolbar() {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useQueryStates(searchParamsParsers, {
		shallow: false,
	});

	const {
		search,
		view,
		eventType,
		organizerType,
		skillLevel,
		format,
		domain,
		country,
		department,
		juniorFriendly,
		mine,
		timeFilter,
	} = filters;

	const clearAllFilters = () => {
		setFilters({
			search: "",
			eventType: [],
			organizerType: [],
			skillLevel: [],
			format: [],
			status: [],
			domain: [],
			country: [],
			department: [],
			juniorFriendly: false,
			mine: false,
			timeFilter: "all",
			page: 1,
		});
	};

	const handleViewChange = (value: ViewMode) => {
		setFilters({ view: value });
	};

	return (
		<div className="flex items-center gap-2 w-full">
			<div className="relative w-full max-w-xs">
				<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar eventos..."
					value={search}
					onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
					className="h-7 w-full border border-border/50 bg-background pl-8 pr-8 text-xs placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none transition-colors"
				/>
				{search && (
					<button
						onClick={() => setFilters({ search: "", page: 1 })}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			<div className="flex-1" />

			<EventsFiltersPopover
				open={filtersOpen}
				onOpenChange={setFiltersOpen}
				filters={{
					eventType,
					organizerType,
					skillLevel,
					format,
					domain,
					country,
					department,
					juniorFriendly,
					mine,
					timeFilter,
				}}
				onFiltersChange={(updates) => setFilters(updates)}
				onClearAll={clearAllFilters}
			/>

			<EventsViewSelector value={view} onChange={handleViewChange} />
		</div>
	);
}
