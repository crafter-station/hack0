import { asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EventList } from "@/components/events/event-list";
import { db } from "@/lib/db";
import { events, eventHostOrganizations, eventHosts, lumaHostMappings, organizations } from "@/lib/db/schema";

interface CommunityPageProps {
	params: Promise<{ slug: string }>;
}

async function CommunityEvents({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		columns: { id: true },
	});

	if (!community) return null;

	const coHostedEvents = await db
		.select({ eventId: eventHostOrganizations.eventId })
		.from(eventHostOrganizations)
		.where(eq(eventHostOrganizations.organizationId, community.id));

	const coHostedEventIds = coHostedEvents.map((e) => e.eventId);

	const lumaHostIds = await db
		.select({ lumaHostApiId: lumaHostMappings.lumaHostApiId })
		.from(lumaHostMappings)
		.where(eq(lumaHostMappings.organizationId, community.id));

	const lumaHostApiIds = lumaHostIds.map((h) => h.lumaHostApiId);

	let lumaHostedEventIds: string[] = [];
	if (lumaHostApiIds.length > 0) {
		const lumaHostedEvents = await db
			.select({ eventId: eventHosts.eventId })
			.from(eventHosts)
			.where(inArray(eventHosts.lumaHostApiId, lumaHostApiIds));
		lumaHostedEventIds = lumaHostedEvents.map((e) => e.eventId);
	}

	const allRelatedEventIds = [...new Set([...coHostedEventIds, ...lumaHostedEventIds])];

	// Status priority: 1=ongoing, 2=open, 3=upcoming, 4=ended
	const statusPriority = sql<number>`
		CASE
			WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW() THEN 4
			WHEN ${events.startDate} IS NOT NULL AND ${events.startDate} <= NOW()
				 AND (${events.endDate} IS NULL OR ${events.endDate} > NOW()) THEN 1
			WHEN ${events.registrationDeadline} IS NOT NULL AND ${events.registrationDeadline} > NOW() THEN 2
			ELSE 3
		END
	`;

	// Date sorting: ended events by most recent first, active events by soonest first
	const dateSortOrder = sql`
		CASE
			WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW()
				THEN -EXTRACT(EPOCH FROM ${events.endDate})
			ELSE EXTRACT(EPOCH FROM COALESCE(${events.startDate}, '9999-12-31'))
		END
	`;

	const whereCondition =
		allRelatedEventIds.length > 0
			? or(
					eq(events.organizationId, community.id),
					inArray(events.id, allRelatedEventIds),
				)
			: eq(events.organizationId, community.id);

	const communityEvents = await db.query.events.findMany({
		where: whereCondition,
		limit: 50,
		orderBy: [desc(events.isFeatured), asc(statusPriority), asc(dateSortOrder)],
		with: {
			organization: true,
		},
	});

	return (
		<EventList
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
			<div className="h-5 bg-muted rounded w-20 animate-pulse" />
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="divide-y divide-border">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-4 animate-pulse"
						>
							<div className="space-y-2">
								<div className="h-4 bg-muted rounded w-3/4" />
								<div className="h-3 bg-muted rounded w-1/2" />
							</div>
							<div className="hidden lg:block h-4 bg-muted rounded w-28" />
							<div className="hidden lg:block h-4 bg-muted rounded w-20" />
							<div className="hidden lg:block h-4 bg-muted rounded w-16 ml-auto" />
							<div className="h-7 bg-muted rounded-full w-24 ml-auto" />
						</div>
					))}
				</div>
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

export default async function CommunityPage({ params }: CommunityPageProps) {
	const { slug } = await params;

	return (
		<Suspense fallback={<EventsSkeleton />}>
			<CommunityEvents slug={slug} />
		</Suspense>
	);
}
