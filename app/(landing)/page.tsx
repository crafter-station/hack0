import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EntityTabs } from "@/components/entity-tabs";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { EventList } from "@/components/events/event-list";
import { OrganizationList } from "@/components/organization-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SubscribeForm } from "@/components/subscribe-form";
import {
	getEvents,
	getPlatformStats,
	type EventFilters,
} from "@/lib/actions/events";
import {
	getPublicOrganizations,
	type OrganizationFilters,
} from "@/lib/actions/organizations";
import { loadSearchParams, type EntityType } from "@/lib/search-params";

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

async function OrganizationResults({ filters }: { filters: OrganizationFilters }) {
	const result = await getPublicOrganizations(filters);
	return (
		<OrganizationList
			organizations={result.organizations}
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
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
			<div className="flex items-start justify-between gap-8">
				<div className="space-y-4 max-w-xl">
					<h1 className="text-2xl font-medium tracking-tight">
						Eventos tech en Perú
					</h1>
					<p className="text-sm text-muted-foreground">
						Hackathones, conferencias, workshops y más. Actualizado diariamente.
					</p>
					<div className="flex items-center gap-3 pt-1">
						<SubscribeForm />
						<Link
							href="/for-organizers"
							className="inline-flex h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Publicar evento
							<ArrowRight className="h-3 w-3" />
						</Link>
					</div>
				</div>

				<div className="hidden md:flex items-center gap-8 text-right">
					<div>
						<p className="text-xl font-medium tabular-nums">{stats.totalEvents}</p>
						<p className="text-[10px] text-muted-foreground uppercase tracking-wider">eventos</p>
					</div>
					<div>
						<p className="text-xl font-medium tabular-nums">{formatPrize(stats.totalPrizePool)}</p>
						<p className="text-[10px] text-muted-foreground uppercase tracking-wider">en premios</p>
					</div>
					{stats.activeEvents > 0 && (
						<div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
							<span className="relative flex h-1.5 w-1.5">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
							</span>
							{stats.activeEvents} activos
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function EventResultsSkeleton() {
	return (
		<div className="space-y-3">
			<div className="h-4 bg-muted rounded w-24 animate-pulse" />
			<div className="space-y-0">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-3 py-2 border-b border-border/50 animate-pulse"
					>
						<div className="h-6 w-6 bg-muted rounded" />
						<div className="flex-1 space-y-1">
							<div className="h-3 bg-muted rounded w-1/2" />
							<div className="h-2 bg-muted rounded w-1/4" />
						</div>
						<div className="hidden md:block h-3 bg-muted rounded w-20" />
						<div className="hidden md:block h-3 bg-muted rounded w-16" />
						<div className="h-3 bg-muted rounded w-12" />
					</div>
				))}
			</div>
		</div>
	);
}

function OrganizationResultsSkeleton() {
	return (
		<div className="space-y-3">
			<div className="h-4 bg-muted rounded w-32 animate-pulse" />
			<div className="space-y-0">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-3 py-2 border-b border-border/50 animate-pulse"
					>
						<div className="h-6 w-6 bg-muted rounded-full" />
						<div className="flex-1 space-y-1">
							<div className="h-3 bg-muted rounded w-1/3" />
							<div className="h-2 bg-muted rounded w-1/5" />
						</div>
						<div className="hidden md:block h-3 bg-muted rounded w-20" />
						<div className="h-3 bg-muted rounded w-8" />
					</div>
				))}
			</div>
		</div>
	);
}

export default async function HomePage({ searchParams }: HomePageProps) {
	const params = await loadSearchParams(searchParams);
	const entity: EntityType = params.entity;

	const eventFilters: EventFilters = {
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

	const orgFilters: OrganizationFilters = {
		search: params.search,
		type: params.organizerType,
		page: params.page,
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			{/* Hero section */}
			<section className="border-b">
				<HeroContent />
			</section>

			{/* Entity tabs + Filters */}
			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-4 py-2">
						<Suspense fallback={<div className="h-7 animate-pulse w-48" />}>
							<EntityTabs />
						</Suspense>
						<Suspense fallback={<div className="h-7 animate-pulse w-32" />}>
							<AdvancedFilters />
						</Suspense>
					</div>
				</div>
			</section>

			{/* Main content */}
			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				{entity === "events" ? (
					<Suspense fallback={<EventResultsSkeleton />}>
						<EventResults filters={eventFilters} />
					</Suspense>
				) : (
					<Suspense fallback={<OrganizationResultsSkeleton />}>
						<OrganizationResults filters={orgFilters} />
					</Suspense>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
