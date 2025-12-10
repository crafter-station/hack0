import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { Calendar, List } from "lucide-react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { CategoryTabs } from "@/components/events/category-tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	getEvents,
	getPlatformStats,
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

async function EventsHeader({ stats }: { stats: Awaited<ReturnType<typeof getPlatformStats>> }) {
	const formatPrize = (amount: number) => {
		if (amount >= 1000) {
			return `$${Math.round(amount / 1000)}K+`;
		}
		return `$${amount}`;
	};

	return (
		<div className="space-y-6">
			<h1 className="text-4xl font-semibold tracking-tight md:text-5xl mb-3">
				Todos los Eventos Tech
			</h1>

			<p className="text-base text-muted-foreground mb-6">
				Explora el calendario completo de eventos tecnológicos en Perú.
				Hackathones, conferencias, workshops y más en un solo lugar.
			</p>

			{/* Quick stats */}
			<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
				<span>{stats.totalEvents} eventos</span>
				<span>•</span>
				<span>{formatPrize(stats.totalPrizePool)} en premios</span>
				<span>•</span>
				<span>25+ comunidades</span>
			</div>
		</div>
	);
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
	const params = await loadSearchParams(searchParams);
	const stats = await getPlatformStats();

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

	// Default to table view, allow URL param to override
	const viewMode: "table" | "calendar" = (params.view as "table" | "calendar") || "table";

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			{/* Hero section */}
			<section className="relative border-b overflow-hidden">
				{/* Subtle grid background */}
				<div
					className="absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
						backgroundSize: "48px 48px",
					}}
				/>

				<div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 pt-10 pb-8 md:pt-14 md:pb-10">
					<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
						{/* Left - Content */}
						<div className="flex-1 max-w-2xl">
							<EventsHeader stats={stats} />
						</div>

						{/* Right - View Mode Toggle */}
						<div className="lg:pt-12">
							<ViewToggle />
						</div>
					</div>
				</div>
			</section>

			{/* Category tabs + Search + Filters */}
			<section className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur-md shadow-sm">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-3">
						<Suspense fallback={<div className="h-10 animate-pulse w-64" />}>
							<CategoryTabs />
						</Suspense>
						<Suspense fallback={<div className="h-9 animate-pulse w-48" />}>
							<AdvancedFilters />
						</Suspense>
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