import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { getBuilderDirectorySummary } from "@/lib/builders-directory";
import { db } from "@/lib/db";
import {
	communityMembers,
	eventHosts,
	eventSponsors,
	events,
	organizationRelationships,
	organizations,
	scrapeRuns,
	scrapeSources,
	users,
} from "@/lib/db/schema";
import {
	EVENT_TYPE_LABELS,
	ORGANIZER_TYPE_LABELS,
} from "@/lib/db/schema/constants";

const PERU = "PE";
const HACKATHON_TYPES = [
	"hackathon",
	"competition",
	"olympiad",
	"robotics",
] as const;
const OPPORTUNITY_TYPES = [
	"accelerator",
	"incubator",
	"fellowship",
	"call_for_papers",
] as const;
const UNIVERSITY_TYPES = ["university", "student_org"] as const;

export type CoverageStatus = "live" | "needs_backfill" | "not_modeled";

export type CoverageFacet = {
	id: string;
	label: string;
	count: number;
	status: CoverageStatus;
	href: string | null;
	source: string;
	evidence: string;
	nextAction: string;
};

export type CoverageBreakdownRow = {
	label: string;
	count: number;
	helper: string;
};

export type QualitySignal = {
	label: string;
	value: number;
	total: number;
	severity: "good" | "watch" | "fix";
	nextAction: string;
};

export type IndexDataHealth = {
	updatedAt: Date | null;
	latestSourceScrapedAt: Date | null;
	facets: CoverageFacet[];
	sourceBreakdown: CoverageBreakdownRow[];
	eventTypeBreakdown: CoverageBreakdownRow[];
	organizationTypeBreakdown: CoverageBreakdownRow[];
	cityBreakdown: CoverageBreakdownRow[];
	qualitySignals: QualitySignal[];
	operations: {
		activeScrapeSources: number;
		scrapeRuns: number;
		completedScrapeRuns: number;
		failedScrapeRuns: number;
		importedMemberships: number;
		claimedProfiles: number;
		sponsors: number;
		sponsoredEvents: number;
		relationships: number;
	};
};

function toNumber(value: unknown) {
	return Number(value || 0);
}

function toDate(value: Date | string | null | undefined) {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function statusFor(countValue: number, modeled = true): CoverageStatus {
	if (!modeled) return "not_modeled";
	return countValue > 0 ? "live" : "needs_backfill";
}

function signalSeverity(
	value: number,
	total: number,
): QualitySignal["severity"] {
	if (total === 0 || value === 0) return "good";
	const ratio = value / total;
	if (ratio >= 0.3) return "fix";
	return "watch";
}

export async function getIndexDataHealth(): Promise<IndexDataHealth> {
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

	const [
		[eventCounts],
		[organizationCounts],
		builderSummary,
		[membershipCounts],
		[sponsorCounts],
		[relationshipCounts],
		[userCounts],
		[scrapeCounts],
		sourceRows,
		eventTypeRows,
		organizationTypeRows,
		cityRows,
		[qualityCounts],
	] = await Promise.all([
		db
			.select({
				eventsCount: count(events.id),
				upcomingEvents: sql<number>`count(*) filter (where ${events.endDate} is null or ${events.endDate} >= now())::int`,
				hackathons: sql<number>`count(*) filter (where ${events.eventType} in ('hackathon', 'competition', 'olympiad', 'robotics'))::int`,
				opportunities: sql<number>`count(*) filter (where ${events.eventType} in ('accelerator', 'incubator', 'fellowship', 'call_for_papers'))::int`,
				cities: sql<number>`count(distinct ${events.city}) filter (where ${events.city} is not null and btrim(${events.city}) <> '')::int`,
				updatedAt: sql<Date | null>`max(${events.updatedAt})`,
				latestSourceScrapedAt: sql<Date | null>`max(${events.sourceScrapedAt})`,
			})
			.from(events)
			.where(approvedPeruEventsWhere),
		db
			.select({
				totalOrganizations: count(organizations.id),
				verifiedOrganizations: sql<number>`count(*) filter (where ${organizations.isVerified} = true)::int`,
				labs: sql<number>`count(*) filter (where ${organizations.type} in ('university', 'student_org'))::int`,
				missingLogos: sql<number>`count(*) filter (where ${organizations.logoUrl} is null or btrim(${organizations.logoUrl}) = '')::int`,
				missingWebsites: sql<number>`count(*) filter (where ${organizations.websiteUrl} is null or btrim(${organizations.websiteUrl}) = '')::int`,
			})
			.from(organizations)
			.where(publicOrgWhere),
		getBuilderDirectorySummary(),
		db
			.select({
				importedMemberships: count(communityMembers.id),
				uniqueMembers: sql<number>`count(distinct ${communityMembers.userId})::int`,
			})
			.from(communityMembers)
			.innerJoin(
				organizations,
				eq(communityMembers.communityId, organizations.id),
			)
			.where(publicOrgWhere),
		db
			.select({
				sponsors: count(eventSponsors.id),
				sponsoredEvents: sql<number>`count(distinct ${eventSponsors.eventId})::int`,
			})
			.from(eventSponsors)
			.innerJoin(events, eq(eventSponsors.eventId, events.id))
			.where(approvedPeruEventsWhere),
		db
			.select({
				relationships: count(organizationRelationships.id),
			})
			.from(organizationRelationships),
		db
			.select({
				claimedProfiles: count(users.id),
				publicPeruProfiles: sql<number>`count(*) filter (where ${users.isPublic} = true and ${users.country} = ${PERU})::int`,
			})
			.from(users),
		db
			.select({
				activeScrapeSources: sql<number>`count(*) filter (where ${scrapeSources.isActive} = true)::int`,
				scrapeRuns: sql<number>`count(${scrapeRuns.id})::int`,
				completedScrapeRuns: sql<number>`count(${scrapeRuns.id}) filter (where ${scrapeRuns.status} = 'completed')::int`,
				failedScrapeRuns: sql<number>`count(${scrapeRuns.id}) filter (where ${scrapeRuns.status} = 'failed')::int`,
			})
			.from(scrapeSources)
			.leftJoin(scrapeRuns, eq(scrapeRuns.sourceId, scrapeSources.id)),
		db
			.select({
				source: events.scrapeSource,
				count: count(events.id),
			})
			.from(events)
			.where(approvedPeruEventsWhere)
			.groupBy(events.scrapeSource)
			.orderBy(desc(count(events.id)))
			.limit(8),
		db
			.select({
				eventType: events.eventType,
				count: count(events.id),
			})
			.from(events)
			.where(approvedPeruEventsWhere)
			.groupBy(events.eventType)
			.orderBy(desc(count(events.id)))
			.limit(8),
		db
			.select({
				type: organizations.type,
				count: count(organizations.id),
			})
			.from(organizations)
			.where(publicOrgWhere)
			.groupBy(organizations.type)
			.orderBy(desc(count(organizations.id)))
			.limit(8),
		db
			.select({
				city: events.city,
				count: count(events.id),
			})
			.from(events)
			.where(approvedPeruEventsWhere)
			.groupBy(events.city)
			.orderBy(desc(count(events.id)))
			.limit(8),
		db
			.select({
				physicalEventsWithoutCity: sql<number>`count(distinct ${events.id}) filter (where ${events.format} in ('in-person', 'hybrid') and (${events.city} is null or btrim(${events.city}) = ''))::int`,
				eventsWithoutImage: sql<number>`count(distinct ${events.id}) filter (where ${events.eventImageUrl} is null or btrim(${events.eventImageUrl}) = '')::int`,
				eventsWithoutHosts: sql<number>`count(distinct ${events.id}) filter (where ${eventHosts.id} is null)::int`,
			})
			.from(events)
			.leftJoin(eventHosts, eq(eventHosts.eventId, events.id))
			.where(approvedPeruEventsWhere),
	]);

	const totalEvents = toNumber(eventCounts?.eventsCount);
	const totalOrganizations = toNumber(organizationCounts?.totalOrganizations);
	const hackathons = toNumber(eventCounts?.hackathons);
	const opportunities = toNumber(eventCounts?.opportunities);
	const labs = toNumber(organizationCounts?.labs);
	const builders = toNumber(builderSummary.builders);

	const facets: CoverageFacet[] = [
		{
			id: "events",
			label: "Eventos",
			count: totalEvents,
			status: statusFor(totalEvents),
			href: "/events?country=PE",
			source: "events",
			evidence: `${toNumber(eventCounts?.upcomingEvents)} upcoming, ${toNumber(eventCounts?.cities)} ciudades`,
			nextAction:
				"Mantener Luma como fuente primaria y completar ciudad, imagen y hosts.",
		},
		{
			id: "communities",
			label: "Comunidades",
			count: totalOrganizations,
			status: statusFor(totalOrganizations),
			href: "/c/discover?countries=PE",
			source: "organizations",
			evidence: `${toNumber(organizationCounts?.verifiedOrganizations)} verificadas`,
			nextAction:
				"Completar logo, website y tipo de comunidad en cada organización pública.",
		},
		{
			id: "hackathons",
			label: "Hackathons",
			count: hackathons,
			status: statusFor(hackathons),
			href: "/events?country=PE&eventType=hackathon,competition,olympiad,robotics",
			source: "events.event_type",
			evidence: HACKATHON_TYPES.join(", "),
			nextAction:
				"Separar hackathons reales de talleres y charlas durante el backfill.",
		},
		{
			id: "labs",
			label: "Universidades y labs",
			count: labs,
			status: statusFor(labs),
			href: "/c/discover?countries=PE&types=university,student_org",
			source: "organizations.type",
			evidence: UNIVERSITY_TYPES.join(", "),
			nextAction:
				"Backfill de laboratorios, capítulos ACM/IEEE y grupos estudiantiles.",
		},
		{
			id: "opportunities",
			label: "Grants y programas",
			count: opportunities,
			status: statusFor(opportunities),
			href: "/events?country=PE&eventType=accelerator,incubator,fellowship,call_for_papers",
			source: "events.event_type",
			evidence: OPPORTUNITY_TYPES.join(", "),
			nextAction:
				"Importar becas, grants, incubadoras, aceleradoras y convocatorias abiertas.",
		},
		{
			id: "builders",
			label: "Builders y hosts",
			count: builders,
			status: statusFor(builders),
			href: "/builders",
			source: "event_hosts",
			evidence: `${toNumber(builderSummary.hostAppearances)} apariciones en ${toNumber(builderSummary.events)} eventos`,
			nextAction:
				"Dedupe manual de nombres, perfiles reclamables y links sociales.",
		},
		{
			id: "demos",
			label: "Demo projects",
			count: 0,
			status: statusFor(0, false),
			href: null,
			source: "pendiente",
			evidence: "sin modelo público",
			nextAction:
				"Crear dataset mínimo: evento, demo, GitHub, equipo, video y tags.",
		},
		{
			id: "workflows",
			label: "AI workflows",
			count: 0,
			status: statusFor(0, false),
			href: null,
			source: "pendiente",
			evidence: "sin modelo público",
			nextAction: "Curar workflows reutilizables desde demos y eventos de IA.",
		},
	];

	const sourceBreakdown = sourceRows.map((row) => ({
		label: row.source || "manual",
		count: toNumber(row.count),
		helper: "eventos aprobados PE",
	}));

	const eventTypeBreakdown = eventTypeRows.map((row) => ({
		label: row.eventType
			? EVENT_TYPE_LABELS[row.eventType] || row.eventType
			: "Sin tipo",
		count: toNumber(row.count),
		helper: row.eventType || "sin_tipo",
	}));

	const organizationTypeBreakdown = organizationTypeRows.map((row) => ({
		label: row.type ? ORGANIZER_TYPE_LABELS[row.type] || row.type : "Sin tipo",
		count: toNumber(row.count),
		helper: row.type || "sin_tipo",
	}));

	const cityBreakdown = cityRows.map((row) => ({
		label: row.city || "Sin ciudad",
		count: toNumber(row.count),
		helper: "eventos aprobados PE",
	}));

	const qualitySignals: QualitySignal[] = [
		{
			label: "Eventos físicos sin ciudad",
			value: toNumber(qualityCounts?.physicalEventsWithoutCity),
			total: totalEvents,
			severity: signalSeverity(
				toNumber(qualityCounts?.physicalEventsWithoutCity),
				totalEvents,
			),
			nextAction: "Completar city y department para mapa, SEO local y filtros.",
		},
		{
			label: "Eventos sin imagen",
			value: toNumber(qualityCounts?.eventsWithoutImage),
			total: totalEvents,
			severity: signalSeverity(
				toNumber(qualityCounts?.eventsWithoutImage),
				totalEvents,
			),
			nextAction:
				"Usar imagen de Luma o cover manual antes de promover eventos.",
		},
		{
			label: "Eventos sin hosts",
			value: toNumber(qualityCounts?.eventsWithoutHosts),
			total: totalEvents,
			severity: signalSeverity(
				toNumber(qualityCounts?.eventsWithoutHosts),
				totalEvents,
			),
			nextAction:
				"Revisar Luma imports sin hosts y asignar organizadores visibles.",
		},
		{
			label: "Organizaciones sin logo",
			value: toNumber(organizationCounts?.missingLogos),
			total: totalOrganizations,
			severity: signalSeverity(
				toNumber(organizationCounts?.missingLogos),
				totalOrganizations,
			),
			nextAction:
				"Agregar logo para que el directorio sea usable y reconocible.",
		},
		{
			label: "Organizaciones sin website",
			value: toNumber(organizationCounts?.missingWebsites),
			total: totalOrganizations,
			severity: signalSeverity(
				toNumber(organizationCounts?.missingWebsites),
				totalOrganizations,
			),
			nextAction: "Agregar web, Luma, LinkedIn, GitHub o Instagram oficial.",
		},
	];

	return {
		updatedAt: toDate(eventCounts?.updatedAt),
		latestSourceScrapedAt: toDate(eventCounts?.latestSourceScrapedAt),
		facets,
		sourceBreakdown,
		eventTypeBreakdown,
		organizationTypeBreakdown,
		cityBreakdown,
		qualitySignals,
		operations: {
			activeScrapeSources: toNumber(scrapeCounts?.activeScrapeSources),
			scrapeRuns: toNumber(scrapeCounts?.scrapeRuns),
			completedScrapeRuns: toNumber(scrapeCounts?.completedScrapeRuns),
			failedScrapeRuns: toNumber(scrapeCounts?.failedScrapeRuns),
			importedMemberships: toNumber(membershipCounts?.importedMemberships),
			claimedProfiles: toNumber(userCounts?.claimedProfiles),
			sponsors: toNumber(sponsorCounts?.sponsors),
			sponsoredEvents: toNumber(sponsorCounts?.sponsoredEvents),
			relationships: toNumber(relationshipCounts?.relationships),
		},
	};
}
