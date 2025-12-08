import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { organizations, events } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { EventList } from "@/components/events/event-list";

interface CommunityPageProps {
	params: Promise<{ slug: string }>;
}

async function CommunityEvents({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		columns: { id: true },
	});

	if (!community) return null;

	// Fetch events directly filtered by organization
	const communityEvents = await db.query.events.findMany({
		where: eq(events.organizationId, community.id),
		limit: 50,
		orderBy: (eventsTable, { desc, asc }) => [
			desc(eventsTable.isFeatured),
			asc(eventsTable.startDate),
		],
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
		description: community.description || `Calendario de eventos de ${community.displayName || community.name}`,
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
