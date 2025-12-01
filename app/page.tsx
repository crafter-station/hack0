import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FilterBar } from "@/components/hackathons/filter-bar";
import { HackathonList } from "@/components/hackathons/hackathon-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchCommand } from "@/components/search-command";
import { SubscribeForm } from "@/components/subscribe-form";
import {
	getHackathons,
	getPlatformStats,
	type HackathonFilters,
} from "@/lib/actions/hackathons";
import { loadSearchParams } from "@/lib/search-params";

interface HomePageProps {
	searchParams: Promise<SearchParams>;
}

async function HackathonResults({ filters }: { filters: HackathonFilters }) {
	const result = await getHackathons(filters);
	return (
		<HackathonList
			hackathons={result.hackathons}
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
		<div className="relative mx-auto max-w-screen-2xl px-4 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-12">
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
				{/* Left - Title & Subscribe */}
				<div className="space-y-5">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
							Hackathons y eventos tech
							<span className="text-muted-foreground"> en Perú 🇵🇪</span>
						</h1>
						<p className="text-muted-foreground text-base md:text-lg mt-2">
							Encuentra tu próximo hackathon, conferencia o taller.
						</p>
					</div>

					{/* Subscribe inline */}
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground hidden sm:block">
							Alertas →
						</span>
						<SubscribeForm />
					</div>
				</div>

				{/* Right - Stats & Quick links */}
				<div className="flex flex-col items-start lg:items-end gap-5">
					{/* Stats */}
					<div className="flex items-center gap-6">
						<div className="text-right">
							<p className="text-xl font-semibold tabular-nums">
								{stats.totalEvents}
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Eventos
							</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-right">
							<p className="text-xl font-semibold tabular-nums">
								{formatPrize(stats.totalPrizePool)}
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								En premios
							</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-right">
							<p className="text-xl font-semibold tabular-nums">
								{stats.activeEvents}
							</p>
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Activos
							</p>
						</div>
					</div>

					{/* Quick category links */}
					<div className="flex flex-wrap gap-2">
						<a
							href="/?eventType=hackathon"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							Hackathons
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
							href="/?format=in-person"
							className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						>
							Presencial
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

async function SearchCommandWrapper() {
	const result = await getHackathons({ limit: 50 });
	return <SearchCommand hackathons={result.hackathons} />;
}

function HackathonResultsSkeleton() {
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

	const filters: HackathonFilters = {
		search: params.search,
		eventType: params.eventType,
		organizerType: params.organizerType,
		skillLevel: params.skillLevel,
		format: params.format,
		status: params.status,
		domain: params.domain,
		country: params.country,
		juniorFriendly: params.juniorFriendly,
		page: params.page,
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Search command (Cmd+K) */}
			<Suspense fallback={null}>
				<SearchCommandWrapper />
			</Suspense>

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

			{/* Filter bar */}
			<section className="sticky top-14 z-40 border-b bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
					<Suspense fallback={<div className="h-12 animate-pulse" />}>
						<FilterBar />
					</Suspense>
				</div>
			</section>

			{/* Main content */}
			<main className="mx-auto max-w-screen-2xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<HackathonResultsSkeleton />}>
					<HackathonResults filters={filters} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
