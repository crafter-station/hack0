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
	timeFilter?: "upcoming" | "all" | "past";
}

function isEventPast(event: EventWithOrg): boolean {
	if (!event.endDate) return false;
	return new Date(event.endDate) < new Date();
}

export function AllEventsTable({
	events,
	hasMore = false,
	filters = {},
	timeFilter = "upcoming",
}: AllEventsTableProps) {
	const categoryConfig = getCategoryById(filters.category || "all");

	if (events.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron eventos
			</div>
		);
	}

	if (timeFilter === "all") {
		const upcomingEvents = events.filter((e) => !isEventPast(e));
		const pastEvents = events.filter((e) => isEventPast(e));

		return (
			<div className="space-y-4">
				{upcomingEvents.length > 0 && (
					<div>
						<div className="px-2 py-1.5 text-xs font-medium text-foreground bg-muted/30 border-b">
							Próximos eventos
						</div>
						<div className="divide-y divide-border">
							{upcomingEvents.map((event) => (
								<EventRowWithChildren
									key={event.id}
									event={event}
									categoryConfig={categoryConfig}
								/>
							))}
						</div>
					</div>
				)}
				{pastEvents.length > 0 && (
					<div>
						<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
							Eventos pasados
						</div>
						<div className="divide-y divide-border">
							{pastEvents.map((event) => (
								<EventRowWithChildren
									key={event.id}
									event={event}
									categoryConfig={categoryConfig}
								/>
							))}
						</div>
					</div>
				)}
				<LoadMoreButton
					filters={filters}
					initialPage={1}
					hasMore={hasMore}
					viewMode="table"
				/>
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
			<LoadMoreButton
				filters={filters}
				initialPage={1}
				hasMore={hasMore}
				viewMode="table"
			/>
		</div>
	);
}
