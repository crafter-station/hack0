import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AllEventsTable } from "@/components/events/all-events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import { EventsCards } from "@/components/events/events-cards";
import { EventsMapView } from "@/components/events/events-map-view";
import { EventsTabToggle } from "@/components/events/events-tab-toggle";
import { EventsToolbar } from "@/components/events/events-toolbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { type EventFilters, getEvents } from "@/lib/actions/events";
import { loadSearchParams } from "@/lib/search-params";

interface EventsPageProps {
	searchParams: Promise<SearchParams>;
}

async function EventsContent({
	filters,
	viewMode,
}: {
	filters: EventFilters;
	viewMode: "table" | "cards" | "calendar" | "map";
}) {
	const result = await getEvents(filters);

	if (viewMode === "calendar") {
		return <EventsCalendar events={result.events} />;
	}

	if (viewMode === "map") {
		return (
			<EventsMapView
				events={result.events}
				total={result.total}
				hasMore={result.hasMore}
				filters={filters}
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
			/>
		);
	}

	return (
		<AllEventsTable
			events={result.events}
			total={result.total}
			hasMore={result.hasMore}
			filters={filters}
		/>
	);
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
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
	};

	const viewMode = params.view;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-2 py-2">
						<Suspense fallback={<div className="h-7 w-40 animate-pulse bg-muted rounded" />}>
							<EventsTabToggle />
						</Suspense>
						<Suspense fallback={<div className="h-7 w-48 animate-pulse bg-muted rounded" />}>
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
