import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { AllEventsTable } from "@/components/events/all-events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import { EventsCards } from "@/components/events/events-cards";
import { ViewToggle } from "@/components/events/view-toggle";
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
	viewMode: "table" | "cards" | "calendar";
}) {
	const result = await getEvents(filters);

	if (viewMode === "calendar") {
		return <EventsCalendar events={result.events} />;
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
		page: params.page,
	};

	const viewMode = params.view;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-2 py-2">
						<ViewToggle />
						<Suspense fallback={<div className="h-7 animate-pulse w-32" />}>
							<AdvancedFilters />
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
