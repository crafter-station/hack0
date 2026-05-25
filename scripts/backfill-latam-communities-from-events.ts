import "dotenv/config";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventHosts, events, organizations } from "@/lib/db/schema";

type LatamEvent = {
	id: string;
	name: string;
	country: string | null;
	city: string | null;
	websiteUrl: string;
	eventImageUrl: string | null;
	organizationId: string;
	hosts: Array<{
		id: string;
		name: string;
		avatarUrl: string | null;
		representingOrgId: string | null;
	}>;
};

type CommunitySeed = {
	slug: string;
	name: string;
	country: string;
	city?: string;
	websiteUrl?: string;
	logoUrl?: string;
	tags: string[];
	hostNames?: string[];
	match: (event: LatamEvent) => boolean;
};

const LATAM_COUNTRIES = new Set([
	"AR",
	"BO",
	"BR",
	"CL",
	"CO",
	"EC",
	"GT",
	"MX",
	"SV",
	"UY",
]);

const dryRun = process.argv.includes("--dry-run");
const ownerUserId = process.env.SYSTEM_OWNER_USER_ID || "system_luma_backfill";

function normalized(value: string | null | undefined) {
	return (value || "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

function textIncludes(value: string | null | undefined, needle: string) {
	return normalized(value).includes(normalized(needle));
}

function hasHost(event: LatamEvent, hostName: string) {
	return event.hosts.some((host) => textIncludes(host.name, hostName));
}

function nameIncludes(event: LatamEvent, value: string) {
	return textIncludes(event.name, value);
}

function urlIncludes(event: LatamEvent, value: string) {
	return textIncludes(event.websiteUrl, value);
}

function country(country: string, match: (event: LatamEvent) => boolean) {
	return (event: LatamEvent) => event.country === country && match(event);
}

function faviconUrl(websiteUrl: string) {
	const { hostname } = new URL(websiteUrl);
	return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
}

const cursorLogo = faviconUrl("https://cursor.com");
const n8nLogo = faviconUrl("https://n8n.io");
const claudeLogo = faviconUrl("https://anthropic.com");
const vercelLogo = faviconUrl("https://vercel.com");

const seeds: CommunitySeed[] = [
	{
		slug: "n8n-community-argentina",
		name: "n8n Community Argentina",
		country: "AR",
		city: "Buenos Aires",
		websiteUrl: "https://n8n.io/community/",
		logoUrl: n8nLogo,
		tags: ["automation", "ai", "n8n", "luma-backfill"],
		hostNames: ["n8n"],
		match: country(
			"AR",
			(event) => hasHost(event, "n8n") || nameIncludes(event, "n8n"),
		),
	},
	{
		slug: "mar-del-plata-dev",
		name: "Mar del Plata Dev",
		country: "AR",
		city: "Mar del Plata",
		tags: ["developers", "community", "luma-backfill"],
		hostNames: ["Mar del Plata Dev"],
		match: country("AR", (event) => hasHost(event, "Mar del Plata Dev")),
	},
	{
		slug: "platanus-build-night",
		name: "Platanus Build Night",
		country: "AR",
		city: "Buenos Aires",
		websiteUrl: "https://build-night.platan.us/",
		tags: ["builders", "hackathon", "luma-backfill"],
		match: country("AR", (event) =>
			urlIncludes(event, "build-night.platan.us"),
		),
	},
	{
		slug: "dev3pack",
		name: "dev3pack",
		country: "AR",
		city: "Buenos Aires",
		tags: ["builders", "ai", "luma-backfill"],
		hostNames: ["dev3pack"],
		match: (event) =>
			(event.country === "AR" || event.country === "BO") &&
			hasHost(event, "dev3pack"),
	},
	{
		slug: "buidlers-argentina",
		name: "Buidlers Argentina",
		country: "AR",
		city: "Buenos Aires",
		tags: ["builders", "ai", "luma-backfill"],
		hostNames: ["Buidlers"],
		match: country("AR", (event) => hasHost(event, "Buidlers")),
	},
	{
		slug: "aiwknd",
		name: "AIWKND",
		country: "AR",
		city: "Mendoza",
		tags: ["ai", "builders", "luma-backfill"],
		hostNames: ["AIWKND"],
		match: country("AR", (event) => hasHost(event, "AIWKND")),
	},
	{
		slug: "n8n-community-brasil",
		name: "n8n Community Brasil",
		country: "BR",
		city: "São Paulo",
		websiteUrl: "https://n8n.io/community/",
		logoUrl: n8nLogo,
		tags: ["automation", "ai", "n8n", "luma-backfill"],
		hostNames: ["n8n"],
		match: country(
			"BR",
			(event) => hasHost(event, "n8n") || nameIncludes(event, "n8n"),
		),
	},
	{
		slug: "founder-haus",
		name: "Founder Haus",
		country: "BR",
		city: "Florianópolis",
		tags: ["founders", "builders", "luma-backfill"],
		hostNames: ["Founder Haus"],
		match: country("BR", (event) => hasHost(event, "Founder Haus")),
	},
	{
		slug: "ipe-city",
		name: "Ipê City",
		country: "BR",
		city: "Florianópolis",
		tags: ["builders", "startup", "luma-backfill"],
		hostNames: ["Ipê City"],
		match: country("BR", (event) => hasHost(event, "Ipê City")),
	},
	{
		slug: "product-arena-brasil",
		name: "Product Arena Brasil",
		country: "BR",
		city: "Rio de Janeiro",
		tags: ["product", "builders", "luma-backfill"],
		hostNames: ["Product Arena"],
		match: country("BR", (event) => hasHost(event, "Product Arena")),
	},
	{
		slug: "kamay-code-rio",
		name: "Kamay Code Rio",
		country: "BR",
		city: "Rio de Janeiro",
		tags: ["builders", "coding", "luma-backfill"],
		match: country("BR", (event) => nameIncludes(event, "Kamay Code")),
	},
	{
		slug: "startup-weekend-women-rio",
		name: "Startup Weekend Women Rio",
		country: "BR",
		city: "Rio de Janeiro",
		websiteUrl: "https://www.techstars.com/communities/startup-weekend",
		tags: ["startup-weekend", "women", "startup", "luma-backfill"],
		match: country("BR", (event) =>
			nameIncludes(event, "Startup Weekend Women"),
		),
	},
	{
		slug: "bendita-ia",
		name: "Bendita IA",
		country: "CL",
		city: "Santiago",
		tags: ["ai", "legaltech", "builders", "luma-backfill"],
		hostNames: ["Bendita IA"],
		match: country("CL", (event) => hasHost(event, "Bendita IA")),
	},
	{
		slug: "ai-tinkerers-santiago",
		name: "AI Tinkerers Santiago",
		country: "CL",
		city: "Santiago",
		websiteUrl: "https://santiago.aitinkerers.org/",
		tags: ["ai", "builders", "luma-backfill"],
		match: country("CL", (event) => urlIncludes(event, "aitinkerers.org")),
	},
	{
		slug: "she-ships-colombia",
		name: "She Ships Colombia",
		country: "CO",
		city: "Bogotá",
		websiteUrl: "https://sheships.org",
		tags: ["women", "hackathon", "builders", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "She Ships")),
	},
	{
		slug: "fundacion-codigo-abierto",
		name: "Fundación Código Abierto",
		country: "CO",
		city: "Barranquilla",
		tags: ["open-source", "developers", "luma-backfill"],
		hostNames: ["Fundación Código Abierto"],
		match: country("CO", (event) => hasHost(event, "Fundación Código Abierto")),
	},
	{
		slug: "young-ai-leaders-bogota",
		name: "Young AI Leaders Bogotá",
		country: "CO",
		city: "Bogotá",
		tags: ["ai", "robotics", "students", "luma-backfill"],
		hostNames: ["Young AI Leaders"],
		match: country("CO", (event) => hasHost(event, "Young AI Leaders")),
	},
	{
		slug: "latambuilds-colombia",
		name: "LatamBuilds Colombia",
		country: "CO",
		city: "Bogotá",
		tags: ["gtm", "builders", "hackathon", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "LatamBuilds")),
	},
	{
		slug: "n8n-community-colombia",
		name: "n8n Community Colombia",
		country: "CO",
		city: "Bogotá",
		websiteUrl: "https://n8n.io/community/",
		logoUrl: n8nLogo,
		tags: ["automation", "ai", "n8n", "luma-backfill"],
		hostNames: ["n8n"],
		match: country(
			"CO",
			(event) => hasHost(event, "n8n") || nameIncludes(event, "n8n"),
		),
	},
	{
		slug: "crafter-station-colombia",
		name: "Crafter Station Colombia",
		country: "CO",
		city: "Bogotá",
		websiteUrl: "https://crafter-station.com",
		tags: ["builders", "ai", "community", "luma-backfill"],
		match: country(
			"CO",
			(event) =>
				nameIncludes(event, "Code Brew") ||
				nameIncludes(event, "v0 Prompt") ||
				nameIncludes(event, "v0 Zero to Agent"),
		),
	},
	{
		slug: "avvy-colombia",
		name: "Avvy Colombia",
		country: "CO",
		city: "Barranquilla",
		tags: ["hackathon", "ai", "builders", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "Avvy")),
	},
	{
		slug: "startups-vc-medellin",
		name: "Startups & VC Medellín",
		country: "CO",
		city: "Medellín",
		tags: ["startups", "vc", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "Startups & VC")),
	},
	{
		slug: "the-builders-ecuador",
		name: "The Builders Ecuador",
		country: "EC",
		city: "Guayaquil",
		tags: ["builders", "developers", "luma-backfill"],
		hostNames: ["The Builders"],
		match: country("EC", (event) => hasHost(event, "The Builders")),
	},
	{
		slug: "vudy-app",
		name: "Vudy App",
		country: "GT",
		city: "Ciudad de Guatemala",
		tags: ["builders", "startup", "luma-backfill"],
		hostNames: ["Vudy App"],
		match: country("GT", (event) => hasHost(event, "Vudy App")),
	},
	{
		slug: "the502project",
		name: "the502project",
		country: "GT",
		city: "Ciudad de Guatemala",
		tags: ["developers", "community", "luma-backfill"],
		hostNames: ["the502project"],
		match: country("GT", (event) => hasHost(event, "the502project")),
	},
	{
		slug: "we-solve-guatemala",
		name: "We Solve Guatemala",
		country: "GT",
		city: "Ciudad de Guatemala",
		tags: ["women", "builders", "luma-backfill"],
		hostNames: ["We Solve"],
		match: country("GT", (event) => hasHost(event, "We Solve")),
	},
	{
		slug: "latambuilds-mexico",
		name: "LatamBuilds México",
		country: "MX",
		city: "Ciudad de México",
		tags: ["gtm", "builders", "hackathon", "luma-backfill"],
		match: country("MX", (event) => nameIncludes(event, "LatamBuilds")),
	},
	{
		slug: "product-latam-mexico",
		name: "Product LatAm México",
		country: "MX",
		city: "Ciudad de México",
		tags: ["product", "builders", "luma-backfill"],
		hostNames: ["Product LatAm"],
		match: country("MX", (event) => hasHost(event, "Product LatAm")),
	},
	{
		slug: "la-cripto-plebada",
		name: "La Cripto Plebada",
		country: "MX",
		city: "Culiacán",
		tags: ["crypto", "developers", "luma-backfill"],
		hostNames: ["La Cripto Plebada"],
		match: country("MX", (event) => hasHost(event, "La Cripto Plebada")),
	},
	{
		slug: "sabia-dev",
		name: "Sabia dev",
		country: "MX",
		city: "Puebla",
		tags: ["developers", "community", "luma-backfill"],
		hostNames: ["Sabia dev"],
		match: country("MX", (event) => hasHost(event, "Sabia dev")),
	},
	{
		slug: "ai-salon-hermosillo",
		name: "AI Salon Hermosillo",
		country: "MX",
		city: "Hermosillo",
		tags: ["ai", "builders", "luma-backfill"],
		match: country("MX", (event) => nameIncludes(event, "AI Salon Hermosillo")),
	},
	{
		slug: "cursor-community-argentina",
		name: "Cursor Community Argentina",
		country: "AR",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("AR", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-bolivia",
		name: "Cursor Community Bolivia",
		country: "BO",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("BO", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-brasil",
		name: "Cursor Community Brasil",
		country: "BR",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("BR", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-colombia",
		name: "Cursor Community Colombia",
		country: "CO",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-ecuador",
		name: "Cursor Community Ecuador",
		country: "EC",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("EC", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-mexico",
		name: "Cursor Community México",
		country: "MX",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("MX", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-el-salvador",
		name: "Cursor Community El Salvador",
		country: "SV",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("SV", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "cursor-community-uruguay",
		name: "Cursor Community Uruguay",
		country: "UY",
		websiteUrl: "https://cursor.com/community",
		logoUrl: cursorLogo,
		tags: ["cursor", "ai", "developers", "luma-backfill"],
		match: country("UY", (event) => nameIncludes(event, "Cursor")),
	},
	{
		slug: "claude-code-brasil",
		name: "Claude Code Brasil",
		country: "BR",
		websiteUrl: "https://www.anthropic.com/claude-code",
		logoUrl: claudeLogo,
		tags: ["claude-code", "ai", "developers", "luma-backfill"],
		match: country("BR", (event) => nameIncludes(event, "Claude Code")),
	},
	{
		slug: "claude-code-mexico",
		name: "Claude Code México",
		country: "MX",
		websiteUrl: "https://www.anthropic.com/claude-code",
		logoUrl: claudeLogo,
		tags: ["claude-code", "ai", "developers", "luma-backfill"],
		match: country("MX", (event) => nameIncludes(event, "Claude Code")),
	},
	{
		slug: "agentic-builders-argentina",
		name: "Agentic Builders Argentina",
		country: "AR",
		websiteUrl: "https://vercel.com",
		logoUrl: vercelLogo,
		tags: ["agents", "ai", "builders", "luma-backfill"],
		match: country("AR", (event) => nameIncludes(event, "Zero to Agent")),
	},
	{
		slug: "agentic-builders-bolivia",
		name: "Agentic Builders Bolivia",
		country: "BO",
		websiteUrl: "https://vercel.com",
		logoUrl: vercelLogo,
		tags: ["agents", "ai", "builders", "luma-backfill"],
		match: country("BO", (event) => nameIncludes(event, "Zero to Agent")),
	},
	{
		slug: "agentic-builders-brasil",
		name: "Agentic Builders Brasil",
		country: "BR",
		websiteUrl: "https://vercel.com",
		logoUrl: vercelLogo,
		tags: ["agents", "ai", "builders", "luma-backfill"],
		match: country("BR", (event) => nameIncludes(event, "Zero to Agent")),
	},
	{
		slug: "agentic-builders-colombia",
		name: "Agentic Builders Colombia",
		country: "CO",
		websiteUrl: "https://vercel.com",
		logoUrl: vercelLogo,
		tags: ["agents", "ai", "builders", "luma-backfill"],
		match: country("CO", (event) => nameIncludes(event, "Zero to Agent")),
	},
	{
		slug: "agentic-builders-uruguay",
		name: "Agentic Builders Uruguay",
		country: "UY",
		websiteUrl: "https://vercel.com",
		logoUrl: vercelLogo,
		tags: ["agents", "ai", "builders", "luma-backfill"],
		match: country("UY", (event) => nameIncludes(event, "Zero to Agent")),
	},
];

function firstUsefulImage(seed: CommunitySeed, matchedEvents: LatamEvent[]) {
	if (seed.logoUrl) return seed.logoUrl;
	if (seed.websiteUrl) return faviconUrl(seed.websiteUrl);

	const hostAvatar = matchedEvents
		.flatMap((event) => event.hosts)
		.find(
			(host) =>
				host.avatarUrl &&
				seed.hostNames?.some((hostName) => textIncludes(host.name, hostName)),
		)?.avatarUrl;

	return (
		hostAvatar ||
		matchedEvents.find((event) => event.eventImageUrl)?.eventImageUrl ||
		null
	);
}

async function fetchLatamEvents() {
	const eventRows = await db
		.select({
			id: events.id,
			name: events.name,
			country: events.country,
			city: events.city,
			websiteUrl: events.websiteUrl,
			eventImageUrl: events.eventImageUrl,
			organizationId: events.organizationId,
		})
		.from(events)
		.where(and(isNull(events.parentEventId), ne(events.country, "PE")));

	const latamEvents = eventRows.filter(
		(event) => event.country && LATAM_COUNTRIES.has(event.country),
	);

	if (latamEvents.length === 0) return [];

	const hostRows = await db
		.select({
			id: eventHosts.id,
			eventId: eventHosts.eventId,
			name: eventHosts.name,
			avatarUrl: eventHosts.avatarUrl,
			representingOrgId: eventHosts.representingOrgId,
		})
		.from(eventHosts)
		.where(
			inArray(
				eventHosts.eventId,
				latamEvents.map((event) => event.id),
			),
		);

	const hostsByEvent = new Map<string, LatamEvent["hosts"]>();
	for (const host of hostRows) {
		const current = hostsByEvent.get(host.eventId) || [];
		current.push(host);
		hostsByEvent.set(host.eventId, current);
	}

	return latamEvents.map((event) => ({
		...event,
		hosts: hostsByEvent.get(event.id) || [],
	}));
}

async function upsertCommunity(
	seed: CommunitySeed,
	matchedEvents: LatamEvent[],
) {
	const existing = await db.query.organizations.findFirst({
		where: eq(organizations.slug, seed.slug),
	});
	const logoUrl = firstUsefulImage(seed, matchedEvents);
	const values = {
		slug: seed.slug,
		name: seed.name,
		displayName: seed.name,
		description: `Comunidad LATAM mapeada desde ${matchedEvents.length} evento${matchedEvents.length === 1 ? "" : "s"} en Hack0.`,
		type: "community" as const,
		country: seed.country,
		city: seed.city || matchedEvents[0]?.city || null,
		websiteUrl: seed.websiteUrl || matchedEvents[0]?.websiteUrl || null,
		logoUrl,
		ownerUserId,
		isPublic: true,
		isPersonalOrg: false,
		isVerified: false,
		tags: seed.tags,
		updatedAt: new Date(),
	};

	if (dryRun) {
		return {
			id: existing?.id || `dry-run:${seed.slug}`,
			action: existing ? "would_update" : "would_create",
		};
	}

	if (existing) {
		await db
			.update(organizations)
			.set(values)
			.where(eq(organizations.id, existing.id));
		return { id: existing.id, action: "updated" };
	}

	const [created] = await db.insert(organizations).values(values).returning({
		id: organizations.id,
	});

	return { id: created.id, action: "created" };
}

async function main() {
	const latamEvents = await fetchLatamEvents();
	const matchedBySeed = new Map<string, LatamEvent[]>();
	const assignmentByEvent = new Map<string, CommunitySeed>();

	for (const event of latamEvents) {
		const seed = seeds.find((candidate) => candidate.match(event));
		if (!seed) continue;

		assignmentByEvent.set(event.id, seed);
		const current = matchedBySeed.get(seed.slug) || [];
		current.push(event);
		matchedBySeed.set(seed.slug, current);
	}

	const communityResults = [];
	const eventAssignments = [];
	const hostAssignments = [];

	for (const seed of seeds) {
		const matchedEvents = matchedBySeed.get(seed.slug);
		if (!matchedEvents?.length) continue;

		const community = await upsertCommunity(seed, matchedEvents);
		communityResults.push({
			slug: seed.slug,
			name: seed.name,
			country: seed.country,
			action: community.action,
			events: matchedEvents.length,
		});

		for (const event of matchedEvents) {
			eventAssignments.push({
				eventId: event.id,
				eventName: event.name,
				country: event.country,
				fromOrganizationId: event.organizationId,
				toOrganizationId: community.id,
				communitySlug: seed.slug,
			});

			if (!dryRun) {
				await db
					.update(events)
					.set({
						organizationId: community.id,
						updatedAt: new Date(),
					})
					.where(eq(events.id, event.id));
			}

			const matchingHosts = seed.hostNames?.length
				? event.hosts.filter((host) =>
						seed.hostNames?.some((hostName) =>
							textIncludes(host.name, hostName),
						),
					)
				: [];

			for (const host of matchingHosts) {
				hostAssignments.push({
					hostId: host.id,
					hostName: host.name,
					eventName: event.name,
					communitySlug: seed.slug,
				});

				if (!dryRun) {
					await db
						.update(eventHosts)
						.set({
							representingOrgId: community.id,
							updatedAt: new Date(),
						})
						.where(eq(eventHosts.id, host.id));
				}
			}
		}
	}

	const unmatchedEvents = latamEvents
		.filter((event) => !assignmentByEvent.has(event.id))
		.map((event) => ({
			country: event.country,
			city: event.city,
			name: event.name,
			hosts: event.hosts.map((host) => host.name),
		}));

	console.log(
		JSON.stringify(
			{
				dryRun,
				latamEvents: latamEvents.length,
				communitiesTouched: communityResults.length,
				eventsAssigned: eventAssignments.length,
				hostsAssigned: hostAssignments.length,
				unmatchedEvents: unmatchedEvents.length,
				communityResults,
				unmatchedEventsSample: unmatchedEvents.slice(0, 20),
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
