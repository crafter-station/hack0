import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { EventsToolbar } from "@/components/events/toolbar";
import {
	AllEventsTable,
	EventsCalendar,
	EventsCards,
	EventsMapView,
	EventsPreviewView,
} from "@/components/events/views";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { type EventFilters, getEvents } from "@/lib/actions/events";
import { loadSearchParams } from "@/lib/search-params";
import { getEventsViewPreference } from "@/lib/view-preferences";

interface EventsPageProps {
	searchParams: Promise<SearchParams>;
}

async function EventsContent({
	filters,
	viewMode,
}: {
	filters: EventFilters;
	viewMode: "table" | "cards" | "calendar" | "map" | "preview";
}) {
	const result = await getEvents(filters);
	const timeFilter = filters.timeFilter || "upcoming";

	if (viewMode === "calendar") {
		return <EventsCalendar events={result.events} timeFilter={timeFilter} />;
	}

	if (viewMode === "map") {
		return (
			<EventsMapView
				events={result.events}
				total={result.total}
				hasMore={result.hasMore}
				filters={filters}
				timeFilter={timeFilter}
			/>
		);
	}

	if (viewMode === "preview") {
		return (
			<EventsPreviewView
				events={result.events}
				total={result.total}
				timeFilter={timeFilter}
			/>
		);
	}

	if (viewMode === "cards") {
		return (
			<EventsCards
				events={result.events}
				total={result.total}
				hasMore={result.hasMore}
				filters={filters}
				timeFilter={timeFilter}
			/>
		);
	}

	return (
		<AllEventsTable
			events={result.events}
			total={result.total}
			hasMore={result.hasMore}
			filters={filters}
			timeFilter={timeFilter}
		/>
	);
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
	const rawParams = await searchParams;
	const params = await loadSearchParams(searchParams);

	const filters: EventFilters = {
		category: params.category,
		search: params.search,
		eventType: params.eventType,
		organizerType: params.organizerType,
		skillLevel: params.skillLevel,
		format: params.format,
		status: params.status,
		domain: params.domain,
		country: params.country,
		department: params.department,
		juniorFriendly: params.juniorFriendly,
		mine: params.mine,
		page: params.page,
		timeFilter: params.timeFilter,
	};

	// Use URL param if explicitly set, otherwise use saved preference
	const hasExplicitView = "view" in rawParams;
	const savedPreference = await getEventsViewPreference();
	const viewMode = hasExplicitView ? params.view : savedPreference;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="py-2">
						<Suspense
							fallback={
								<div className="h-7 w-full animate-pulse bg-muted rounded" />
							}
						>
							<EventsToolbar />
						</Suspense>
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				<Suspense
					fallback={
						<div className="animate-pulse space-y-1">
							{Array.from({ length: 12 }).map((_, i) => (
								<div key={i} className="h-10 bg-muted/30" />
							))}
						</div>
					}
				>
					<EventsContent filters={filters} viewMode={viewMode} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}

export const metadata = {
	title: "Todos los Eventos | hack0.dev",
	description:
		"Explora el calendario completo de eventos tecnológicos en Perú. Hackathones, conferencias, workshops y más.",
};
