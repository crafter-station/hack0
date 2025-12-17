import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { CategoryTabs } from "@/components/events/category-tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
	getEvents,
	type EventFilters,
} from "@/lib/actions/events";
import { loadSearchParams } from "@/lib/search-params";
import { AllEventsTable } from "@/components/events/all-events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import { ViewToggle } from "@/components/events/view-toggle";

interface EventsPageProps {
	searchParams: Promise<SearchParams>;
}

async function EventsContent({ filters, viewMode }: { filters: EventFilters; viewMode: "table" | "calendar" }) {
	const result = await getEvents(filters);

	if (viewMode === "calendar") {
		return <EventsCalendar events={result.events} />;
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

			{/* Category tabs + Search + Filters */}
			<section className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur-md shadow-sm">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-3">
						<Suspense fallback={<div className="h-10 animate-pulse w-64" />}>
							<CategoryTabs />
						</Suspense>
						<div className="flex items-center gap-2">
							<ViewToggle />
							<Suspense fallback={<div className="h-9 animate-pulse w-48" />}>
								<AdvancedFilters />
							</Suspense>
						</div>
					</div>
				</div>
			</section>

			{/* Main content */}
			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<div className="animate-pulse space-y-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="h-20 bg-muted rounded" />
					))}
				</div>}>
					<EventsContent filters={filters} viewMode={viewMode} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}

export const metadata = {
	title: "Todos los Eventos | hack0.dev",
	description: "Explora el calendario completo de eventos tecnológicos en Perú. Hackathones, conferencias, workshops y más.",
};