"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { type EventFilters, type EventWithOrg, getEvents } from "@/lib/actions/events";
import { getCategoryById } from "@/lib/event-categories";
import { EventRowWithChildren } from "./event-row-with-children";

interface LoadMoreButtonProps {
	filters: EventFilters;
	initialPage: number;
	hasMore: boolean;
}

export function LoadMoreButton({
	filters,
	initialPage,
	hasMore: initialHasMore,
}: LoadMoreButtonProps) {
	const categoryConfig = getCategoryById(filters.category || "all");
	const [page, setPage] = useState(initialPage);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [additionalEvents, setAdditionalEvents] = useState<EventWithOrg[]>([]);
	const [isPending, startTransition] = useTransition();

	const loadMore = () => {
		startTransition(async () => {
			const nextPage = page + 1;
			const result = await getEvents({ ...filters, page: nextPage });
			setAdditionalEvents((prev) => [...prev, ...result.events]);
			setPage(nextPage);
			setHasMore(result.hasMore);
		});
	};

	return (
		<>
			{/* Additional loaded events */}
			{additionalEvents.length > 0 && (
				<div className="divide-y divide-border border-t border-border">
					{additionalEvents.map((event) => (
						<EventRowWithChildren
							key={event.id}
							event={event}
							categoryConfig={categoryConfig}
						/>
					))}
				</div>
			)}

			{/* Load more button */}
			{hasMore && (
				<div className="flex justify-center pt-4">
					<button
						onClick={loadMore}
						disabled={isPending}
						className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
					>
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Cargando...
							</>
						) : (
							"Cargar más eventos"
						)}
					</button>
				</div>
			)}
		</>
	);
}
