"use client";

import type { EventFilters, EventWithOrg } from "@/lib/actions/events";
import { getCategoryById } from "@/lib/event-categories";
import { EventRowWithChildren } from "./event-row-with-children";
import { LoadMoreButton } from "./load-more-button";

interface AllEventsTableProps {
	events: EventWithOrg[];
	total?: number;
	hasMore?: boolean;
	filters?: EventFilters;
}

export function AllEventsTable({
	events,
	hasMore = false,
	filters = {},
}: AllEventsTableProps) {
	const categoryConfig = getCategoryById(filters.category || "all");

	if (events.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron eventos
			</div>
		);
	}

	return (
		<div className="divide-y divide-border">
			{events.map((event) => (
				<EventRowWithChildren
					key={event.id}
					event={event}
					categoryConfig={categoryConfig}
				/>
			))}
			<LoadMoreButton filters={filters} initialPage={1} hasMore={hasMore} viewMode="table" />
		</div>
	);
}
