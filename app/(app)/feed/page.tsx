import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { AdvancedFilters } from "@/components/events/advanced-filters";
import { EventsCalendar } from "@/components/events/events-calendar";
import { ViewToggle } from "@/components/events/view-toggle";
import { FeedEventsCards } from "@/components/feed/feed-events-cards";
import { FeedEventsTable } from "@/components/feed/feed-events-table";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { type FeedFilterType, getPersonalizedFeed } from "@/lib/actions/feed";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { isGodMode } from "@/lib/god-mode";
import { loadSearchParams } from "@/lib/search-params";

export const metadata = {
	title: "Feed | hack0.dev",
	description:
		"Eventos personalizados basados en tus preferencias y comunidades",
};

interface FeedPageProps {
	searchParams: Promise<SearchParams>;
}

async function FeedContent({
	category,
	viewMode,
}: {
	category: string;
	viewMode: "table" | "cards" | "calendar";
}) {
	const filter = (category === "all" ? "all" : category) as FeedFilterType;

	const { events, nextCursor, hasMore } = await getPersonalizedFeed({
		limit: 15,
		filter,
	});

	if (viewMode === "calendar") {
		return <EventsCalendar events={events} />;
	}

	if (viewMode === "cards") {
		return (
			<FeedEventsCards
				initialEvents={events}
				initialCursor={nextCursor}
				initialHasMore={hasMore}
				category={category}
			/>
		);
	}

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
					<FeedContent category={params.category} viewMode={params.view} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
