import { auth } from "@clerk/nextjs/server";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import {
	Award,
	BarChart3,
	Calendar,
	Edit3,
	ExternalLink,
	Eye,
	Loader2,
	Plus,
	TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { getOrgImportJobs } from "@/lib/actions/import";
import {
	canManageOrganization,
	getOrganizationBySlug,
} from "@/lib/actions/organizations";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import { formatEventDateRange } from "@/lib/event-utils";
import { isGodMode } from "@/lib/god-mode";

interface AnalyticsPageProps {
	params: Promise<{ slug: string }>;
}

async function AnalyticsContent({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) return null;

	const [communityEvents, importJobs] = await Promise.all([
		db.query.events.findMany({
			where: eq(events.organizationId, community.id),
			limit: 50,
			orderBy: [desc(events.isFeatured), asc(events.startDate)],
		}),
		getOrgImportJobs(5, community.id),
	]);

	const pendingJobs = importJobs.filter(
		(job) => job.status === "pending" || job.status === "processing",
	);

	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const nowStr = now.toISOString();
	const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

	const [
		totalEvents,
		upcomingEvents,
		completedEvents,
		recentEvents,
		totalPrizePool,
	] = await Promise.all([
		db
			.select({ count: count() })
			.from(events)
			.where(eq(events.organizationId, community.id)),
		db
			.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.startDate} >= ${nowStr}`,
				),
			),
		db
			.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.endDate} < ${nowStr}`,
				),
			),
		db
			.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.createdAt} >= ${thirtyDaysAgoStr}`,
				),
			),
		db
			.select({
				total: sql<number>`COALESCE(SUM(CASE
				WHEN ${events.prizeCurrency} = 'PEN' THEN ${events.prizePool} / 3.5
				ELSE ${events.prizePool}
			END), 0)`,
			})
			.from(events)
			.where(eq(events.organizationId, community.id)),
	]);

	const stats = {
		total: totalEvents[0]?.count || 0,
		upcoming: upcomingEvents[0]?.count || 0,
		completed: completedEvents[0]?.count || 0,
		recent: recentEvents[0]?.count || 0,
		prizePool: Math.round(totalPrizePool[0]?.total || 0),
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold mb-4">Resumen general</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<p className="text-sm">Total eventos</p>
						</div>
						<p className="text-3xl font-bold tabular-nums">{stats.total}</p>
						<p className="text-xs text-muted-foreground">Todos los tiempos</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<TrendingUp className="h-4 w-4" />
							<p className="text-sm">Próximos eventos</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-blue-500">
							{stats.upcoming}
						</p>
						<p className="text-xs text-muted-foreground">Eventos futuros</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Award className="h-4 w-4" />
							<p className="text-sm">Eventos completados</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-emerald-500">
							{stats.completed}
						</p>
						<p className="text-xs text-muted-foreground">Eventos pasados</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<BarChart3 className="h-4 w-4" />
							<p className="text-sm">Eventos recientes</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-amber-500">
							{stats.recent}
						</p>
						<p className="text-xs text-muted-foreground">Últimos 30 días</p>
					</div>
				</div>
			</div>

			<div className="rounded-lg border border-border p-6 space-y-4">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Award className="h-5 w-5 text-amber-500" />
					<h3 className="font-semibold text-foreground">Prize Pool Total</h3>
				</div>
				<div className="space-y-2">
					<p className="text-4xl font-bold text-emerald-500">
						${stats.prizePool.toLocaleString()}
					</p>
					<p className="text-sm text-muted-foreground">
						Suma total de premios ofrecidos (convertido a USD)
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Eventos de tu comunidad</h2>
				{communityEvents.length === 0 && pendingJobs.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Calendar className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>Aún no has creado ningún evento</EmptyTitle>
							<EmptyDescription>
								Crea tu primer evento para comenzar a atraer participantes y
								construir tu comunidad.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Link href={`/c/${slug}/events/new`}>
								<Button className="gap-2">
									<Plus className="h-4 w-4" />
									Nuevo evento
								</Button>
							</Link>
						</EmptyContent>
					</Empty>
				) : (
					<div className="rounded-lg border border-border overflow-hidden">
						<div className="divide-y divide-border">
							{pendingJobs.map((job) => (
								<div
									key={job.id}
									className="px-5 py-4 flex items-center justify-between gap-4 bg-muted/30"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											<span className="font-medium text-muted-foreground">
												Importando evento...
											</span>
										</div>
										<p className="text-sm text-muted-foreground truncate">
											{job.sourceUrl}
										</p>
									</div>
									<div className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
										{job.status === "pending" ? "En cola" : "Procesando"}
									</div>
								</div>
							))}
							{communityEvents.map((event) => (
								<div
									key={event.id}
									className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
								>
									<div className="min-w-0 flex-1">
										<Link
											href={`/c/${slug}/events/${event.slug}`}
											className="font-medium hover:underline truncate block"
										>
											{event.name}
										</Link>
										<p className="text-sm text-muted-foreground">
											{event.startDate && event.endDate
												? formatEventDateRange(
														new Date(event.startDate),
														new Date(event.endDate),
													)
												: "Sin fecha"}
											{!event.isApproved && (
												<span className="text-amber-600">
													{" "}
													· Pendiente de aprobación
												</span>
											)}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Link
											href={`/c/${slug}/events/${event.slug}/manage`}
											className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
											title="Gestionar evento"
										>
											<Edit3 className="h-4 w-4" />
										</Link>
										<Link
											href={`/c/${slug}/events/${event.slug}`}
											className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
											title="Ver evento"
										>
											<ExternalLink className="h-4 w-4" />
										</Link>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="rounded-lg border border-border p-6 bg-muted/30">
				<div className="flex items-center justify-center py-12">
					<div className="text-center max-w-md space-y-3">
						<Eye className="h-12 w-12 text-muted-foreground/50 mx-auto" />
						<h3 className="font-semibold">Más analytics próximamente</h3>
						<p className="text-sm text-muted-foreground">
							Estamos trabajando en traerte métricas de engagement, vistas de
							eventos, conversiones de registro y más insights detallados.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function AnalyticsSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<div className="h-6 bg-muted rounded w-40 mb-4 animate-pulse" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="rounded-lg border border-border p-5 space-y-3 animate-pulse"
						>
							<div className="h-4 bg-muted rounded w-32" />
							<div className="h-9 bg-muted rounded w-24" />
							<div className="h-3 bg-muted rounded w-28" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export async function generateMetadata({
	params,
}: AnalyticsPageProps): Promise<Metadata> {
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
		title: `Analytics - ${community.displayName || community.name}`,
		description: `Analytics y métricas de ${community.displayName || community.name}`,
	};
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	const godMode = await isGodMode();
	const canManage = await canManageOrganization(org.id);

	if (!canManage && !godMode) {
		redirect(`/c/${slug}`);
	}

	return (
		<Suspense fallback={<AnalyticsSkeleton />}>
			<AnalyticsContent slug={slug} />
		</Suspense>
	);
}
