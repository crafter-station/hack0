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
			timeFilter: "upcoming",
			page: 1,
		});
	};

	const handleViewChange = (value: ViewMode) => {
		setFilters({ view: value });
	};

	return (
		<div className="flex items-center gap-2 w-full">
			<div className="relative flex-1 max-w-md">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar eventos..."
					value={search}
					onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
					className="h-9 w-full rounded-md border border-border/50 bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all"
				/>
				{search && (
					<button
						onClick={() => setFilters({ search: "", page: 1 })}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			<EventsFiltersPopover
				open={filtersOpen}
				onOpenChange={setFiltersOpen}
				filters={{
					eventType,
					organizerType,
					skillLevel,
					format,
					domain,
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
