import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, LayoutDashboard, Settings, BarChart3, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { organizations, events } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

interface CommunityPageProps {
	params: Promise<{ slug: string }>;
}

async function CommunityHero({ slug, isOwner }: { slug: string; isOwner: boolean }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) return null;

	return (
		<div className="relative border-b">
			<div
				className="absolute inset-0 opacity-[0.02]"
				style={{
					backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
					backgroundSize: "48px 48px",
				}}
			/>

			<div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
				<div className="flex items-start justify-between gap-6 mb-6">
					<div className="flex items-start gap-6">
						<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border-2 border-border shrink-0">
							<Users className="h-10 w-10 text-muted-foreground" />
						</div>

						<div className="flex-1 space-y-3">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<Link href="/">
										<Button variant="ghost" size="sm" className="gap-2">
											<ArrowLeft className="h-4 w-4" />
											Volver
										</Button>
									</Link>
								</div>
								<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
									{community.displayName || community.name}
								</h1>
								{community.description && (
									<p className="text-lg text-muted-foreground mt-2 max-w-2xl">
										{community.description}
									</p>
								)}
							</div>
						</div>
					</div>

					{isOwner && (
						<Link href={`/c/${slug}/events/new`}>
							<Button className="gap-2">
								<UserPlus className="h-4 w-4" />
								Nuevo evento
							</Button>
						</Link>
					)}
				</div>

				<nav className="flex items-center gap-1 border-b border-border -mb-px">
					<Link
						href={`/c/${slug}`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-foreground text-foreground"
					>
						<Calendar className="h-4 w-4" />
						Eventos
					</Link>
					<Link
						href={`/c/${slug}/members`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
					>
						<Users className="h-4 w-4" />
						Miembros
					</Link>
					{isOwner && (
						<>
							<Link
								href={`/c/${slug}/analytics`}
								className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
							>
								<BarChart3 className="h-4 w-4" />
								Analytics
							</Link>
							<Link
								href={`/c/${slug}/settings`}
								className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
							>
								<Settings className="h-4 w-4" />
								Configuración
							</Link>
						</>
					)}
				</nav>
			</div>
		</div>
	);
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
	const { userId } = await auth();

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		notFound();
	}

	const isOwner = userId === community.ownerUserId;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<Suspense fallback={null}>
				<CommunityHero slug={slug} isOwner={isOwner} />
			</Suspense>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<EventsSkeleton />}>
					<CommunityEvents slug={slug} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
