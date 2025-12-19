import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { CategoryTabs } from "@/components/events/category-tabs";
import { FeedEventsTable } from "@/components/feed/feed-events-table";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { type FeedFilterType, getPersonalizedFeed } from "@/lib/actions/feed";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { isGodMode } from "@/lib/god-mode";
import { loadSearchParams } from "@/lib/search-params";

export const metadata = {
	title: "Tu Feed | hack0.dev",
	description:
		"Eventos personalizados basados en tus preferencias y comunidades",
};

interface FeedPageProps {
	searchParams: Promise<SearchParams>;
}

async function FeedContent({ category }: { category: string }) {
	const filter = (category === "all" ? "all" : category) as FeedFilterType;

	const { events, nextCursor, hasMore } = await getPersonalizedFeed({
		limit: 15,
		filter,
	});

	return (
		<FeedEventsTable
			initialEvents={events}
			initialCursor={nextCursor}
			initialHasMore={hasMore}
			category={category}
		/>
	);
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const godMode = await isGodMode();
	if (!godMode) {
		const prefs = await getUserPreferences();
		if (!prefs || !prefs.hasCompletedOnboarding) {
			redirect("/onboarding");
		}
	}

	const params = await loadSearchParams(searchParams);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

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

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense
					fallback={
						<div className="animate-pulse space-y-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="h-20 bg-muted rounded" />
							))}
						</div>
					}
				>
					<FeedContent category={params.category} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
