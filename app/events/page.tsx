import { auth } from "@clerk/nextjs/server";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AllEventsTable } from "@/components/events/all-events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import { EventsCards } from "@/components/events/events-cards";
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
	const { userId } = await auth();
	const params = await loadSearchParams(searchParams);

	const personalOrg = userId
		? await (async () => {
				const { getOrCreatePersonalOrg } = await import(
					"@/lib/actions/organizations"
				);
				return await getOrCreatePersonalOrg();
			})()
		: null;

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
						<div className="flex items-center gap-2">
							<Suspense fallback={<div className="h-7 w-48 animate-pulse bg-muted rounded" />}>
								<EventsToolbar />
							</Suspense>
							{personalOrg && (
								<Link
									href={`/c/${personalOrg.slug}/events/new`}
									className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
								>
									<CalendarPlus className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Crear</span>
								</Link>
							)}
						</div>
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
