import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { CategoryTabs } from "@/components/events/category-tabs";
import { EventList } from "@/components/events/event-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SubscribeForm } from "@/components/subscribe-form";
import {
	getEvents,
	getPlatformStats,
	type EventFilters,
} from "@/lib/actions/events";
import { loadSearchParams } from "@/lib/search-params";

interface HomePageProps {
	searchParams: Promise<SearchParams>;
}

async function EventResults({ filters }: { filters: EventFilters }) {
	const result = await getEvents(filters);
	return (
		<EventList
			events={result.events}
			total={result.total}
			hasMore={result.hasMore}
			filters={filters}
		/>
	);
}

async function HeroContent() {
	const stats = await getPlatformStats();

	const formatPrize = (amount: number) => {
		if (amount >= 1000) {
			return `$${Math.round(amount / 1000)}K+`;
		}
		return `$${amount}`;
	};

	return (
		<div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 pt-10 pb-8 md:pt-14 md:pb-10">
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
				{/* Left - Content */}
				<div className="flex-1 max-w-2xl">
					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-5">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						{stats.activeEvents} eventos activos ahora
					</div>

					<h1 className="text-4xl font-semibold tracking-tight md:text-5xl mb-3">
						Todos los eventos tech de Peru en un solo lugar
					
					</h1>

					<p className="text-base text-muted-foreground mb-6">
						Descubre hackathones, conferencias, bootcamps y olimpiadas.
						Todo en un solo lugar, verificado y actualizado.
					</p>

					{/* Actions */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
						<SubscribeForm />
						<Link
							href="/for-organizers"
							className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm transition-colors hover:bg-muted"
						>
							Soy organizador
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					{/* Quick filters */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs text-muted-foreground">Explorar:</span>
						<a
							href="/?category=competitions"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							Competencias
						</a>
						<a
							href="/?domain=ai"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							IA
						</a>
						<a
							href="/?juniorFriendly=true"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							Principiantes
						</a>
						<a
							href="/?department=Lima"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							Lima
						</a>
					</div>
				</div>

				{/* Right - Stats */}
				<div className="lg:pt-12">
					<div className="grid grid-cols-3 lg:grid-cols-1 gap-6 lg:gap-4 lg:min-w-[140px]">
						<div>
							<p className="text-2xl lg:text-3xl font-semibold tabular-nums">
								{stats.totalEvents}
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
								Eventos
							</p>
						</div>
						<div>
							<p className="text-2xl lg:text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
								{formatPrize(stats.totalPrizePool)}
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
								En premios
							</p>
						</div>
						<div>
							<p className="text-2xl lg:text-3xl font-semibold tabular-nums">
								25+
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
								Comunidades
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function EventResultsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-5 bg-muted rounded w-20 animate-pulse" />
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="hidden lg:grid grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-2.5 border-b border-border bg-muted/30">
					<div className="h-3 bg-muted rounded w-12" />
					<div className="h-3 bg-muted rounded w-10" />
					<div className="h-3 bg-muted rounded w-14" />
					<div className="h-3 bg-muted rounded w-12 ml-auto" />
					<div className="h-3 bg-muted rounded w-16 ml-auto" />
				</div>
				<div className="divide-y divide-border">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-4 animate-pulse"
						>
							<div className="space-y-2">
								<div className="h-4 bg-muted rounded w-3/4" />
								<div className="h-3 bg-muted rounded w-1/2" />
							</div>
							<div className="hidden lg:block h-4 bg-muted rounded w-28" />
							<div className="hidden lg:block h-4 bg-muted rounded w-20" />
							<div className="hidden lg:block h-4 bg-muted rounded w-16 ml-auto" />
							<div className="h-7 bg-muted rounded-full w-24 ml-auto" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default async function HomePage({ searchParams }: HomePageProps) {
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

				<HeroContent />
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
				<Suspense fallback={<EventResultsSkeleton />}>
					<EventResults filters={filters} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
