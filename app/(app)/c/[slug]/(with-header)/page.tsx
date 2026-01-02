import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { CommunityEventsToolbar } from "@/components/community/community-events-toolbar";
import { AllEventsTable } from "@/components/events/all-events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import { EventsCards } from "@/components/events/events-cards";
import { EventsMapView } from "@/components/events/events-map-view";
import { EventsPreviewView } from "@/components/events/events-preview-view";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import { getEventsViewPreference } from "@/lib/view-preferences";

interface CommunityPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<SearchParams>;
}

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

async function CommunityEvents({
	slug,
	viewMode,
	search,
}: {
	slug: string;
	viewMode: ViewMode;
	search: string;
}) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		columns: { id: true },
	});

	if (!community) return null;

	const statusPriority = sql<number>`
    CASE
      WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW() THEN 4
      WHEN ${events.endDate} IS NULL AND ${events.startDate} IS NOT NULL AND ${events.startDate} < CURRENT_DATE THEN 4
      WHEN ${events.startDate} IS NOT NULL AND ${events.startDate} <= NOW()
           AND ${events.endDate} IS NOT NULL AND ${events.endDate} > NOW() THEN 1
      WHEN ${events.registrationDeadline} IS NOT NULL AND ${events.registrationDeadline} > NOW() THEN 2
      ELSE 3
    END
  `;

	const dateSortOrder = sql`
    CASE
      WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW()
        THEN -EXTRACT(EPOCH FROM ${events.endDate})
      ELSE EXTRACT(EPOCH FROM COALESCE(${events.startDate}, '9999-12-31'))
    END
  `;

	const searchFilter = search
		? or(
				ilike(events.name, `%${search}%`),
				ilike(events.description, `%${search}%`),
			)
		: undefined;

	const results = await db
		.select({
			event: events,
			organization: organizations,
		})
		.from(events)
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.where(
			searchFilter
				? sql`${eq(events.organizationId, community.id)} AND ${searchFilter}`
				: eq(events.organizationId, community.id),
		)
		.orderBy(desc(events.isFeatured), asc(statusPriority), asc(dateSortOrder))
		.limit(50);

	const communityEvents = results.map((r) => ({
		...r.event,
		organization: r.organization,
	}));

	if (viewMode === "calendar") {
		return <EventsCalendar events={communityEvents} />;
	}

	if (viewMode === "map") {
		return (
			<EventsMapView
				events={communityEvents}
				total={communityEvents.length}
				hasMore={false}
				filters={{}}
			/>
		);
	}

	if (viewMode === "preview") {
		return (
			<EventsPreviewView
				events={communityEvents}
				total={communityEvents.length}
			/>
		);
	}

	if (viewMode === "table") {
		return (
			<AllEventsTable
				events={communityEvents}
				total={communityEvents.length}
				hasMore={false}
				filters={{}}
			/>
		);
	}

	return (
		<EventsCards
			events={communityEvents}
			total={communityEvents.length}
			hasMore={false}
			filters={{}}
		/>
	);
}

function EventsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div className="h-7 w-48 bg-muted rounded animate-pulse" />
				<div className="h-7 w-32 bg-muted rounded animate-pulse" />
			</div>
			<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="space-y-2 animate-pulse">
						<div className="aspect-square bg-muted rounded" />
						<div className="h-4 bg-muted rounded w-3/4" />
						<div className="h-3 bg-muted rounded w-1/2" />
					</div>
				))}
			</div>
		</div>
	);
}

export async function generateMetadata({
	params,
}: CommunityPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return {
			title: "Comunidad no encontrada",
		};
	}

	return {
		title: `${community.displayName || community.name} - Eventos en hack0.dev`,
		description:
			community.description ||
			`Calendario de eventos de ${community.displayName || community.name}`,
	};
}

export default async function CommunityPage({
	params,
	searchParams,
}: CommunityPageProps) {
	const { slug } = await params;
	const rawParams = await searchParams;

	const hasExplicitView = "view" in rawParams;
	const savedPreference = await getEventsViewPreference();
	const urlView = rawParams.view as ViewMode | undefined;
	const viewMode = hasExplicitView && urlView ? urlView : savedPreference;
	const search = (rawParams.search as string) || "";

	return (
		<div className="space-y-4">
			<Suspense
				fallback={<div className="h-7 w-full bg-muted rounded animate-pulse" />}
			>
				<CommunityEventsToolbar />
			</Suspense>

			<Suspense fallback={<EventsSkeleton />}>
				<CommunityEvents slug={slug} viewMode={viewMode} search={search} />
			</Suspense>
		</div>
	);
}
