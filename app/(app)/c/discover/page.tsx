import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { CommunityFilters } from "@/components/communities/community-filters";
import { CommunityTabToggle } from "@/components/communities/community-tab-toggle";
import { DiscoverOrganizationCards } from "@/components/communities/discover-organization-cards";
import { DiscoverOrganizationList } from "@/components/communities/discover-organization-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicCommunities } from "@/lib/actions/communities";

interface DiscoverPageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		verified?: string;
		view?: "cards" | "table";
	}>;
}

export const metadata = {
	title: "Explorar Comunidades | hack0",
	description:
		"Descubre comunidades de tecnología, hackathons y eventos en Perú. Únete a la comunidad tech más activa.",
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
	const { userId } = await auth();
	const params = await searchParams;

	const communities = await getPublicCommunities({
		search: params.search,
		type: params.type,
		verifiedOnly: params.verified === "true",
		orderBy: "popular",
	});

	const isAuthenticated = !!userId;
	const viewMode = params.view || "cards";

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-2 py-2">
						<Suspense fallback={<div className="h-7 w-40 animate-pulse bg-muted rounded" />}>
							<CommunityTabToggle />
						</Suspense>
						<Suspense fallback={<div className="h-7 w-48 animate-pulse bg-muted rounded" />}>
							<CommunityFilters
								defaultSearch={params.search}
								defaultType={params.type}
								defaultVerified={params.verified === "true"}
								defaultView={viewMode}
							/>
						</Suspense>
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				{viewMode === "table" ? (
					<DiscoverOrganizationList
						organizations={communities}
						isAuthenticated={isAuthenticated}
					/>
				) : (
					<DiscoverOrganizationCards
						organizations={communities}
						isAuthenticated={isAuthenticated}
					/>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
