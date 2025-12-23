import { auth } from "@clerk/nextjs/server";
import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CommunityActiveFilters } from "@/components/communities/community-active-filters";
import { CommunityCategoryTabs } from "@/components/communities/community-category-tabs";
import { CommunitySidebarFilters } from "@/components/communities/community-sidebar-filters";
import { CommunityTabToggle } from "@/components/communities/community-tab-toggle";
import { DiscoverOrganizationCards } from "@/components/communities/discover-organization-cards";
import { DiscoverOrganizationList } from "@/components/communities/discover-organization-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	getPublicCommunities,
	getTagCounts,
	getUniqueCountries,
	getUniqueDepartments,
	getUniqueTags,
} from "@/lib/actions/communities";

interface DiscoverPageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		types?: string;
		department?: string;
		countries?: string;
		sizes?: string;
		verification?: string;
		tags?: string;
		verified?: string;
		view?: "cards" | "table";
	}>;
}

export const metadata = {
	title: "Explorar Comunidades | hack0",
	description:
		"Descubre comunidades de tecnología, hackathons y eventos en Perú. Únete a la comunidad tech más activa.",
};

export default async function DiscoverPage({
	searchParams,
}: DiscoverPageProps) {
	const { userId } = await auth();
	const params = await searchParams;

	// Parse multi-value params
	const countriesArray = params.countries?.split(",").filter(Boolean) || [];
	const typesArray = params.types?.split(",").filter(Boolean) || [];
	const sizesArray = params.sizes?.split(",").filter(Boolean) || [];
	const verificationArray =
		params.verification?.split(",").filter(Boolean) || [];
	const tagsArray = params.tags?.split(",").filter(Boolean) || [];

	const [
		communities,
		_departments,
		availableCountries,
		availableTags,
		tagData,
	] = await Promise.all([
		getPublicCommunities({
			search: params.search,
			type: params.type,
			types: typesArray.length > 0 ? typesArray : undefined,
			department: params.department,
			countries: countriesArray.length > 0 ? countriesArray : undefined,
			sizes: sizesArray.length > 0 ? sizesArray : undefined,
			verification:
				verificationArray.length > 0 ? verificationArray : undefined,
			tags: tagsArray.length > 0 ? tagsArray : undefined,
			verifiedOnly: params.verified === "true",
			orderBy: "popular",
		}),
		getUniqueDepartments(),
		getUniqueCountries(),
		getUniqueTags(),
		getTagCounts(),
	]);

	const isAuthenticated = !!userId;
	const viewMode = params.view || "cards";
	const activeTag = tagsArray.length === 1 ? tagsArray[0] : "todas";

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-2 py-2">
						<Suspense
							fallback={
								<div className="h-7 w-40 animate-pulse bg-muted rounded" />
							}
						>
							<CommunityTabToggle />
						</Suspense>
						<div className="flex items-center gap-2">
							<ViewToggle currentView={viewMode} searchParams={params} />
							<Link
								href="/c/new"
								className="inline-flex h-7 items-center gap-1.5 bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
							>
								<Plus className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">Crear</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				<div className="flex gap-6">
					{/* Sidebar filters */}
					<Suspense
						fallback={
							<div className="hidden lg:block w-[220px] h-96 animate-pulse bg-muted rounded" />
						}
					>
						<CommunitySidebarFilters
							defaultSearch={params.search}
							defaultCountries={countriesArray}
							defaultTypes={typesArray}
							defaultSizes={sizesArray}
							defaultVerification={verificationArray}
							defaultTags={tagsArray}
							availableCountries={availableCountries}
							availableTags={availableTags}
						/>
					</Suspense>

					{/* Main content */}
					<div className="flex-1 min-w-0">
						{/* Category tabs */}
						<div className="flex items-center justify-between mb-4">
							<Suspense
								fallback={
									<div className="h-7 w-64 animate-pulse bg-muted rounded" />
								}
							>
								<CommunityCategoryTabs
									activeTab={activeTag}
									tagCounts={tagData.counts}
									totalCount={tagData.total}
								/>
							</Suspense>
						</div>

						{/* Active filters */}
						<Suspense fallback={null}>
							<CommunityActiveFilters totalResults={communities.length} />
						</Suspense>

						{/* Results */}
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
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}

function ViewToggle({
	currentView,
	searchParams,
}: {
	currentView: "cards" | "table";
	searchParams: Record<string, string | undefined>;
}) {
	const createViewUrl = (view: string) => {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(searchParams)) {
			if (value && key !== "view") {
				params.set(key, value);
			}
		}
		params.set("view", view);
		return `?${params.toString()}`;
	};

	return (
		<ButtonGroup>
			<ToggleGroup type="single" value={currentView} className="h-7">
				<ToggleGroupItem
					value="cards"
					aria-label="Tarjetas"
					className="h-7 px-2"
					asChild
				>
					<Link href={createViewUrl("cards")}>
						<LayoutGrid className="h-3.5 w-3.5" />
					</Link>
				</ToggleGroupItem>
				<ToggleGroupItem
					value="table"
					aria-label="Lista"
					className="h-7 px-2"
					asChild
				>
					<Link href={createViewUrl("table")}>
						<List className="h-3.5 w-3.5" />
					</Link>
				</ToggleGroupItem>
			</ToggleGroup>
		</ButtonGroup>
	);
}
