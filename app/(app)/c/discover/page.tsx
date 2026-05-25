import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { ArrowRight, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
	OrgActiveFilters,
	OrgSidebarFilters,
	OrgsGrid,
	OrgsList,
	OrgTabToggle,
} from "@/components/org/discovery";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CommunitiesResponse } from "@/hooks/use-communities";
import {
	getUniqueCountries,
	getUniqueDepartments,
	getUniqueTags,
} from "@/lib/actions/communities";
import { normalizeCommunityDirectoryFilters } from "@/lib/community-directory-filters";
import { getCommunityDirectoryConditions } from "@/lib/community-directory-query";
import { db } from "@/lib/db";
import { communityMembers, organizations } from "@/lib/db/schema";
import {
	getLatamCountryCoverage,
	type LatamCountryCoverage,
} from "@/lib/latam-country-coverage";
import { getCommunitiesViewPreference } from "@/lib/view-preferences";

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
		"Descubre comunidades de tecnología, hackathons y eventos en LATAM. Únete al mapa regional de builders.",
};

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 12;

async function getInitialCommunities(
	params: {
		search?: string;
		type?: string;
		types?: string;
		countries?: string;
		sizes?: string;
		verification?: string;
		tags?: string;
		verified?: string;
	},
	userId: string | null,
): Promise<CommunitiesResponse> {
	const filters = normalizeCommunityDirectoryFilters(params);

	const memberCountSubquery = db
		.select({
			communityId: communityMembers.communityId,
			memberCount: count().as("member_count"),
		})
		.from(communityMembers)
		.groupBy(communityMembers.communityId)
		.as("member_counts");
	const memberCountSql = sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`;

	const conditions = getCommunityDirectoryConditions(filters, memberCountSql);

	const [{ total }] = await db
		.select({ total: count() })
		.from(organizations)
		.leftJoin(
			memberCountSubquery,
			eq(organizations.id, memberCountSubquery.communityId),
		)
		.where(and(...conditions));

	const communities = await db
		.select({
			id: organizations.id,
			slug: organizations.slug,
			name: organizations.name,
			displayName: organizations.displayName,
			description: organizations.description,
			type: organizations.type,
			logoUrl: organizations.logoUrl,
			coverUrl: organizations.coverUrl,
			isVerified: organizations.isVerified,
			memberCount: memberCountSql.as("member_count"),
			email: organizations.email,
			country: organizations.country,
			department: organizations.department,
			websiteUrl: organizations.websiteUrl,
			twitterUrl: organizations.twitterUrl,
			linkedinUrl: organizations.linkedinUrl,
			instagramUrl: organizations.instagramUrl,
			githubUrl: organizations.githubUrl,
		})
		.from(organizations)
		.leftJoin(
			memberCountSubquery,
			eq(organizations.id, memberCountSubquery.communityId),
		)
		.where(and(...conditions))
		.orderBy(desc(memberCountSql))
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
		coverUrl: c.coverUrl,
		isVerified: c.isVerified,
		memberCount: Number(c.memberCount),
		isFollowing: userMemberships.has(c.id),
		email: c.email,
		country: c.country,
		department: c.department,
		websiteUrl: c.websiteUrl,
		twitterUrl: c.twitterUrl,
		linkedinUrl: c.linkedinUrl,
		instagramUrl: c.instagramUrl,
		githubUrl: c.githubUrl,
	}));

	return {
		communities: result,
		total,
		limit: INITIAL_LIMIT,
		offset: 0,
		hasMore: INITIAL_LIMIT < total,
	};
}

export default async function DiscoverPage({
	searchParams,
}: DiscoverPageProps) {
	const { userId } = await auth();
	const params = await searchParams;

	const normalizedFilters = normalizeCommunityDirectoryFilters(params);

	const [
		initialData,
		_departments,
		availableCountries,
		availableTags,
		countryCoverage,
	] = await Promise.all([
		getInitialCommunities(params, userId),
		getUniqueDepartments(),
		getUniqueCountries(),
		getUniqueTags(),
		getLatamCountryCoverage(),
	]);

	const isAuthenticated = !!userId;

	const hasExplicitView = "view" in params;
	const savedPreference = await getCommunitiesViewPreference();
	const viewMode =
		hasExplicitView && params.view ? params.view : savedPreference;

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
							<OrgTabToggle />
						</Suspense>
						<ViewToggle currentView={viewMode} searchParams={params} />
					</div>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				<CountryCommunityOverview
					countryCoverage={countryCoverage}
					selectedCountries={normalizedFilters.countries}
				/>

				<div className="flex gap-6">
					<Suspense
						fallback={
							<div className="hidden lg:block w-[220px] h-96 animate-pulse bg-muted rounded" />
						}
					>
						<OrgSidebarFilters
							defaultSearch={params.search}
							defaultCountries={normalizedFilters.countries}
							defaultTypes={normalizedFilters.types}
							defaultSizes={normalizedFilters.sizes}
							defaultVerification={normalizedFilters.verification}
							defaultTags={normalizedFilters.tags}
							availableCountries={availableCountries}
							availableTags={availableTags}
						/>
					</Suspense>

					<div className="flex-1 min-w-0">
						<Suspense fallback={null}>
							<OrgActiveFilters totalResults={initialData.total} />
						</Suspense>

						{viewMode === "table" ? (
							<Suspense
								fallback={
									<div className="text-xs animate-pulse">
										<div className="space-y-3">
											{Array.from({ length: 12 }).map((_, i) => (
												<div
													key={i}
													className="flex items-center gap-4 py-2 border-b border-border/50"
												>
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
								<OrgsList
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
												className="flex flex-col border bg-card overflow-hidden animate-pulse"
											>
												<div className="aspect-[3/1] w-full bg-muted" />
												<div className="relative -mt-5 ml-3 z-10">
													<div className="h-10 w-10 rounded-lg border-2 border-background bg-muted" />
												</div>
												<div className="p-3 pt-2 space-y-2">
													<div className="h-4 w-3/4 rounded bg-muted" />
													<div className="h-3 w-full rounded bg-muted" />
													<div className="h-3 w-2/3 rounded bg-muted" />
													<div className="flex items-center justify-between pt-1">
														<div className="h-5 w-20 rounded bg-muted" />
														<div className="h-6 w-16 rounded bg-muted" />
													</div>
												</div>
											</div>
										))}
									</div>
								}
							>
								<OrgsGrid
									initialData={initialData}
									isAuthenticated={isAuthenticated}
								/>
							</Suspense>
						)}
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("es-PE").format(value);
}

function formatEntityCount(value: number, singular: string, plural: string) {
	return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function CountryCommunityOverview({
	countryCoverage,
	selectedCountries,
}: {
	countryCoverage: LatamCountryCoverage[];
	selectedCountries: string[];
}) {
	const activeCountries = countryCoverage.filter(
		(country) => country.communities > 0,
	);
	const totalCommunities = countryCoverage.reduce(
		(total, country) => total + country.communities,
		0,
	);
	const totalEvents = countryCoverage.reduce(
		(total, country) => total + country.events,
		0,
	);
	const maxCommunities = Math.max(
		1,
		...countryCoverage.map((country) => country.communities),
	);

	return (
		<section className="mb-6 border-b pb-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-2xl">
					<div className="mb-3 h-2.5 w-12 bg-brand-green" />
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Índice público de comunidades
					</h1>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						Overview regional para ver qué países ya tienen comunidades mapeadas
						y dónde falta activar señal local.
					</p>
				</div>
				<div className="grid grid-cols-3 border text-sm">
					<OverviewStat
						label="Comunidades"
						value={formatNumber(totalCommunities)}
					/>
					<OverviewStat
						label="Países activos"
						value={`${activeCountries.length}/${countryCoverage.length}`}
					/>
					<OverviewStat label="Eventos" value={formatNumber(totalEvents)} />
				</div>
			</div>

			<div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
				{countryCoverage.map((country) => (
					<CountryCommunityTile
						key={country.code}
						country={country}
						maxCommunities={maxCommunities}
						isSelected={selectedCountries.includes(country.code)}
					/>
				))}
			</div>
		</section>
	);
}

function OverviewStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="border-r px-4 py-3 last:border-r-0">
			<div className="font-mono text-lg font-semibold tabular-nums">
				{value}
			</div>
			<div className="mt-1 whitespace-nowrap text-[10px] uppercase tracking-wider text-muted-foreground">
				{label}
			</div>
		</div>
	);
}

function CountryCommunityTile({
	country,
	maxCommunities,
	isSelected,
}: {
	country: LatamCountryCoverage;
	maxCommunities: number;
	isSelected: boolean;
}) {
	const hasCommunities = country.communities > 0;
	const width = hasCommunities
		? `${Math.max(10, Math.round((country.communities / maxCommunities) * 100))}%`
		: "0%";

	return (
		<Link
			href={`/c/discover?countries=${country.code}`}
			className={`group border bg-card p-3 transition-colors hover:border-brand-green/40 hover:bg-muted/20 ${
				isSelected ? "border-brand-green/60 bg-brand-green/10" : ""
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-lg leading-none">{country.flag}</span>
						<span className="truncate text-sm font-medium">{country.name}</span>
					</div>
					<div className="mt-2 text-xs text-muted-foreground">
						{hasCommunities
							? formatEntityCount(
									country.communities,
									"comunidad",
									"comunidades",
								)
							: "Por mapear"}
					</div>
				</div>
				<ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
			</div>
			<div className="mt-3 h-1 bg-muted">
				<div className="h-full bg-brand-green" style={{ width }} />
			</div>
			<div className="mt-2 text-[11px] text-muted-foreground">
				{formatEntityCount(country.events, "evento", "eventos")}
			</div>
		</Link>
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
