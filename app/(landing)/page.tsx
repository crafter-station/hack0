import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
	ArrowRight,
	BookOpen,
	CalendarDays,
	Code2,
	ExternalLink,
	FlaskConical,
	MapPin,
	Search,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hack0Wordmark } from "@/components/brand/hack0-logo";
import { EventCover } from "@/components/events";
import { VerifiedBadge } from "@/components/icons/verified-badge";
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
import { ISO_TO_MAP_ID } from "@/lib/geo/peru-departments";
import { LATAM_COUNTRY_OPTIONS } from "@/lib/latam-countries";
import {
	getLatamCountryCoverage,
	type LatamCountryCoverage,
} from "@/lib/latam-country-coverage";
import { getOpportunityDirectorySummary } from "@/lib/opportunities-directory";
import { sanitizeImageUrl } from "@/lib/utils";
import latamDotsData from "@/public/latam-dots.json";

export const metadata: Metadata = {
	title: "LATAM Builder Index",
	description:
		"Directorio público de eventos, comunidades, hackathons, labs, grants y builders de IA en Latinoamérica.",
};

export const dynamic = "force-dynamic";

const LATAM_EVENT_COUNTRIES = LATAM_COUNTRY_OPTIONS.map(
	(country) => country.code,
);
const HACKATHON_TYPES = [
	"hackathon",
	"competition",
	"olympiad",
	"robotics",
] as const;
const COMMUNITY_TYPE = "community";
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
		inArray(organizations.country, LATAM_EVENT_COUNTRIES),
	);
	const communityOrgWhere = and(
		publicOrgWhere,
		eq(organizations.type, COMMUNITY_TYPE),
	);
	const labOrgWhere = and(
		publicOrgWhere,
		inArray(organizations.type, UNIVERSITY_TYPES),
	);

	const approvedLatamEventsWhere = and(
		eq(events.isApproved, true),
		inArray(events.country, LATAM_EVENT_COUNTRIES),
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
		countryCoverage,
	] = await Promise.all([
		getEvents({
			country: LATAM_EVENT_COUNTRIES,
			timeFilter: "upcoming",
			limit: 6,
		}),
		getEvents({
			country: LATAM_EVENT_COUNTRIES,
			eventType: [...HACKATHON_TYPES],
			timeFilter: "all",
			limit: 4,
		}),
		db
			.select({
				eventsCount: count(events.id),
				upcomingEvents: sql<number>`count(*) filter (where ${events.endDate} is null or ${events.endDate} >= now())`,
				hackathons: sql<number>`count(*) filter (where ${events.eventType} in ('hackathon', 'competition', 'olympiad', 'robotics'))`,
				cities: sql<number>`count(distinct ${events.city}) filter (where ${events.city} is not null)`,
			})
			.from(events)
			.where(approvedLatamEventsWhere),
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
			.where(communityOrgWhere)
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
			.where(labOrgWhere)
			.orderBy(desc(organizations.isVerified), desc(organizations.updatedAt))
			.limit(4),
		db
			.select({
				source: events.scrapeSource,
				count: count(events.id),
			})
			.from(events)
			.where(approvedLatamEventsWhere)
			.groupBy(events.scrapeSource)
			.orderBy(desc(count(events.id)))
			.limit(4),
		getLatamCountryCoverage(),
	]);

	const [
		[{ totalCommunities }],
		builderSummary,
		opportunitySummary,
		[{ totalLabs }],
	] = await Promise.all([
		db
			.select({ totalCommunities: count(organizations.id) })
			.from(organizations)
			.where(communityOrgWhere),
		getBuilderDirectorySummary(),
		getOpportunityDirectorySummary(),
		db
			.select({ totalLabs: count(organizations.id) })
			.from(organizations)
			.where(labOrgWhere),
	]);

	const counts = countRows[0] || {
		eventsCount: 0,
		upcomingEvents: 0,
		hackathons: 0,
		cities: 0,
	};
	return {
		upcoming: upcoming.events,
		hackathons: hackathons.events,
		communities: communityRows.map(normalizeCommunity),
		labs: labRows.map(normalizeCommunity),
		recentSources,
		countryCoverage,
		counts: {
			events: Number(counts.eventsCount || 0),
			upcoming: Number(counts.upcomingEvents || 0),
			hackathons: Number(counts.hackathons || 0),
			opportunities: opportunitySummary.total,
			cities: Number(counts.cities || 0),
			communities: Number(totalCommunities || 0),
			builders: builderSummary.builders,
			labs: Number(totalLabs || 0),
			countries: LATAM_EVENT_COUNTRIES.length,
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

function formatEntityCount(value: number, singular: string, plural: string) {
	return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function locationLabel(city: string | null, department: string | null) {
	if (city && department && city !== department)
		return `${city}, ${department}`;
	return city || department || "LATAM";
}

export default async function HomePage() {
	const data = await getIndexData();
	const activeCountryCount = data.countryCoverage.filter(
		(country) => country.signal > 0,
	).length;
	const eventsFromIndexedSources = data.recentSources.reduce(
		(total, source) => total + Number(source.count || 0),
		0,
	);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<section className="relative overflow-hidden border-b bg-brand-paper text-brand-black dark:bg-brand-black dark:text-brand-paper">
					<div className="hack0-hero-grid absolute inset-0" />
					<div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 py-10 lg:py-16">
						<div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-end">
							<div className="min-w-0 space-y-6">
								<div className="space-y-5">
									<div className="flex items-center gap-3">
										<div className="h-2.5 w-12 bg-brand-green" />
										<span className="font-mono text-xs uppercase tracking-wider text-brand-forest/80 dark:text-brand-grid">
											active builder index
										</span>
									</div>
									<Hack0Wordmark className="h-14 w-[196px] text-brand-black sm:h-16 sm:w-[224px] dark:text-brand-paper" />
									<h1 className="max-w-3xl text-pretty break-words text-3xl font-semibold leading-tight text-brand-black sm:text-5xl lg:text-6xl dark:text-brand-paper">
										<span className="block sm:inline">LATAM Builder</span>{" "}
										<span className="block sm:inline">Index</span>
									</h1>
									<p className="w-full max-w-[22rem] break-words text-sm leading-6 text-brand-forest/85 sm:max-w-2xl sm:text-base sm:leading-7 dark:text-brand-grid">
										Eventos, comunidades, hackathons, labs, grants y builders de
										IA en Latinoamérica, mantenidos desde hack0 y calendarios
										públicos de la comunidad.
									</p>
								</div>

								<div className="flex flex-col gap-2 sm:flex-row">
									<Button
										asChild
										size="sm"
										className="gap-2 bg-brand-black text-brand-paper hover:bg-brand-forest dark:bg-brand-paper dark:text-brand-black dark:hover:bg-brand-grid"
									>
										<Link href="/events">
											Explorar eventos
											<ArrowRight className="size-4" />
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="gap-2 border-brand-forest/30 bg-brand-paper/30 text-brand-black hover:bg-brand-forest/10 dark:border-brand-grid/35 dark:bg-transparent dark:text-brand-paper dark:hover:bg-brand-forest/60"
									>
										<Link href="/c/discover">
											Ver comunidades
											<Search className="size-4" />
										</Link>
									</Button>
								</div>
							</div>

							<div className="space-y-3">
								<LatamSignalMap
									activeCountryCount={activeCountryCount}
									countryCoverage={data.countryCoverage}
									totalCountries={data.counts.countries}
								/>
								<div className="grid grid-cols-2 border border-brand-forest/20 bg-card/85 shadow-sm backdrop-blur dark:border-brand-grid/25 dark:bg-brand-black/75">
									<HeroMetric
										label="Eventos LATAM"
										value={data.counts.events}
									/>
									<HeroMetric
										label="Comunidades"
										value={data.counts.communities}
									/>
									<HeroMetric
										label="Hackathons"
										value={data.counts.hackathons}
									/>
									<HeroMetric
										label="Países soportados"
										value={data.counts.countries}
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-b bg-background">
					<div className="mx-auto max-w-screen-xl px-4 py-6 lg:px-8">
						<div className="border bg-card p-4 sm:p-5">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div className="max-w-3xl">
									<div className="mb-3 h-3 w-12 bg-brand-green" />
									<h2 className="text-lg font-semibold">
										Directorio vivo para builders de LATAM
									</h2>
									<p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
										Encuentra eventos, comunidades, labs y oportunidades por
										país. Cuando una comunidad publica, el índice mejora para
										toda la región.
									</p>
								</div>
								<div className="flex items-center gap-4 lg:text-right">
									<div>
										<div className="font-mono text-2xl font-semibold text-brand-green">
											{activeCountryCount}/{data.counts.countries}
										</div>
										<div className="text-xs text-muted-foreground">
											con señal
										</div>
									</div>
									<Button asChild variant="outline" size="sm" className="gap-2">
										<Link href="/data-health">
											Ver cobertura
											<ArrowRight className="size-4" />
										</Link>
									</Button>
								</div>
							</div>
							<div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								<FacetLink
									href="/events"
									icon={CalendarDays}
									label="Eventos activos"
									value={data.counts.upcoming}
									helper="para esta temporada"
								/>
								<FacetLink
									href="/c/discover"
									icon={Users}
									label="Comunidades"
									value={data.counts.communities}
									helper="mapeadas"
								/>
								<FacetLink
									href="/events?eventType=hackathon,competition,olympiad,robotics"
									icon={Zap}
									label="Hackathons"
									value={data.counts.hackathons}
									helper="históricos"
								/>
								<FacetLink
									href="/c/discover?types=university,student_org"
									icon={FlaskConical}
									label="Universidades y labs"
									value={data.counts.labs}
									helper="por verificar"
								/>
								<FacetLink
									href="/opportunities"
									icon={BookOpen}
									label="Grants y programas"
									value={data.counts.opportunities}
									helper="directorio"
								/>
								<FacetLink
									href="/builders"
									icon={Code2}
									label="Builders y hosts"
									value={data.counts.builders}
									helper="desde eventos"
								/>
							</div>
							<div className="mt-5 border-t pt-4">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<h3 className="text-sm font-semibold">
											Cobertura por país
										</h3>
										<p className="mt-1 text-xs text-muted-foreground">
											Priorizamos toda LATAM, no solo Perú.
										</p>
									</div>
									<Link
										href="/roadmap#latam"
										className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
									>
										Ver todos los países
										<ArrowRight className="size-3" />
									</Link>
								</div>
								<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
									{data.countryCoverage.slice(0, 8).map((country) => (
										<CountryCoverageRow key={country.code} country={country} />
									))}
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto grid max-w-screen-xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 py-8">
					<div className="space-y-8">
						<SectionHeader
							title="Próximos eventos"
							description="El pulso público para builders, estudiantes, founders y comunidades."
							href="/events"
						/>
						<div className="grid gap-3">
							{data.upcoming.map((event) => (
								<EventIndexRow key={event.id} event={event} />
							))}
						</div>

						<SectionHeader
							title="Hackathons y retos"
							description="Eventos que producen proyectos, repos y nuevos builders para el índice."
							href="/events?eventType=hackathon,competition,olympiad,robotics"
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
									<Link href="/c/discover">Abrir directorio</Link>
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
											State of Builders in LATAM
										</h2>
										<p className="mt-1 text-xs leading-5 text-muted-foreground">
											La versión trimestral debe salir de estos datos: eventos,
											comunidades, labs, programas, sponsors y builders por
											país.
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
		<div className="border-b border-r border-brand-forest/20 p-4 last:border-r-0 even:border-r-0 sm:p-5 dark:border-brand-grid/25">
			<div className="font-mono text-2xl font-semibold text-brand-black dark:text-brand-paper">
				{formatNumber(value)}
			</div>
			<div className="mt-1 text-xs text-brand-forest/75 dark:text-brand-grid">
				{label}
			</div>
		</div>
	);
}

function LatamSignalMap({
	activeCountryCount,
	countryCoverage,
	totalCountries,
}: {
	activeCountryCount: number;
	countryCoverage: LatamCountryCoverage[];
	totalCountries: number;
}) {
	const activeCountryIds = new Set(
		countryCoverage
			.filter((country) => country.signal > 0)
			.map((country) => ISO_TO_MAP_ID[country.code])
			.filter(Boolean),
	);

	return (
		<div className="relative overflow-hidden border border-brand-forest/20 bg-card/85 p-4 shadow-sm backdrop-blur dark:border-brand-grid/25 dark:bg-brand-black/75">
			<div className="relative z-10 flex items-start justify-between gap-4">
				<div>
					<div className="font-mono text-[10px] uppercase tracking-wider text-brand-forest/75 dark:text-brand-grid">
						continent map
					</div>
					<div className="mt-1 text-sm font-medium text-brand-black dark:text-brand-paper">
						Señal LATAM activa
					</div>
				</div>
				<div className="font-mono text-xs text-brand-forest dark:text-brand-green">
					{activeCountryCount}/{totalCountries}
				</div>
			</div>
			<div className="relative h-[300px]">
				<svg
					viewBox="-130 -80 1120 1180"
					className="absolute inset-0 h-full w-full"
					aria-hidden="true"
					preserveAspectRatio="xMidYMid meet"
				>
					{latamDotsData.map((country) => {
						const isActive = activeCountryIds.has(country.countryId);

						return (
							<g key={country.countryId}>
								{country.dots.map((dot, index) => (
									<rect
										key={index}
										x={dot.x - 2.2}
										y={dot.y - 2.2}
										width={4.4}
										height={4.4}
										fill={
											isActive
												? "var(--brand-green, #35c982)"
												: "var(--brand-map-muted, #2a3c31)"
										}
										opacity={isActive ? 0.62 : 0.22}
									/>
								))}
							</g>
						);
					})}
				</svg>
				<div className="absolute right-0 bottom-0 border border-brand-forest/25 bg-brand-paper/90 px-2.5 py-2 font-mono text-[10px] uppercase tracking-wider text-brand-forest dark:border-brand-grid/25 dark:bg-brand-black/85 dark:text-brand-grid">
					live index
				</div>
			</div>
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
			className="group flex items-center justify-between border bg-background px-3 py-3 transition-colors hover:border-brand-green/40 hover:bg-card"
		>
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center border bg-muted/40 text-muted-foreground group-hover:border-brand-green/50 group-hover:text-brand-green">
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

function CountryCoverageRow({ country }: { country: LatamCountryCoverage }) {
	const hasSignal = country.signal > 0;

	return (
		<Link
			href={`/events?country=${country.code}`}
			className="group flex min-h-14 items-center justify-between border bg-card px-3 py-2 transition-colors hover:border-brand-green/40 hover:bg-muted/30"
		>
			<div className="flex min-w-0 items-center gap-3">
				<div className="text-lg leading-none">{country.flag}</div>
				<div className="min-w-0">
					<div className="truncate text-sm font-medium">{country.name}</div>
					<div className="truncate text-xs text-muted-foreground">
						{hasSignal
							? `${formatEntityCount(country.events, "evento", "eventos")} · ${formatEntityCount(country.communities, "comunidad", "comunidades")}`
							: "Listo para mapear"}
					</div>
				</div>
			</div>
			<ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-green" />
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
				<h2 className="text-xl font-semibold">{title}</h2>
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

	return (
		<Link
			href={eventUrl}
			className="group grid gap-4 border bg-card p-3 transition-colors hover:border-brand-green/40 hover:bg-muted/20 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
		>
			<div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-square">
				<EventCover
					event={event}
					className="h-full w-full"
					imageClassName="transition-transform group-hover:scale-105"
					sizes="96px"
				/>
			</div>
			<div className="min-w-0 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge
						variant="secondary"
						className="h-5 rounded-none border-brand-grid/30 bg-brand-forest/20 font-mono text-[10px] text-brand-grid"
					>
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
					<h3 className="line-clamp-2 text-base font-semibold group-hover:underline">
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

	return (
		<Link
			href={eventUrl}
			className="group overflow-hidden border bg-card transition-colors hover:border-brand-green/40 hover:bg-muted/20"
		>
			<div className="relative aspect-[16/9] bg-muted">
				<EventCover
					event={event}
					className="h-full w-full"
					imageClassName="transition-transform group-hover:scale-105"
					sizes="(max-width: 768px) 100vw, 50vw"
				/>
			</div>
			<div className="space-y-2 border-t p-3">
				<Badge
					variant="outline"
					className="h-5 rounded-none border-brand-grid/30 font-mono text-[10px] text-brand-grid"
				>
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
				<div className="flex min-w-0 items-center gap-2">
					<h3 className="min-w-0 truncate text-sm font-medium group-hover:underline">
						{name}
					</h3>
					{community.isVerified && (
						<VerifiedBadge className="size-4 shrink-0 text-brand-green" />
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
