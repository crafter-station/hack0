import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FilterPills } from "@/components/feed/filter-pills";
import { FeedEventsTable } from "@/components/feed/feed-events-table";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { getPersonalizedFeed } from "@/lib/actions/feed";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { isGodMode } from "@/lib/god-mode";

export const metadata = {
	title: "Tu Feed | hack0.dev",
	description: "Eventos personalizados basados en tus preferencias y comunidades",
};

async function FeedContent() {
	const { events, nextCursor, hasMore } = await getPersonalizedFeed({
		limit: 15,
	});

	return (
		<FeedEventsTable
			initialEvents={events}
			initialCursor={nextCursor}
			initialHasMore={hasMore}
		/>
	);
}

export default async function FeedPage() {
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

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur-md shadow-sm">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="py-3">
						<FilterPills />
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<FeedSkeleton count={8} />}>
					<FeedContent />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
