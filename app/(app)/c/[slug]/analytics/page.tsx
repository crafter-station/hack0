import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Users, Settings, BarChart3, TrendingUp, Eye, Award, ExternalLink, Edit3, Loader2, Plus, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { organizations, events } from "@/lib/db/schema";
import { eq, and, gte, count, sql, desc, asc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { formatEventDateRange } from "@/lib/event-utils";
import { getOrgImportJobs } from "@/lib/actions/import";

interface AnalyticsPageProps {
	params: Promise<{ slug: string }>;
}

async function CommunityHero({ slug }: { slug: string }) {
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

					<Link href={`/c/${slug}/events/new`}>
						<Button className="gap-2">
							<UserPlus className="h-4 w-4" />
							Nuevo evento
						</Button>
					</Link>
				</div>

				<nav className="flex items-center gap-1 border-b border-border -mb-px">
					<Link
						href={`/c/${slug}`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
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
					<Link
						href={`/c/${slug}/analytics`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-foreground text-foreground"
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
				</nav>
			</div>
		</div>
	);
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
		(job) => job.status === "pending" || job.status === "processing"
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
		db.select({ count: count() })
			.from(events)
			.where(eq(events.organizationId, community.id)),
		db.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.startDate} >= ${nowStr}`
				)
			),
		db.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.endDate} < ${nowStr}`
				)
			),
		db.select({ count: count() })
			.from(events)
			.where(
				and(
					eq(events.organizationId, community.id),
					sql`${events.createdAt} >= ${thirtyDaysAgoStr}`
				)
			),
		db.select({
			total: sql<number>`COALESCE(SUM(CASE
				WHEN ${events.prizeCurrency} = 'PEN' THEN ${events.prizePool} / 3.5
				ELSE ${events.prizePool}
			END), 0)`
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
						<p className="text-xs text-muted-foreground">
							Todos los tiempos
						</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<TrendingUp className="h-4 w-4" />
							<p className="text-sm">Próximos eventos</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-blue-500">{stats.upcoming}</p>
						<p className="text-xs text-muted-foreground">
							Eventos futuros
						</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Award className="h-4 w-4" />
							<p className="text-sm">Eventos completados</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-emerald-500">{stats.completed}</p>
						<p className="text-xs text-muted-foreground">
							Eventos pasados
						</p>
					</div>

					<div className="rounded-lg border border-border p-5 space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground">
							<BarChart3 className="h-4 w-4" />
							<p className="text-sm">Eventos recientes</p>
						</div>
						<p className="text-3xl font-bold tabular-nums text-amber-500">{stats.recent}</p>
						<p className="text-xs text-muted-foreground">
							Últimos 30 días
						</p>
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
				<div className="rounded-lg border border-border overflow-hidden">
					{communityEvents.length === 0 && pendingJobs.length === 0 ? (
						<div className="px-5 py-12 text-center">
							<Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
							<p className="text-muted-foreground mb-4">
								Aún no has creado ningún evento
							</p>
							<Link href={`/c/${slug}/events/new`}>
								<Button className="gap-2">
									<Plus className="h-4 w-4" />
									Nuevo evento
								</Button>
							</Link>
						</div>
					) : (
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
														new Date(event.endDate)
													)
												: "Sin fecha"}
											{!event.isApproved && (
												<span className="text-amber-600"> · Pendiente de aprobación</span>
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
					)}
				</div>
			</div>

			<div className="rounded-lg border border-border p-6 bg-muted/30">
				<div className="flex items-center justify-center py-12">
					<div className="text-center max-w-md space-y-3">
						<Eye className="h-12 w-12 text-muted-foreground/50 mx-auto" />
						<h3 className="font-semibold">Más analytics próximamente</h3>
						<p className="text-sm text-muted-foreground">
							Estamos trabajando en traerte métricas de engagement, vistas de eventos,
							conversiones de registro y más insights detallados.
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
						<div key={i} className="rounded-lg border border-border p-5 space-y-3 animate-pulse">
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

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		notFound();
	}

	if (community.ownerUserId !== userId) {
		redirect(`/c/${slug}`);
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<Suspense fallback={null}>
				<CommunityHero slug={slug} />
			</Suspense>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<AnalyticsSkeleton />}>
					<AnalyticsContent slug={slug} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
