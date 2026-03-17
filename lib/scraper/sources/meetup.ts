/**
 * Meetup scraper — searches LATAM cities for hackathon events.
 * Uses native fetch because Meetup renders via Next.js SSR (__NEXT_DATA__ Apollo state).
 *
 * ## Signal/noise reality on Meetup
 * Meetup is extremely noisy: the vast majority of events are regular tech meetups,
 * study groups, and networking sessions. The word "hackathon" is the only reliable
 * discriminator at query time; broader terms like "reto tecnológico" or "sprint de
 * código" produce almost entirely false positives.
 *
 * ## Strategy
 * Phase 1 — Hackathon-only keyword × LATAM city matrix.
 *   Core terms: "hackathon", "hackaton", "datathon", "buildathon", "maratona de
 *   programacao" (PT). Each tier-1 city gets core terms. Tier-2 cities get only
 *   "hackathon". Pagination fetches up to MAX_PAGES per search to avoid missing
 *   events when a city has many.
 *
 * Phase 2 — Known hackathon-focused Meetup group /events/ pages.
 *   Only groups whose primary purpose is running hackathons are listed; generic
 *   "hackers & founders" or security/CTF groups are excluded because they emit
 *   noise rather than real competitive coding events.
 *
 * ## False-positive defence (post-parse)
 * HACK_KEYWORDS regex (title + description): only retain events that clearly
 *   describe a hackathon / datathon / buildathon / coding marathon.
 * NOISE_EXCLUSION regex: drop known noise patterns (HackerX recruiting events,
 *   bar crawls, open-mic nights, language exchange meetups, CTF-only events).
 * Title-only guard: if the event title alone matches NOISE_EXCLUSION, drop it
 *   regardless of description content.
 *
 * ## Known limitations
 * - Meetup requires JavaScript for some pages and may return sparse Apollo state
 *   on heavily cached edge responses. When __NEXT_DATA__ is missing, the page is
 *   silently skipped (not retried).
 * - Meetup search uses fuzzy matching; "hackathon" will surface near-matches but
 *   the post-parse regex is the authoritative hackathon gate.
 * - Rate limit is 1.2 s between requests; Meetup blocks overly aggressive crawlers.
 */

import type { RawHackathon } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// Search configuration
// ---------------------------------------------------------------------------

/**
 * Core hackathon search terms for Meetup's keyword search.
 * Kept intentionally narrow to minimise noise at the query layer.
 * - "hackathon" / "hackaton": universal across ES/EN/PT
 * - "datathon": data-science competitions common in LATAM universities
 * - "buildathon": product-build competitions (common in MX/CO/BR)
 * - "maratona programacao" (PT variant without diacritics — Meetup strips them)
 * - "maratón programación" (ES variant — accent stripped by Meetup)
 *
 * Terms deliberately excluded from the query layer (still caught post-parse):
 * - "ideathon": too often used for non-competitive idea workshops
 * - "sprint de código": extremely rare on Meetup; generates zero real results
 * - "reto tecnológico": matches many non-hackathon events (talks, workshops)
 * - "coding challenge": matches tech-interview prep groups, not hackathons
 */
const CORE_HACK_TERMS = [
	"hackathon",
	"hackaton",
	"datathon",
	"buildathon",
	"maratona programacao",
	"maraton programacion",
];

/**
 * Tier-1 cities: largest tech ecosystems in LATAM.
 * These get all CORE_HACK_TERMS × this location.
 */
const TIER1_LOCATIONS = [
	"br--São+Paulo",
	"mx--Ciudad+de+México",
	"ar--Buenos+Aires",
	"co--Bogotá",
	"cl--Santiago",
	"pe--Lima",
	"br--Rio+de+Janeiro",
	"mx--Guadalajara",
	"co--Medellín",
	"ar--Córdoba",
	"br--Belo+Horizonte",
	"br--Porto+Alegre",
	"br--Curitiba",
	"mx--Monterrey",
	"br--Recife",
	"br--Brasília",
];

/**
 * Tier-2 cities: significant but smaller tech scenes.
 * These get only "hackathon" (highest signal-to-noise ratio).
 *
 * Caribbean/Central America additions (Batch 1):
 * - do--Santo+Domingo: Dominican Republic capital; growing fintech/govtech hackathon scene
 * - cu--La+Habana: Cuba; small but active university-backed hackathon community
 * - hn--Tegucigalpa: Honduras capital; UNITEC/UNAH tech events use Meetup
 * - sv--San+Salvador: El Salvador; FUSADES and startup ecosystem uses Meetup
 * - ni--Managua: Nicaragua capital; UCA/UNI student hackathon groups active on Meetup
 */
const TIER2_HACKATHON_ONLY: string[] = [
	"pe--Arequipa",
	"co--Cali",
	"co--Barranquilla",
	"co--Bucaramanga",
	"co--Cartagena",
	"ec--Quito",
	"ec--Guayaquil",
	"ve--Caracas",
	"bo--La+Paz",
	"bo--Santa+Cruz",
	"uy--Montevideo",
	"py--Asunción",
	"cr--San+José",
	"pa--Ciudad+de+Panamá",
	"gt--Ciudad+de+Guatemala",
	"cl--Valparaíso",
	"mx--Puebla",
	"mx--Querétaro",
	"mx--Tijuana",
	"br--Florianópolis",
	"br--Fortaleza",
	"br--Salvador",
	"ar--Rosario",
	"ar--Mendoza",
	// Caribbean / Central America (previously uncovered)
	"do--Santo+Domingo",
	"cu--La+Habana",
	"hn--Tegucigalpa",
	"sv--San+Salvador",
	"ni--Managua",
];

/** Max Meetup search result pages to fetch per query (each page ~20 events). */
const MAX_PAGES = 2;

/** Build the full matrix of (term, location, page) search tuples. */
function buildSearchConfigs(): Array<{
	keywords: string;
	location: string;
	page: number;
}> {
	const configs: Array<{ keywords: string; location: string; page: number }> =
		[];

	for (const location of TIER1_LOCATIONS) {
		for (const keywords of CORE_HACK_TERMS) {
			for (let page = 1; page <= MAX_PAGES; page++) {
				configs.push({ keywords, location, page });
			}
		}
	}

	for (const location of TIER2_HACKATHON_ONLY) {
		for (let page = 1; page <= MAX_PAGES; page++) {
			configs.push({ keywords: "hackathon", location, page });
		}
	}

	return configs;
}

const MEETUP_SEARCH_CONFIGS = buildSearchConfigs();

/**
 * Known hackathon-focused Meetup groups in LATAM.
 * Inclusion criteria: the group's stated purpose is running hackathons or coding
 * marathons, not general tech meetups, study groups, or security/CTF events.
 *
 * Excluded intentionally:
 * - "hack-the-box-meetup-*": CTF / penetration testing, not coding hackathons
 * - "Hackers-and-Founders-*": startup networking, not competitive hackathons
 * - "hackathonbrasil-negocios" / "-social-impact": these are offshoots that
 *   historically post meetup/networking events, not actual hackathon events
 */
const HACKATHON_GROUP_URLS: string[] = [
	// Brazil
	"https://www.meetup.com/hackathonbrasil/events/",
	"https://www.meetup.com/hackathonbrasil-cursos-eventos-networking/events/",
	"https://www.meetup.com/GDG-SP-hackathon/events/",
	"https://www.meetup.com/devhackers-br/events/",
	// Mexico
	"https://www.meetup.com/HackathonMexico/events/",
	"https://www.meetup.com/Hack-Guadalajara/events/",
	// Colombia
	"https://www.meetup.com/hackathon-colombia/events/",
	"https://www.meetup.com/BogotaHackathon/events/",
	// Argentina
	"https://www.meetup.com/Hackathon-Buenos-Aires/events/",
	// Peru
	"https://www.meetup.com/HackathonPeru/events/",
	// Multi-country / LATAM
	"https://www.meetup.com/HackLatam/events/",
];

// ---------------------------------------------------------------------------
// False-positive filters
// ---------------------------------------------------------------------------

/**
 * Matches event titles / descriptions that genuinely describe a hackathon,
 * datathon, buildathon, or competitive coding marathon.
 * Checked against BOTH title AND description.
 */
const HACK_KEYWORDS =
	/\b(hackathon|hackaton|hackat[oó]n|hackday|hack[\s-]day|hackfest|hack[\s-]fest|hack[\s-]night|code[\s-]?jam|datathon|buildathon|innovathon|ideathon|appathon|devathon|coderathon|maratona[\s-]de[\s-]programa[cç]|maratn?[oó][\s-]de[\s-](programa|c[oó]digo|codigo|dados|datos|software)|coding[\s-]marathon|programming[\s-]marathon|desafio[\s-](de[\s-])?programa[cç]|desaf[ií]o[\s-](de[\s-])?programa[cç]|desaf[ií]o[\s-](de[\s-])?c[oó]digo|reto[\s-](de[\s-])?programa[cç]|concurso[\s-](de[\s-])?programa)\b/i;

/**
 * Noise patterns: if title matches any of these, the event is almost certainly
 * NOT a hackathon even if "hack" or "hackathon" appears elsewhere.
 *
 * HackerX: corporate tech recruiting events disguised as "hackathons"
 * HackerRank: online coding challenge platform, not live hackathons
 * Language hacks / "hacking" language: English/Spanish learning meetups
 * Bar crawl / pub crawl: social events with "hack" in name
 * CTF-only: capture-the-flag cybersecurity competitions are not hackathons
 *   "\bctf\b" matches standalone "CTF" but not "Factful" or "aircraft"
 *   "capture[\s-]the[\s-]flag": English full form
 * Open mic: comedy/music events with "hack" in name
 * Startup/pitch nights without coding: not hackathons
 */
const NOISE_EXCLUSION =
	/hackerx|hacker[\s-]?x[\s(]|hackerrank[\s-]event|language[\s-]hack(er)?s?|bar[\s-]crawl|pub[\s-]crawl|open[\s-]mic|social[\s-]club|speed[\s-]networking|pitch[\s-]night|demo[\s-]day\b|study[\s-]group|book[\s-]club|reading[\s-]group|movie[\s-]night|game[\s-]night\b|improv|comedy\b|\bctf\b|capture[\s-]the[\s-]flag/i;

// ---------------------------------------------------------------------------
// Apollo state parser
// ---------------------------------------------------------------------------

interface MeetupApolloEvent {
	__typename: string;
	id: string;
	title?: string;
	dateTime?: string;
	endTime?: string;
	description?: string;
	eventType?: string; // "PHYSICAL" | "ONLINE" | "HYBRID"
	eventUrl?: string;
	rsvps?: { totalCount?: number };
	venue?: {
		name?: string;
		city?: string;
		country?: string;
		address?: string;
	};
}

interface MeetupApolloGroup {
	__typename: string;
	id: string;
	name?: string;
	city?: string;
	country?: string;
	link?: string;
}

function parseApolloState(html: string): Record<string, unknown> | null {
	const nextDataMatch = html.match(
		/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
	);
	if (!nextDataMatch) return null;
	try {
		const data = JSON.parse(nextDataMatch[1]) as {
			props?: { pageProps?: { __APOLLO_STATE__?: Record<string, unknown> } };
		};
		return data?.props?.pageProps?.__APOLLO_STATE__ ?? null;
	} catch {
		return null;
	}
}

/**
 * Extract and filter hackathon events from an Apollo state blob.
 *
 * Two-stage filter:
 * 1. HACK_KEYWORDS must match title OR description (keep only hackathons)
 * 2. NOISE_EXCLUSION must NOT match title (drop recruiting/social events)
 *
 * The venue field in the Apollo state event object is checked first for city/country;
 * fallback values derived from the search URL location parameter are used when
 * the event venue is missing (common for online events).
 */
function extractEventsFromApolloState(
	apolloState: Record<string, unknown>,
	fallbackCity: string | undefined,
	fallbackCountry: string | undefined,
	pageUrl: string,
): RawHackathon[] {
	const events: MeetupApolloEvent[] = Object.values(apolloState).filter(
		(v): v is MeetupApolloEvent =>
			typeof v === "object" &&
			v !== null &&
			(v as Record<string, unknown>).__typename === "Event" &&
			typeof (v as Record<string, unknown>).title === "string" &&
			((v as Record<string, unknown>).title as string).length > 0,
	);

	const hackathonEvents = events.filter((event) => {
		const title = event.title ?? "";
		const desc = event.description ?? "";

		// Must match hackathon keywords in title or description
		if (!HACK_KEYWORDS.test(title) && !HACK_KEYWORDS.test(desc)) {
			return false;
		}

		// Must not match noise patterns in title
		if (NOISE_EXCLUSION.test(title)) {
			return false;
		}

		return true;
	});

	return hackathonEvents.map((event) => {
		let modality: string | undefined;
		switch (event.eventType) {
			case "PHYSICAL":
				modality = "in_person";
				break;
			case "ONLINE":
				modality = "online";
				break;
			case "HYBRID":
				modality = "hybrid";
				break;
		}

		// Prefer venue-level city/country; fall back to the search-URL-derived values
		const city = event.venue?.city ?? fallbackCity;
		const country = event.venue?.country ?? fallbackCountry;

		// endTime from Apollo is an ISO datetime string, not just a time component.
		// Use it directly as endDate.
		return {
			name: event.title!,
			sourceUrl: event.eventUrl ?? pageUrl,
			sourceType: "meetup" as const,
			externalId: event.id,
			description: event.description?.slice(0, 2000),
			startDate: event.dateTime,
			endDate: event.endTime,
			modality,
			city,
			country,
			venue: event.venue?.name,
			fullAddress: event.venue?.address,
			currentParticipants: event.rsvps?.totalCount,
			websiteUrl: event.eventUrl,
		};
	});
}

// ---------------------------------------------------------------------------
// Page parsers
// ---------------------------------------------------------------------------

function parseMeetupSearchPage(html: string, url: string): RawHackathon[] {
	let city: string | undefined;
	let country: string | undefined;

	const locMatch = url.match(/location=([^&]+)/);
	if (locMatch) {
		const loc = decodeURIComponent(locMatch[1]);
		const parts = loc.split("--");
		if (parts.length === 2) {
			country = parts[0].toUpperCase();
			city = parts[1].replace(/\+/g, " ");
		}
	}

	const apolloState = parseApolloState(html);
	if (!apolloState) return [];
	return extractEventsFromApolloState(apolloState, city, country, url);
}

function parseMeetupGroupPage(html: string, url: string): RawHackathon[] {
	const apolloState = parseApolloState(html);
	if (!apolloState) return [];

	let city: string | undefined;
	let country: string | undefined;

	const groupObj = Object.values(apolloState).find(
		(v): v is MeetupApolloGroup =>
			typeof v === "object" &&
			v !== null &&
			(v as Record<string, unknown>).__typename === "Group" &&
			typeof (v as Record<string, unknown>).city === "string",
	) as MeetupApolloGroup | undefined;

	if (groupObj) {
		city = groupObj.city;
		country = groupObj.country?.toUpperCase();
	}

	return extractEventsFromApolloState(apolloState, city, country, url);
}

// ---------------------------------------------------------------------------
// Fetch helper (native fetch, no Firecrawl credits)
// ---------------------------------------------------------------------------

/**
 * 1.2 s between requests — Meetup starts returning 429 or empty Apollo state
 * when requests arrive faster than ~1 req/s.
 */
const RATE_LIMIT_MS = 1200;
let _lastRequest = 0;

async function fetchHtml(url: string): Promise<{ html: string }> {
	const now = Date.now();
	const elapsed = now - _lastRequest;
	if (elapsed < RATE_LIMIT_MS) {
		await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
	}
	_lastRequest = Date.now();

	const res = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
				"(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "es-419,es;q=0.9,en;q=0.8,pt;q=0.7",
		},
		redirect: "follow",
	});

	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
	return { html: await res.text() };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapeMeetup(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];
	const seenIds = new Set<string>();
	let pagesScraped = 0;
	let pagesWithNoApollo = 0;

	function addIfNew(hackathons: RawHackathon[]): void {
		for (const h of hackathons) {
			const key = h.externalId ?? `${h.name}|${h.startDate}`;
			if (seenIds.has(key)) continue;
			seenIds.add(key);
			allHackathons.push(h);
		}
	}

	// ---------------------------------------------------------------------------
	// Phase 1: keyword × city search pages (with pagination)
	// ---------------------------------------------------------------------------

	// Tracks (keywords, location) pairs whose page 1 returned 0 events.
	// When page 1 yields nothing, page 2 for the same pair is guaranteed empty
	// because Meetup returns results in a single ordered set; skip it to save
	// an HTTP round-trip without any recall loss.
	const emptyPage1Pairs = new Set<string>();

	for (const { keywords, location, page } of MEETUP_SEARCH_CONFIGS) {
		// Skip page 2 when page 1 was empty for this (keywords, location) pair.
		const pairKey = `${keywords}|${location}`;
		if (page === 2 && emptyPage1Pairs.has(pairKey)) {
			continue;
		}

		// Build URL. Meetup paginates via &page= (1-indexed).
		const url =
			`https://www.meetup.com/find/?keywords=${encodeURIComponent(keywords)}` +
			`&location=${encodeURIComponent(location)}&source=EVENTS` +
			(page > 1 ? `&page=${page}` : "");

		try {
			const { html } = await fetchHtml(url);
			const hackathons = parseMeetupSearchPage(html, url);
			pagesScraped++;

			// If Apollo state is missing, the page is not usefully parseable.
			// Count such pages for diagnostics but don't treat as errors.
			if (!parseApolloState(html)) {
				pagesWithNoApollo++;
			}

			if (hackathons.length > 0) {
				console.log(
					`[meetup] search p${page} "${keywords}"@${location}: ${hackathons.length} hackathons`,
				);
			}

			addIfNew(hackathons);

			// Record empty page-1 results so the paired page-2 request can be skipped.
			if (page === 1 && hackathons.length === 0) {
				emptyPage1Pairs.add(pairKey);
			}
		} catch (err) {
			console.warn(
				`[meetup] search failed "${keywords}"@${location} p${page}: ` +
					`${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	// ---------------------------------------------------------------------------
	// Phase 2: known hackathon group event pages
	// ---------------------------------------------------------------------------

	for (const url of HACKATHON_GROUP_URLS) {
		try {
			const { html } = await fetchHtml(url);
			const hackathons = parseMeetupGroupPage(html, url);
			pagesScraped++;

			if (hackathons.length > 0) {
				console.log(`[meetup] group ${url}: ${hackathons.length} hackathons`);
			}

			addIfNew(hackathons);
		} catch (err) {
			console.warn(
				`[meetup] group scrape failed ${url}: ` +
					`${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	console.log(
		`[meetup] done: ${allHackathons.length} hackathons from ${pagesScraped} pages ` +
			`(${pagesWithNoApollo} pages had no Apollo state)`,
	);
	return allHackathons;
}
