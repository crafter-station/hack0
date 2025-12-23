import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Suspense } from "react";
import { CommunityFilters } from "@/components/communities/community-filters";
import { CommunityTabToggle } from "@/components/communities/community-tab-toggle";
import { InfiniteCommunitiesGrid } from "@/components/communities/infinite-communities-grid";
import { InfiniteCommunitiesList } from "@/components/communities/infinite-communities-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { db } from "@/lib/db";
import { communityMembers, organizations } from "@/lib/db/schema";
import { getCommunitiesViewPreference } from "@/lib/view-preferences";
import type { CommunitiesResponse } from "@/hooks/use-communities";

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

const INITIAL_LIMIT = 12;

async function getInitialCommunities(
	params: {
		search?: string;
		type?: string;
		verified?: string;
	},
	userId: string | null
): Promise<CommunitiesResponse> {
	const search = params.search;
	const type = params.type;
	const verifiedOnly = params.verified === "true";

	const conditions = [
		eq(organizations.isPublic, true),
		eq(organizations.isPersonalOrg, false),
	];

	if (search) {
		conditions.push(
			or(
				ilike(organizations.name, `%${search}%`),
				ilike(organizations.displayName, `%${search}%`),
				ilike(organizations.description, `%${search}%`)
			)!
		);
	}

	if (type) {
		conditions.push(eq(organizations.type, type));
	}

	if (verifiedOnly) {
		conditions.push(eq(organizations.isVerified, true));
	}

	const [{ total }] = await db
		.select({ total: count() })
		.from(organizations)
		.where(and(...conditions));

	const memberCountSubquery = db
		.select({
			communityId: communityMembers.communityId,
			memberCount: count().as("member_count"),
		})
		.from(communityMembers)
		.groupBy(communityMembers.communityId)
		.as("member_counts");

	const communities = await db
		.select({
			id: organizations.id,
			slug: organizations.slug,
			name: organizations.name,
			displayName: organizations.displayName,
			description: organizations.description,
			type: organizations.type,
			logoUrl: organizations.logoUrl,
			isVerified: organizations.isVerified,
			memberCount: sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`.as("member_count"),
		})
		.from(organizations)
		.leftJoin(memberCountSubquery, eq(organizations.id, memberCountSubquery.communityId))
		.where(and(...conditions))
		.orderBy(desc(sql`COALESCE(${memberCountSubquery.memberCount}, 0)`))
		.limit(INITIAL_LIMIT)
		.offset(0);

	let userMemberships: Set<string> = new Set();
	if (userId) {
		const memberships = await db.query.communityMembers.findMany({
			where: eq(communityMembers.userId, userId),
			columns: { communityId: true },
		});
		userMemberships = new Set(memberships.map((m) => m.communityId));
	}

	const result = communities.map((c) => ({
		id: c.id,
		slug: c.slug,
		name: c.name,
		displayName: c.displayName,
		description: c.description,
		type: c.type,
		logoUrl: c.logoUrl,
		isVerified: c.isVerified,
		memberCount: Number(c.memberCount),
		isFollowing: userMemberships.has(c.id),
	}));

	return {
		communities: result,
		total,
		limit: INITIAL_LIMIT,
		offset: 0,
		hasMore: INITIAL_LIMIT < total,
	};
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
	const { userId } = await auth();
	const params = await searchParams;

	const initialData = await getInitialCommunities(params, userId);
	const isAuthenticated = !!userId;
	
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
					<Suspense
						fallback={
							<div className="text-xs animate-pulse">
								<div className="space-y-3">
									{Array.from({ length: 12 }).map((_, i) => (
										<div key={i} className="flex items-center gap-4 py-2 border-b border-border/50">
											<div className="h-6 w-6 rounded-full bg-muted" />
											<div className="flex-1 space-y-1">
												<div className="h-3 w-32 rounded bg-muted" />
												<div className="h-2 w-20 rounded bg-muted" />
											</div>
											<div className="h-7 w-16 rounded bg-muted" />
										</div>
									))}
								</div>
							</div>
						}
					>
						<InfiniteCommunitiesList
							initialData={initialData}
							isAuthenticated={isAuthenticated}
						/>
					</Suspense>
				) : (
					<Suspense
						fallback={
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
								{Array.from({ length: 12 }).map((_, i) => (
									<div
										key={i}
										className="flex flex-col border bg-card p-3 animate-pulse"
									>
										<div className="flex items-start gap-3 mb-2">
											<div className="h-10 w-10 rounded-full bg-muted" />
											<div className="flex-1 space-y-2">
												<div className="h-4 w-3/4 rounded bg-muted" />
												<div className="h-3 w-1/2 rounded bg-muted" />
											</div>
										</div>
										<div className="space-y-2 mb-2">
											<div className="h-3 w-full rounded bg-muted" />
											<div className="h-3 w-2/3 rounded bg-muted" />
										</div>
										<div className="flex items-center justify-between">
											<div className="h-5 w-20 rounded bg-muted" />
											<div className="h-6 w-16 rounded bg-muted" />
										</div>
									</div>
								))}
							</div>
						}
					>
						<InfiniteCommunitiesGrid
							initialData={initialData}
							isAuthenticated={isAuthenticated}
						/>
					</Suspense>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
