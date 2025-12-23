import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CommunityFilters } from "@/components/communities/community-filters";
import { CommunityTabToggle } from "@/components/communities/community-tab-toggle";
import { MyOrganizationCards } from "@/components/communities/my-organization-cards";
import { MyOrganizationList } from "@/components/communities/my-organization-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getAllUserOrganizations } from "@/lib/actions/organizations";
import { getCommunitiesViewPreference } from "@/lib/view-preferences";

interface CommunitiesPageProps {
	searchParams: Promise<{
		search?: string;
		role?: string;
		view?: "cards" | "table";
	}>;
}

export const metadata = {
	title: "Mis Comunidades | hack0",
	description: "Administra tus comunidades",
};

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in?redirect_url=/c");
	}

	const params = await searchParams;
	const allOrganizations = await getAllUserOrganizations();

	let organizations = allOrganizations;

	if (params.search) {
		const query = params.search.toLowerCase();
		organizations = organizations.filter(({ organization }) => {
			const name = (organization.displayName || organization.name).toLowerCase();
			const slug = organization.slug.toLowerCase();
			return name.includes(query) || slug.includes(query);
		});
	}

	if (params.role && params.role !== "all") {
		organizations = organizations.filter(({ role }) => role === params.role);
	}

	// Use URL param if explicitly set, otherwise use saved preference
	const hasExplicitView = "view" in params;
	const savedPreference = await getCommunitiesViewPreference();
	const viewMode = hasExplicitView && params.view ? params.view : savedPreference;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-2 py-2">
						<Suspense fallback={<div className="h-7 w-40 animate-pulse bg-muted rounded" />}>
							<CommunityTabToggle />
						</Suspense>
						<div className="flex items-center gap-2">
							<Suspense fallback={<div className="h-7 w-48 animate-pulse bg-muted rounded" />}>
								<CommunityFilters
									defaultSearch={params.search}
									defaultRole={params.role}
									defaultView={viewMode}
									showRoleFilter
								/>
							</Suspense>
							<Button variant="secondary" size="sm" className="h-7 text-xs" asChild>
								<Link href="/c/new">
									<Plus className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Nueva</span>
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				{viewMode === "table" ? (
					<MyOrganizationList organizations={organizations} />
				) : (
					<MyOrganizationCards organizations={organizations} />
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
