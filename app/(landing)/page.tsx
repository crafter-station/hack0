import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
	ArrowRight,
	BookOpen,
	CalendarDays,
	Code2,
	ExternalLink,
	FlaskConical,
	GitBranch,
	Lightbulb,
	MapPin,
	Search,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/lib/actions/events";
import { getBuilderDirectorySummary } from "@/lib/builders-directory";
import { db } from "@/lib/db";
import { communityMembers, events, organizations } from "@/lib/db/schema";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema/constants";
import {
	formatEventDateRange,
	getEventTypeLabel,
	getEventUrl,
} from "@/lib/event-utils";
import { sanitizeImageUrl } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Peru Agentic Builder Index",
	description:
		"Directorio público de eventos, comunidades, hackathons, labs, grants y builders de IA en Perú.",
};

export const dynamic = "force-dynamic";

const PERU = "PE";
const HACKATHON_TYPES = [
	"hackathon",
	"competition",
	"olympiad",
	"robotics",
] as const;
const UNIVERSITY_TYPES = ["university", "student_org"] as const;

type IndexCommunity = {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	description: string | null;
	type: string | null;
	logoUrl: string | null;
	coverUrl: string | null;
	city: string | null;
	department: string | null;
	websiteUrl: string | null;
	isVerified: boolean | null;
	memberCount: number;
};

async function getIndexData() {
	const publicOrgWhere = and(
		eq(organizations.isPublic, true),
		eq(organizations.isPersonalOrg, false),
		eq(organizations.country, PERU),
	);

	const approvedPeruEventsWhere = and(
		eq(events.isApproved, true),
		eq(events.country, PERU),
		isNull(events.parentEventId),
	);

	const memberCountSubquery = db
		.select({
			communityId: communityMembers.communityId,
			memberCount: count().as("member_count"),
		})
		.from(communityMembers)
		.groupBy(communityMembers.communityId)
		.as("member_counts");

	const [
		upcoming,
		hackathons,
		countRows,
		communityRows,
		labRows,
		recentSources,
	] = await Promise.all([
		getEvents({
			country: [PERU],
			timeFilter: "upcoming",
			limit: 6,
		}),
		getEvents({
			country: [PERU],
			eventType: [...HACKATHON_TYPES],
			timeFilter: "all",
			limit: 4,
		}),
		db
			.select({
				eventsCount: count(events.id),
				upcomingEvents: sql<number>`count(*) filter (where ${events.endDate} is null or ${events.endDate} >= now())`,
				hackathons: sql<number>`count(*) filter (where ${events.eventType} in ('hackathon', 'competition', 'olympiad', 'robotics'))`,
				opportunities: sql<number>`count(*) filter (where ${events.eventType} in ('accelerator', 'incubator', 'fellowship', 'call_for_papers'))`,
				cities: sql<number>`count(distinct ${events.city}) filter (where ${events.city} is not null)`,
			})
			.from(events)
			.where(approvedPeruEventsWhere),
		db
			.select({
				id: organizations.id,
				slug: organizations.slug,
				name: organizations.name,
				displayName: organizations.displayName,
				description: organizations.description,
				type: organizations.type,
				logoUrl: organizations.logoUrl,
				coverUrl: organizations.coverUrl,
				city: organizations.city,
				department: organizations.department,
				websiteUrl: organizations.websiteUrl,
				isVerified: organizations.isVerified,
				memberCount:
					sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`.as(
						"member_count",
					),
			})
			.from(organizations)
			.leftJoin(
				memberCountSubquery,
				eq(organizations.id, memberCountSubquery.communityId),
			)
			.where(publicOrgWhere)
			.orderBy(desc(organizations.isVerified), desc(organizations.updatedAt))
			.limit(8),
		db
			.select({
				id: organizations.id,
				slug: organizations.slug,
				name: organizations.name,
				displayName: organizations.displayName,
				description: organizations.description,
				type: organizations.type,
				logoUrl: organizations.logoUrl,
				coverUrl: organizations.coverUrl,
				city: organizations.city,
				department: organizations.department,
				websiteUrl: organizations.websiteUrl,
				isVerified: organizations.isVerified,
				memberCount:
					sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`.as(
						"member_count",
					),
			})
			.from(organizations)
			.leftJoin(
				memberCountSubquery,
				eq(organizations.id, memberCountSubquery.communityId),
			)
			.where(and(publicOrgWhere, inArray(organizations.type, UNIVERSITY_TYPES)))
			.orderBy(desc(organizations.isVerified), desc(organizations.updatedAt))
			.limit(4),
		db
			.select({
				source: events.scrapeSource,
				count: count(events.id),
			})
			.from(events)
			.where(approvedPeruEventsWhere)
			.groupBy(events.scrapeSource)
			.orderBy(desc(count(events.id)))
			.limit(4),
	]);

	const [[{ totalCommunities }], builderSummary, [{ totalLabs }]] =
		await Promise.all([
			db
				.select({ totalCommunities: count(organizations.id) })
				.from(organizations)
				.where(publicOrgWhere),
			getBuilderDirectorySummary(),
			db
				.select({ totalLabs: count(organizations.id) })
				.from(organizations)
				.where(
					and(publicOrgWhere, inArray(organizations.type, UNIVERSITY_TYPES)),
				),
		]);

	const counts = countRows[0] || {
		eventsCount: 0,
		upcomingEvents: 0,
		hackathons: 0,
		opportunities: 0,
		cities: 0,
	};

	return {
		upcoming: upcoming.events,
		hackathons: hackathons.events,
		communities: communityRows.map(normalizeCommunity),
		labs: labRows.map(normalizeCommunity),
		recentSources,
		counts: {
			events: Number(counts.eventsCount || 0),
			upcoming: Number(counts.upcomingEvents || 0),
			hackathons: Number(counts.hackathons || 0),
			opportunities: Number(counts.opportunities || 0),
			cities: Number(counts.cities || 0),
			communities: Number(totalCommunities || 0),
			builders: builderSummary.builders,
			labs: Number(totalLabs || 0),
		},
	};
}

function normalizeCommunity(community: IndexCommunity): IndexCommunity {
	return {
		...community,
		memberCount: Number(community.memberCount || 0),
	};
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("es-PE").format(value);
}

function locationLabel(city: string | null, department: string | null) {
	if (city && department && city !== department)
		return `${city}, ${department}`;
	return city || department || "Perú";
}

export default async function HomePage() {
	const data = await getIndexData();
	const eventsFromIndexedSources = data.recentSources.reduce(
		(total, source) => total + Number(source.count || 0),
		0,
	);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<section className="border-b">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 lg:py-12">
						<div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-end">
							<div className="space-y-6">
								<div className="space-y-4">
									<h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
										Peru Agentic Builder Index
									</h1>
									<p className="max-w-2xl text-base leading-7 text-muted-foreground">
										Eventos, comunidades, hackathons, labs, grants y builders de
										IA en Perú, mantenidos desde hack0 y el calendario público
										de la comunidad.
									</p>
								</div>

								<div className="flex flex-col gap-2 sm:flex-row">
									<Button asChild size="sm" className="gap-2">
										<Link href="/events?country=PE">
											Explorar eventos
											<ArrowRight className="size-4" />
										</Link>
									</Button>
									<Button asChild variant="outline" size="sm" className="gap-2">
										<Link href="/c/discover?countries=PE">
											Ver comunidades
											<Search className="size-4" />
										</Link>
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-2 border bg-card">
								<HeroMetric label="Eventos Perú" value={data.counts.events} />
								<HeroMetric
									label="Comunidades"
									value={data.counts.communities}
								/>
								<HeroMetric label="Hackathons" value={data.counts.hackathons} />
								<HeroMetric label="Ciudades" value={data.counts.cities} />
							</div>
						</div>
					</div>
				</section>

				<section className="border-b bg-muted/20">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-5">
						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
							<FacetLink
								href="/events?country=PE"
								icon={CalendarDays}
								label="Eventos"
								value={data.counts.upcoming}
								helper="upcoming"
							/>
							<FacetLink
								href="/c/discover?countries=PE"
								icon={Users}
								label="Comunidades"
								value={data.counts.communities}
								helper="mapeadas"
							/>
							<FacetLink
								href="/events?country=PE&eventType=hackathon,competition,olympiad,robotics"
								icon={Zap}
								label="Hackathons"
								value={data.counts.hackathons}
								helper="históricos"
							/>
							<FacetLink
								href="/c/discover?countries=PE&types=university,student_org"
								icon={FlaskConical}
								label="Labs universitarios"
								value={data.counts.labs}
								helper="por verificar"
							/>
							<FacetLink
								href="/events?country=PE&eventType=accelerator,incubator,fellowship,call_for_papers"
								icon={BookOpen}
								label="Grants y programas"
								value={data.counts.opportunities}
								helper="oportunidades"
							/>
							<FacetLink
								href="/builders"
								icon={Code2}
								label="Builders y hosts"
								value={data.counts.builders}
								helper="desde eventos"
							/>
							<FacetLink
								href="/roadmap"
								icon={GitBranch}
								label="Demo projects"
								value={0}
								helper="siguiente dataset"
							/>
							<FacetLink
								href="/roadmap"
								icon={Lightbulb}
								label="AI workflows"
								value={0}
								helper="siguiente dataset"
							/>
						</div>
					</div>
				</section>

				<section className="mx-auto grid max-w-screen-xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 py-8">
					<div className="space-y-8">
						<SectionHeader
							title="Próximos eventos"
							description="El pulso público para builders, estudiantes, founders y comunidades."
							href="/events?country=PE"
						/>
						<div className="grid gap-3">
							{data.upcoming.map((event) => (
								<EventIndexRow key={event.id} event={event} />
							))}
						</div>

						<SectionHeader
							title="Hackathons y retos"
							description="Eventos que producen demos, repos y nuevos builders para el índice."
							href="/events?country=PE&eventType=hackathon,competition,olympiad,robotics"
						/>
						<div className="grid gap-3 md:grid-cols-2">
							{data.hackathons.map((event) => (
								<EventCompactCard key={event.id} event={event} />
							))}
						</div>
					</div>

					<aside className="space-y-8">
						<section className="border bg-card">
							<div className="border-b px-4 py-3">
								<h2 className="text-sm font-semibold">Comunidades</h2>
							</div>
							<div className="divide-y">
								{data.communities.slice(0, 6).map((community) => (
									<CommunityRow key={community.id} community={community} />
								))}
							</div>
							<div className="border-t p-3">
								<Button asChild variant="outline" size="sm" className="w-full">
									<Link href="/c/discover?countries=PE">Abrir directorio</Link>
								</Button>
							</div>
						</section>

						<section className="border bg-card">
							<div className="border-b px-4 py-3">
								<h2 className="text-sm font-semibold">Labs y universidades</h2>
							</div>
							<div className="divide-y">
								{data.labs.length > 0 ? (
									data.labs.map((community) => (
										<CommunityRow key={community.id} community={community} />
									))
								) : (
									<div className="p-4 text-sm text-muted-foreground">
										No hay labs verificados todavía.
									</div>
								)}
							</div>
						</section>

						<section className="border bg-card p-4">
							<div className="flex items-start gap-3">
								<div className="flex size-9 items-center justify-center border bg-background">
									<Sparkles className="size-4" />
								</div>
								<div className="space-y-3">
									<div>
										<h2 className="text-sm font-semibold">
											State of Agentic Builders in Peru
										</h2>
										<p className="mt-1 text-xs leading-5 text-muted-foreground">
											La versión trimestral debe salir de estos datos: eventos,
											demos, comunidades, labs, sponsors y workflows.
										</p>
									</div>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="border p-2">
											<div className="font-medium">
												{eventsFromIndexedSources}
											</div>
											<div className="text-muted-foreground">eventos</div>
										</div>
										<div className="border p-2">
											<div className="font-medium">
												{data.recentSources.length}
											</div>
											<div className="text-muted-foreground">pipelines</div>
										</div>
									</div>
									<Button asChild variant="outline" size="sm">
										<Link href="/data-health">Ver cobertura</Link>
									</Button>
								</div>
							</div>
						</section>
					</aside>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}

function HeroMetric({ label, value }: { label: string; value: number }) {
	return (
		<div className="border-b border-r p-4 last:border-r-0 even:border-r-0 sm:p-5">
			<div className="text-2xl font-semibold tracking-tight">
				{formatNumber(value)}
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{label}</div>
		</div>
	);
}

function FacetLink({
	href,
	icon: Icon,
	label,
	value,
	helper,
}: {
	href: string;
	icon: typeof CalendarDays;
	label: string;
	value: number;
	helper: string;
}) {
	return (
		<Link
			href={href}
			className="group flex items-center justify-between border bg-background px-3 py-3 transition-colors hover:bg-card"
		>
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center border bg-muted/40 text-muted-foreground group-hover:text-foreground">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0">
					<div className="truncate text-sm font-medium">{label}</div>
					<div className="text-xs text-muted-foreground">{helper}</div>
				</div>
			</div>
			<div className="text-sm font-semibold">{formatNumber(value)}</div>
		</Link>
	);
}

function SectionHeader({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	return (
		<div className="flex items-end justify-between gap-4">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<Link
				href={href}
				className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
			>
				Ver todo
				<ArrowRight className="size-3" />
			</Link>
		</div>
	);
}

function EventIndexRow({
	event,
}: {
	event: Awaited<ReturnType<typeof getEvents>>["events"][number];
}) {
	const eventUrl = getEventUrl(event);
	const imageUrl = event.eventImageUrl
		? sanitizeImageUrl(event.eventImageUrl)
		: null;

	return (
		<Link
			href={eventUrl}
			className="group grid gap-4 border bg-card p-3 transition-colors hover:bg-muted/20 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
		>
			<div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-square">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={event.name}
						fill
						className="object-cover transition-transform group-hover:scale-105"
						sizes="96px"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<CalendarDays className="size-5" />
					</div>
				)}
			</div>
			<div className="min-w-0 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary" className="h-5 rounded-none text-[10px]">
						{getEventTypeLabel(event.eventType)}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{formatEventDateRange(
							event.startDate,
							event.endDate,
							event.timezone || undefined,
						)}
					</span>
				</div>
				<div>
					<h3 className="line-clamp-2 text-base font-semibold tracking-tight group-hover:underline">
						{event.name}
					</h3>
					<p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
						{event.description || event.organization?.displayName || "Evento"}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 text-xs text-muted-foreground sm:min-w-28 sm:justify-end">
				<MapPin className="size-3.5" />
				<span className="truncate">
					{locationLabel(event.city, event.department)}
				</span>
			</div>
		</Link>
	);
}

function EventCompactCard({
	event,
}: {
	event: Awaited<ReturnType<typeof getEvents>>["events"][number];
}) {
	const eventUrl = getEventUrl(event);
	const imageUrl = event.eventImageUrl
		? sanitizeImageUrl(event.eventImageUrl)
		: null;

	return (
		<Link
			href={eventUrl}
			className="group overflow-hidden border bg-card transition-colors hover:bg-muted/20"
		>
			<div className="relative aspect-[16/9] bg-muted">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={event.name}
						fill
						className="object-cover transition-transform group-hover:scale-105"
						sizes="(max-width: 768px) 100vw, 50vw"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<Zap className="size-6" />
					</div>
				)}
			</div>
			<div className="space-y-2 border-t p-3">
				<Badge variant="outline" className="h-5 rounded-none text-[10px]">
					{getEventTypeLabel(event.eventType)}
				</Badge>
				<h3 className="line-clamp-2 text-sm font-semibold group-hover:underline">
					{event.name}
				</h3>
				<div className="text-xs text-muted-foreground">
					{formatEventDateRange(
						event.startDate,
						event.endDate,
						event.timezone || undefined,
					)}
				</div>
			</div>
		</Link>
	);
}

function CommunityRow({ community }: { community: IndexCommunity }) {
	const name = community.displayName || community.name;
	const logoUrl = community.logoUrl
		? sanitizeImageUrl(community.logoUrl)
		: null;

	return (
		<Link
			href={`/c/${community.slug}`}
			className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
		>
			<div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden border bg-muted text-sm font-semibold text-muted-foreground">
				{logoUrl ? (
					<Image
						src={logoUrl}
						alt={name}
						fill
						className="object-cover"
						sizes="40px"
					/>
				) : (
					name.charAt(0).toUpperCase()
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h3 className="truncate text-sm font-medium group-hover:underline">
						{name}
					</h3>
					{community.isVerified && (
						<span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
					)}
				</div>
				<div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
					<span className="truncate">
						{community.type
							? ORGANIZER_TYPE_LABELS[community.type] || community.type
							: "Comunidad"}
					</span>
					<span>{locationLabel(community.city, community.department)}</span>
				</div>
			</div>
			{community.websiteUrl && <ExternalLink className="size-3.5 opacity-50" />}
		</Link>
	);
}
