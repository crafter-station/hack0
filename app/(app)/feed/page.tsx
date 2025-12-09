import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PersonalizedFeed } from "@/components/feed/personalized-feed";
import { FollowedCommunitiesSidebar } from "@/components/feed/followed-communities-sidebar";
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
		<PersonalizedFeed
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

	// Check onboarding (skip for god mode)
	const godMode = await isGodMode();
	if (!godMode) {
		const prefs = await getUserPreferences();
		if (!prefs || !prefs.hasCompletedOnboarding) {
			redirect("/onboarding");
		}
	}

	const prefs = await getUserPreferences();

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight mb-2">Tu Feed</h1>
						<p className="text-muted-foreground">
							Eventos personalizados basados en tus preferencias
							{prefs?.department && ` en ${prefs.department}`}
						</p>
					</div>

					{/* Two-column layout */}
					<div className="grid lg:grid-cols-[1fr_320px] gap-8">
						{/* Main content */}
						<div>
							<Suspense fallback={<FeedSkeleton count={5} />}>
								<FeedContent />
							</Suspense>
						</div>

						{/* Sidebar */}
						<aside className="space-y-6">
							<Suspense
								fallback={
									<div className="rounded-lg border bg-card p-6">
										<div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
										<div className="space-y-3">
											{[1, 2, 3].map((i) => (
												<div key={i} className="flex items-center gap-3">
													<div className="h-8 w-8 bg-muted animate-pulse rounded" />
													<div className="h-4 w-32 bg-muted animate-pulse rounded" />
												</div>
											))}
										</div>
									</div>
								}
							>
								<FollowedCommunitiesSidebar />
							</Suspense>

							{/* Preferences summary */}
							{prefs && (
								<div className="rounded-lg border bg-card p-6 space-y-3">
									<h3 className="font-medium text-sm">Tus preferencias</h3>
									<div className="space-y-2 text-sm text-muted-foreground">
										{prefs.department && (
											<div className="flex items-center justify-between">
												<span>Ubicación</span>
												<span className="font-medium text-foreground">
													{prefs.department}
												</span>
											</div>
										)}
										<div className="flex items-center justify-between">
											<span>Formato</span>
											<span className="font-medium text-foreground capitalize">
												{prefs.formatPreference === "any"
													? "Cualquiera"
													: prefs.formatPreference}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span>Nivel</span>
											<span className="font-medium text-foreground capitalize">
												{prefs.skillLevel === "all"
													? "Todos"
													: prefs.skillLevel}
											</span>
										</div>
									</div>
								</div>
							)}
						</aside>
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
