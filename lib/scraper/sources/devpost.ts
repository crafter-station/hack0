/**
 * Devpost scraper — uses Devpost JSON API with HTML fallback via Firecrawl.
 * Enriches in-person hackathons with detail page data via native fetch.
 *
 * Noise reduction: a scraper-level isLikelyHackathon() filter runs before
 * results reach the post-processor, cutting conferences, design sprints,
 * and recruiting challenges early — reducing false positives and downstream
 * LLM cost without sacrificing genuine hackathon recall.
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import * as cheerio from "cheerio";
import { LATAM_COUNTRY_NAMES } from "@/lib/scraper/latam-filter";
import type { RawHackathon } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// Firecrawl client (inline, no rate-limit shared state needed here)
// ---------------------------------------------------------------------------

let _fc: FirecrawlApp | null = null;
function getFirecrawl(): FirecrawlApp {
	if (!_fc) {
		_fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
	}
	return _fc;
}

async function _scrapePage(
	url: string,
	options: {
		formats?: ("html" | "markdown" | "rawHtml")[];
		waitFor?: number;
	} = {},
): Promise<{ html?: string; markdown?: string }> {
	const fc = getFirecrawl();
	const result = await fc.scrape(url, {
		formats: options.formats ?? ["html"],
		onlyMainContent: true,
		waitFor: options.waitFor ?? 2000,
	});
	return { html: result.html, markdown: result.markdown };
}

// ---------------------------------------------------------------------------
// URL generation
// ---------------------------------------------------------------------------

const LATAM_SEARCH_TERMS = [
	// Explicit LATAM/regional references
	"latin america",
	"latam",
	"latinoamerica",
	"latinoamérica",
	"america latina",
	"iberoamerica",
	"iberoamérica",
	"sudamerica",
	"centroamerica",

	// Peru
	"peru",
	"perú",
	"lima",

	// Colombia
	"colombia",
	"bogota",
	"bogotá",
	"medellin",
	"medellín",
	"cali colombia",
	"cartagena colombia",
	"barranquilla",
	"bucaramanga",

	// Mexico
	"mexico",
	"méxico",
	"cetys",
	"tec de monterrey",
	"guadalajara mexico",
	"monterrey mexico",
	"cdmx",
	"puebla mexico",

	// Brazil (Spanish and Portuguese spellings)
	"brasil",
	"brazil",
	"são paulo",
	"sao paulo",
	"rio de janeiro",
	"brasilia",
	"maratona de programação",
	"desafio de programação",

	// Argentina
	"argentina",
	"buenos aires",
	"córdoba argentina",
	"rosario argentina",

	// Chile
	"chile",
	"santiago chile",

	// Ecuador
	"ecuador",
	"quito ecuador",
	"guayaquil",

	// Uruguay, other southern cone
	"uruguay",
	"montevideo",
	"paraguay",
	"bolivia",

	// Central America & Caribbean
	"costa rica",
	"panama",
	"venezuela",
	"nicaragua",
	"guatemala",
	"el salvador",
	"honduras",

	// Caribbean — Dominican Republic and Cuba (previously uncovered)
	"republica dominicana",
	"república dominicana",
	"santo domingo",
	"cuba",
	"la habana",
	"havana cuba",

	// Additional city-level coverage for underserved countries
	"tegucigalpa honduras",
	"asuncion paraguay",
	"asunción paraguay",
	"montevideo uruguay",

	// Hackathon variants in Spanish/Portuguese
	"hackaton",
	"hackatón",
	"hackathon colombia",
	"hackathon mexico",
	"hackathon brasil",
	"hackathon peru",
	"hackathon argentina",
	"hackathon chile",
	"hackathon latinoamerica",
	"dataton",
	"datathon latam",
	"maratón de programación",
	"maraton de programacion",

	// Bolivia — capital and major cities (previously missing city-level coverage)
	"la paz bolivia",
	"cochabamba",
	"santa cruz bolivia",

	// Additional Brazilian Portuguese hackathon variants
	"maratona de inovação",
	"desafio de dados",

	// Additional LATAM hackathon formats (corporate / reto / desafío framing)
	"reto de innovación latam",
	"desafío tecnológico",
	"desafio tecnologico",
	"innovacion abierta",
	"innovación abierta",

	// University/student hackathon formats in Spanish/Portuguese (underrepresented on Devpost LATAM)
	"hackathon universitario",
	"hackathon estudiantil",
	"hackathon estudantil",
	"concurso de programacion latam",
	"olimpiada de programación latam",

	// Thematic LATAM hackathons — web3/blockchain and govtech (absent from prior terms)
	"hackathon blockchain latam",
	"hackathon web3 latam",
	"hackathon gobierno",
	"hackathon civico",
	"hackathon fintech latam",
	"hackathon salud latam",
];

// ---------------------------------------------------------------------------
// Sweep descriptor — replaces pre-generated URL lists
// ---------------------------------------------------------------------------

/** Base URL (without `page=`) plus pagination metadata for smart auto-paging. */
interface DevpostSweep {
	/** Full URL with all params except `page`. Must include `per_page=40`. */
	baseUrl: string;
	/** Safety cap — smart pagination fetches only what meta.total_count requires,
	 *  up to this maximum. */
	maxPages: number;
	scopeHint?: "latam" | "global";
	label?: string;
}

function getDevpostListingSweeps(): DevpostSweep[] {
	const sweeps: DevpostSweep[] = [];
	const mkBase = (term: string, extra = "") =>
		`https://devpost.com/api/hackathons?search=${encodeURIComponent(term)}&per_page=40&status[]=upcoming&status[]=open${extra}`;

	for (const term of LATAM_SEARCH_TERMS) {
		// Popularity ordering — smart pagination caps at 3 pages
		sweeps.push({
			baseUrl: mkBase(term),
			maxPages: 3,
			label: `search:${term}`,
		});
		// Recently-added — page 1 only to catch newly listed events
		sweeps.push({
			baseUrl: mkBase(term, "&order_by=recently-added"),
			maxPages: 1,
			label: `search:${term}:recent`,
		});
	}

	return sweeps;
}

// Devpost theme names — exact values from /api/themes endpoint (case-sensitive).
// Old slugs like "artificial-intelligence" return 0 results; these return 81, 46, etc.
const DEVPOST_RELEVANT_THEMES = [
	"Machine Learning/AI", // 81 hackathons
	"Social Good", // 46 hackathons
	"Open Ended", // 44 hackathons
	"Education", // 31 hackathons
	"Health", // 15 hackathons
	"Fintech", // 12 hackathons
	"Cybersecurity", //  8 hackathons
	"Blockchain", //  6 hackathons
];

function getDevpostGlobalSweeps(): DevpostSweep[] {
	const open = "status[]=upcoming&status[]=open";
	const base = `https://devpost.com/api/hackathons?per_page=40`;

	return [
		// General — popularity ordering (up to 5 pages = 200 events max)
		{
			baseUrl: `${base}&${open}`,
			maxPages: 5,
			scopeHint: "global",
			label: "global:popular",
		},
		// Recently-added — catch events before they rank by popularity
		{
			baseUrl: `${base}&${open}&order_by=recently-added`,
			maxPages: 2,
			scopeHint: "global",
			label: "global:recent",
		},
		// Closing-soon deadline ordering (open only)
		{
			baseUrl: `${base}&status[]=open&order_by=deadline`,
			maxPages: 3,
			scopeHint: "global",
			label: "global:deadline",
		},
		// In-person only — FIXED: was `online=false` (no-op); correct param is `challenge_type[]=in-person`
		{
			baseUrl: `${base}&${open}&challenge_type[]=in-person`,
			maxPages: 3,
			scopeHint: "global",
			label: "global:in-person",
		},
		// Theme-filtered sweeps — surfaces domain-specific hackathons open to LATAM
		...DEVPOST_RELEVANT_THEMES.map((theme) => ({
			baseUrl: `${base}&${open}&themes[]=${encodeURIComponent(theme)}`,
			maxPages: 2,
			scopeHint: "global" as const,
			label: `theme:${theme}`,
		})),
	];
}

function getDevpostDetailUrl(slug: string): string {
	return `https://${slug}.devpost.com/`;
}

// ---------------------------------------------------------------------------
// Noise filter — scraper-level pre-filter for false positives
// ---------------------------------------------------------------------------

/**
 * Patterns that positively identify an event as hackathon-format.
 * Tier-1: strong hackathon-type words in name or tagline.
 */
const HACK_POSITIVE_RE =
	/\b(hackathon|hackaton|hackat[oó]n|hack[\s-]?day|hackfest|hack[\s-]?night|datathon|dataton|buildathon|appathon|devathon|ideathon|innovathon|coderathon|code[\s-]?jam|code[\s-]?sprint|coding[\s-]challenge|programming[\s-]contest|programming[\s-]challenge|maratona[\s-]de[\s-]program|maratón[\s-]de[\s-]program|desafio[\s-]de[\s-]program|desafío[\s-]de[\s-]program|reto[\s-]de[\s-]c[oó]digo|reto[\s-]de[\s-]innovaci[oó]n|challenge[\s-]hackathon|virtual[\s-]hack)\b/i;

/**
 * Patterns that are strong negative signals — these event types are NOT hackathons
 * even if they appear in Devpost search results for our LATAM terms.
 * Only reject when NONE of the positive hackathon signals are present.
 *
 * Notes on intentional exclusions from this list:
 * - "bootcamp": excluded because "hackathon bootcamp" is a valid combined format
 * - "expo" alone: excluded (but "tech expo" / "innovation expo" are in NOISE_SOFT_RE)
 * - "competition": excluded because many hackathons brand themselves as competitions
 * - "award": excluded because some hackathons include an awards component
 */
const NOISE_NAME_RE =
	/\b(conference|summit|symposium|congress|webinar|fellowship|internship|scholarship|grant|award[\s-]ceremony|call[\s-]?for[\s-]?papers?|call[\s-]?for[\s-]?proposals?|job[\s-]?fair|career[\s-]?fair|networking[\s-]?event|lecture[\s-]?series|seminar[\s-]series|training[\s-]?program|certification[\s-]?program|online[\s-]?course|mooc|study[\s-]?group|mentorship[\s-]?program|accelerator[\s-]?program|incubator[\s-]?program|incubation[\s-]?program|designathon)\b/i;

/**
 * Additional noise patterns specifically for Devpost-sourced false positives:
 * - "Challenge" alone (without hackathon context) often = design/marketing challenge
 * - "Competition" alone often = academic olympiad-style, not hackathon-format
 * These are soft signals — only applied if NO positive hackathon signal exists.
 */
const NOISE_SOFT_RE =
	/\b(design[\s-]?challenge|design[\s-]?sprint|photo[\s-]?challenge|video[\s-]?challenge|essay[\s-]?competition|writing[\s-]?competition|art[\s-]?competition|pitch[\s-]?competition|business[\s-]?plan[\s-]?competition|case[\s-]?competition|quiz[\s-]?competition|trivia[\s-]?challenge|gaming[\s-]?tournament|esports[\s-]?tournament|gaming[\s-]?challenge|tech[\s-]?expo|innovation[\s-]?expo)\b/i;

/**
 * Pre-filter: returns true if an event is likely a genuine hackathon,
 * false if it should be dropped at the scraper level.
 *
 * Strategy:
 * 1. If name/tagline contains a strong hackathon keyword → keep (fast-keep).
 * 2. If name contains a strong noise pattern AND no hackathon keyword → drop.
 * 3. If name contains a soft noise pattern AND no hackathon keyword → drop.
 * 4. Otherwise → keep (let the post-processor decide).
 *
 * This is intentionally conservative: when in doubt, keep. The post-processor
 * LLM is the authoritative isHackathon judge; this filter only eliminates
 * clear-cut false positives with high confidence.
 */
function isLikelyHackathon(item: DevpostApiHackathon): boolean {
	const text = `${item.title} ${item.tagline ?? ""}`;

	// Fast-keep: strong hackathon signal → definitely keep
	if (HACK_POSITIVE_RE.test(text)) return true;

	// Hard noise: clear non-hackathon type → drop
	if (NOISE_NAME_RE.test(text)) return false;

	// Soft noise: ambiguous but unlikely to be hackathon → drop
	if (NOISE_SOFT_RE.test(text)) return false;

	// Unknown → keep (post-processor handles it)
	return true;
}

// ---------------------------------------------------------------------------
// Parser types
// ---------------------------------------------------------------------------

interface DevpostApiHackathon {
	id: number;
	title: string;
	tagline?: string;
	url: string;
	submission_period_dates: string;
	themes: Array<{ name: string }>;
	prize_amount?: string;
	prizes_counts?: { cash: number; other: number };
	registrations_count: number;
	submission_count: number;
	displayed_location?: { icon: string; location: string };
	open_state: string;
	thumbnail_url?: string;
	organization_name?: string;
	eligibility_requirement_invite_only_description?: string | null;
	featured?: boolean;
	winners_announced?: boolean;
	invite_only?: boolean;
	time_left_to_submission?: string;
}

interface DevpostApiMeta {
	total_count: number;
	per_page?: number;
	total_pages?: number;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseDevpostApiResponse(json: unknown): {
	hackathons: DevpostApiHackathon[];
	meta: DevpostApiMeta;
} {
	if (!json || typeof json !== "object")
		return { hackathons: [], meta: { total_count: 0 } };
	const data = json as Record<string, unknown>;
	const hackathons =
		(data.hackathons as DevpostApiHackathon[] | undefined) ?? [];
	const meta = (data.meta as DevpostApiMeta | undefined) ?? { total_count: 0 };
	return { hackathons, meta };
}

function apiHackathonToRaw(item: DevpostApiHackathon): RawHackathon {
	let startDate: string | undefined;
	let endDate: string | undefined;

	if (item.submission_period_dates) {
		const dateStr = item.submission_period_dates;
		const dashIndex = dateStr.indexOf(" - ");
		if (dashIndex > 0) {
			startDate = dateStr.slice(0, dashIndex).trim();
			endDate = dateStr.slice(dashIndex + 3).trim();
			if (endDate.match(/\d{4}/) && !startDate.match(/\d{4}/)) {
				const yearMatch = endDate.match(/(\d{4})/);
				if (yearMatch) startDate = `${startDate}, ${yearMatch[1]}`;
			}
		}
	}

	let city: string | undefined;
	let country: string | undefined;
	let modality: string | undefined;

	const locationStr = item.displayed_location?.location;
	if (locationStr) {
		const loc = locationStr.toLowerCase();
		if (
			loc === "online" ||
			loc === "virtual" ||
			item.displayed_location?.icon === "globe"
		) {
			modality = "online";
		} else {
			modality = "in_person";
			const parts = locationStr.split(",").map((s) => s.trim());
			if (parts.length >= 2) {
				city = parts[0];
				const rawCountry = parts[parts.length - 1];
				// Normalize to ISO 2-letter code when we recognise the country name.
				// This gives scoreLATAM the +80 country_iso signal instead of the +60
				// country_name signal, improving fast-keep accuracy.
				const isoCode = LATAM_COUNTRY_NAMES[rawCountry.toLowerCase()];
				country = isoCode ?? rawCountry;
			} else {
				city = locationStr;
			}
		}
	}

	let externalId: string | undefined;
	try {
		const urlObj = new URL(item.url);
		externalId = urlObj.hostname.replace(".devpost.com", "");
	} catch {
		externalId = String(item.id);
	}

	// Combine invite-only description with a tagged marker for post-processor filtering
	let eligibilityHint =
		item.eligibility_requirement_invite_only_description ?? undefined;
	if (item.invite_only) {
		eligibilityHint = eligibilityHint
			? `${eligibilityHint}\ndevpost_invite_only`
			: "devpost_invite_only";
	}

	// Infer language(s) from title and tagline.
	// Spanish-indicator words commonly appear in titles of LATAM Devpost events.
	// Setting languages here avoids the downstream LLM enrichment call for Signal 5
	// in scoreLATAM (+20 pts) and improves LATAM borderline score accuracy.
	const titleTagline = `${item.title} ${item.tagline ?? ""}`.toLowerCase();
	let languages: string[] | undefined;
	const ES_INDICATORS =
		/\b(hackaton|hackatón|dataton|reto|desafío|desafio|maratón|maratona|programación|programacion|innovación|innovacion|desarrollo|concurso|convocatoria|emprendimiento)\b/;
	const PT_INDICATORS =
		/\b(maratona|inovação|inovacao|programação|programacao|desafio de dados|hackathon brasil|hackaton brasil)\b/;
	if (PT_INDICATORS.test(titleTagline)) {
		languages = ["pt"];
	} else if (ES_INDICATORS.test(titleTagline)) {
		languages = ["es"];
	} else {
		// Default to English — avoids triggering LLM enrichment for missing languages
		languages = ["en"];
	}

	return {
		name: item.title,
		sourceUrl: item.url,
		sourceType: "devpost",
		externalId,
		description: item.tagline,
		startDate,
		endDate,
		modality,
		city,
		country,
		eligibility: eligibilityHint,
		websiteUrl: item.url,
		imageUrl: item.thumbnail_url,
		prizePool: item.prize_amount
			? item.prize_amount.replace(/<[^>]+>/g, "").trim()
			: undefined,
		currentParticipants: item.registrations_count,
		themes: item.themes?.map((t) => t.name),
		organizers: item.organization_name
			? [{ name: item.organization_name }]
			: undefined,
		languages,
	};
}

function parseDevpostDetailPage(
	html: string,
	_url: string,
): Partial<RawHackathon> {
	const $ = cheerio.load(html);
	const result: Partial<RawHackathon> = {};

	// ---------------------------------------------------------------------------
	// LD+JSON structured data — location, venue, dates
	// ---------------------------------------------------------------------------
	$('script[type="application/ld+json"]').each((_, el) => {
		try {
			const raw = $(el).html() ?? "";
			const data = JSON.parse(raw) as Record<string, unknown>;
			const location = data.location as Record<string, unknown> | undefined;
			const address = location?.address as Record<string, unknown> | undefined;

			// Venue name from ld+json — only use if it's a real venue, not the event name
			// Online events set location.name to the event title which is not useful
			if (location) {
				const venueName = (location.name as string | undefined)?.trim();
				const eventName = (data.name as string | undefined)?.trim();
				const addressName = (address?.name as string | undefined)
					?.trim()
					?.toLowerCase();
				const isOnline = addressName === "online" || addressName === "virtual";
				if (
					venueName &&
					!result.venue &&
					!isOnline &&
					venueName !== eventName
				) {
					result.venue = venueName;
				}
			}

			if (address) {
				const locality = (
					address.addressLocality as string | undefined
				)?.trim();
				const street = (address.streetAddress as string | undefined)?.trim();
				if (locality && !result.city) result.city = locality;
				if (street && !result.country) {
					const parts = street
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean);
					if (parts.length >= 2) {
						const lastPart = parts[parts.length - 1];
						if (!/^\d+$/.test(lastPart) && lastPart.length > 2)
							result.country = lastPart;
					}
				}
				if (street && !result.fullAddress) result.fullAddress = street;
			}
		} catch {
			// Non-fatal
		}
	});

	// ---------------------------------------------------------------------------
	// Banner image — background image on #challenge-header
	// ---------------------------------------------------------------------------
	const headerEl = $("#challenge-header");
	if (headerEl.length > 0) {
		const style = headerEl.attr("style") ?? "";
		const bgMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
		if (bgMatch)
			result.bannerUrl = bgMatch[1].startsWith("//")
				? `https:${bgMatch[1]}`
				: bgMatch[1];
	}
	// Also try the full-width challenge photo inside the header
	if (!result.bannerUrl) {
		const headerImg = $("#challenge-header img, .challenge-header img")
			.first()
			.attr("src");
		if (headerImg)
			result.bannerUrl = headerImg.startsWith("//")
				? `https:${headerImg}`
				: headerImg;
	}

	// ---------------------------------------------------------------------------
	// Description — full challenge description
	// ---------------------------------------------------------------------------
	const description =
		$("#challenge-description").text().trim() ||
		$(".challenge-description").text().trim() ||
		$('[data-testid="challenge-description"]').text().trim();
	if (description) result.description = description.slice(0, 5000);

	// ---------------------------------------------------------------------------
	// Prizes — structured extraction with multiple selector strategies
	// ---------------------------------------------------------------------------
	const prizes: Array<{ place: string; amount: string; description: string }> =
		[];

	// Strategy 1: dedicated prize containers
	$(".prize, .prize-item, [class*='prize']").each((_, el) => {
		const place =
			$(el).find(".prize-title, h3, h4, h6").first().text().trim() || "";
		const amount =
			$(el).find(".prize-amount, .value").first().text().trim() || "";
		const desc =
			$(el).find(".prize-description, p").first().text().trim() || "";
		if (place || amount) prizes.push({ place, amount, description: desc });
	});

	// Strategy 2: h6-based prize headings (common Devpost pattern)
	if (prizes.length === 0) {
		const prizeSection = $("#prizes, [id*='prize'], .prizes-list").first();
		if (prizeSection.length > 0) {
			prizeSection.find("h6, h5, h4").each((_, heading) => {
				const place = $(heading).text().trim();
				// Collect text siblings until next heading
				let amount = "";
				let desc = "";
				let sibling = $(heading).next();
				while (sibling.length > 0 && !sibling.is("h6, h5, h4")) {
					const text = sibling.text().trim();
					if (/^\$[\d,]+/.test(text) || /\d+\s*(USD|credits)/i.test(text)) {
						amount = amount ? `${amount} + ${text}` : text;
					} else if (text) {
						desc = desc ? `${desc} ${text}` : text;
					}
					sibling = sibling.next();
				}
				if (place)
					prizes.push({ place, amount, description: desc.slice(0, 500) });
			});
		}
	}
	if (prizes.length > 0) result.prizes = prizes;

	// ---------------------------------------------------------------------------
	// Sponsors/partners
	// ---------------------------------------------------------------------------
	const sponsors: Array<{ name: string; url?: string; logo?: string }> = [];
	const seenSponsorNames = new Set<string>();
	$(".sponsor, .partner, [class*='sponsor'], [class*='partner']").each(
		(_, el) => {
			const name = $(el).find("img").attr("alt") || $(el).text().trim();
			if (!name || seenSponsorNames.has(name.toLowerCase())) return;
			seenSponsorNames.add(name.toLowerCase());
			let logo = $(el).find("img").attr("src");
			if (logo?.startsWith("//")) logo = `https:${logo}`;
			const sponsorUrl = $(el).find("a").attr("href");
			sponsors.push({
				name,
				url: sponsorUrl || undefined,
				logo: logo || undefined,
			});
		},
	);
	// Fallback: sponsor logos in challengepost S3 bucket
	if (sponsors.length === 0) {
		$('img[src*="challengepost/sponsors"]').each((_, el) => {
			const name = $(el).attr("alt")?.trim();
			if (!name || seenSponsorNames.has(name.toLowerCase())) return;
			seenSponsorNames.add(name.toLowerCase());
			let logo = $(el).attr("src");
			if (logo?.startsWith("//")) logo = `https:${logo}`;
			sponsors.push({ name, logo: logo || undefined });
		});
	}
	if (sponsors.length > 0) result.sponsors = sponsors;

	// ---------------------------------------------------------------------------
	// Eligibility
	// ---------------------------------------------------------------------------
	const eligibility =
		$("#eligibility-list").text().trim() ||
		$("#rules").text().trim() ||
		$(".rules-content").text().trim() ||
		$(".eligibility-list").text().trim();
	if (eligibility) result.eligibility = eligibility.slice(0, 2000);

	// ---------------------------------------------------------------------------
	// Rules — separate from eligibility, captures full rules text
	// ---------------------------------------------------------------------------
	const rulesText =
		$('[data-testid="rules"]').text().trim() ||
		$(".rules-content, #rules-content, .challenge-rules").text().trim();
	if (rulesText && rulesText !== eligibility)
		result.rules = rulesText.slice(0, 3000);

	const bodyHtml = $.html().toLowerCase();
	const isOnlineEvent = bodyHtml.includes(
		"schema.org/onlineeventattendancemode",
	);

	if (isOnlineEvent) {
		// Use [\s\S] instead of dotAll 's' flag for ES2016 compatibility
		const allCountriesMatch =
			bodyHtml.match(
				/all countries\/territories[\s\S]*?excluding[\s\S]*?title="([^"]+)"/i,
			) ??
			bodyHtml.match(
				/specific[\s\S]*?countries\/territories excluded[\s\S]*?title="([^"]+)"/i,
			);
		if (allCountriesMatch) {
			const excludedList = allCountriesMatch[1].toLowerCase();
			const coreLATAM = [
				"colombia",
				"mexico",
				"argentina",
				"chile",
				"ecuador",
				"uruguay",
				"venezuela",
				"bolivia",
				"paraguay",
				"costa rica",
				"nicaragua",
				"honduras",
				"el salvador",
				"guatemala",
				"panama",
				"dominican",
				"cuba",
				"jamaica",
				"trinidad",
				"puerto rico",
				"peru",
				"brasil",
				"brazil",
			];
			const excludedLatam = coreLATAM.filter((c) => excludedList.includes(c));

			const existingEligibility = (result.eligibility ?? "").toLowerCase();
			const INSTITUTION_RESTRICTION_PATTERNS = [
				/\b(university|universidad|institute|instituto|college|colégio)\b.*?\bstudents?\b/i,
				/\bstudents?\b.*?\b(university|universidad|institute|instituto|college)\b/i,
				/\b(association|club|society|chapter)\b.*?\bmembers?\b/i,
				/\bmembers?\b.*?\b(association|club|society|chapter)\b/i,
				/\bapproved participants?\b/i,
				/\b(national|state|regional)\b.*?\blevel\b/i,
				/\b(national institute of technology|iit\b|iim\b|bits\b|vit\b|srm\b)/i,
				/\bstudents?\s+at\b/i,
				/\bonly\s+for\s+(students?|members?|attendees?)\s+of\b/i,
			];
			const eligibilityHtml =
				bodyHtml.match(/#eligibility[^>]*>[\s\S]{0,2000}/)?.[0] ?? "";
			const combinedEligText = `${existingEligibility} ${eligibilityHtml}`;
			const hasInstitutionRestriction = INSTITUTION_RESTRICTION_PATTERNS.some(
				(pat) => pat.test(combinedEligText),
			);

			if (excludedLatam.length === 0 && !hasInstitutionRestriction) {
				const currentEligibility = result.eligibility ?? "";
				result.eligibility = currentEligibility
					? `${currentEligibility}\nglobal_open_eligible_la`
					: "global_open_eligible_la";
			}
		}
	}

	const regLink = $('a[href*="register"], a[href*="signup"]').attr("href");
	if (regLink) result.registrationUrl = regLink;

	// ---------------------------------------------------------------------------
	// Registration deadline
	// ---------------------------------------------------------------------------
	const deadlineEl = $(
		".deadline, [data-deadline], .submission-period-dates, .dates-deadline",
	).first();
	if (deadlineEl.length > 0) {
		const deadlineText = deadlineEl.text().trim();
		if (deadlineText) result.registrationDeadline = deadlineText;
	}
	if (!result.registrationDeadline) {
		const regCloseMatch = bodyHtml.match(
			/(?:registration(?:\s+closes)?|submissions?\s+(?:close|due|end)):?\s*([a-z]+ \d{1,2},?\s*\d{4})/i,
		);
		if (regCloseMatch) result.registrationDeadline = regCloseMatch[1].trim();
	}

	// ---------------------------------------------------------------------------
	// Team size
	// ---------------------------------------------------------------------------
	const teamSizeText =
		$("#rules").text() ||
		$(".rules-content").text() ||
		$(".team-size, [class*='team-size']").text();
	if (teamSizeText) {
		const rangeMatch =
			teamSizeText.match(/\bteams?\s+of\s+(\d+)\s*[-–to]+\s*(\d+)/i) ??
			teamSizeText.match(
				/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:members?|people|participants?)/i,
			);
		if (rangeMatch) {
			const min = parseInt(rangeMatch[1], 10);
			const max = parseInt(rangeMatch[2], 10);
			if (!Number.isNaN(min) && min > 0 && min <= max) {
				result.teamSizeMin = min;
				result.teamSizeMax = max;
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Max participants — some Devpost pages show a participant cap
	// ---------------------------------------------------------------------------
	const maxPartMatch = bodyHtml.match(
		/(?:limited to|max(?:imum)?|up to|only)\s+(\d[\d,]*)\s*(?:participants?|teams?|hackers?|spots?|registr)/i,
	);
	if (maxPartMatch) {
		const maxP = parseInt(maxPartMatch[1].replace(/,/g, ""), 10);
		if (!Number.isNaN(maxP) && maxP > 0 && maxP < 100000)
			result.maxParticipants = maxP;
	}

	// ---------------------------------------------------------------------------
	// Technologies & themes/tags — only from theme links pointing to devpost.com/hackathons?themes
	// ---------------------------------------------------------------------------
	const technologies: string[] = [];
	const seenTechs = new Set<string>();
	// Devpost theme links: <a href="...devpost.com/hackathons?themes[]=...">Machine Learning/AI</a>
	$(
		'a[href*="devpost.com/hackathons?themes"], a[href*="devpost.com/hackathons?tag"]',
	).each((_, el) => {
		const tag = $(el).text().trim();
		if (tag && tag.length < 80 && !seenTechs.has(tag.toLowerCase())) {
			seenTechs.add(tag.toLowerCase());
			technologies.push(tag);
		}
	});
	// Fallback: .software-tag or .theme-tag (more specific than generic .tag)
	if (technologies.length === 0) {
		$(".software-tag, .theme-tag").each((_, el) => {
			const tag = $(el).text().trim();
			if (tag && tag.length < 80 && !seenTechs.has(tag.toLowerCase())) {
				seenTechs.add(tag.toLowerCase());
				technologies.push(tag);
			}
		});
	}
	if (technologies.length > 0) result.technologies = technologies;

	// ---------------------------------------------------------------------------
	// Tracks (challenge categories/tracks)
	// Devpost lists categories in various ways: dedicated track containers,
	// headings like "Tracks"/"Categories", or as prize category names.
	// ---------------------------------------------------------------------------
	const tracks: string[] = [];
	const seenTracks = new Set<string>();
	const addTrack = (t: string) => {
		const clean = t.trim();
		if (
			clean &&
			clean.length > 2 &&
			clean.length < 100 &&
			!seenTracks.has(clean.toLowerCase())
		) {
			seenTracks.add(clean.toLowerCase());
			tracks.push(clean);
		}
	};

	// Strategy 1: dedicated track containers
	$(".track, .challenge-track, [class*='track-item']").each((_, el) => {
		addTrack($(el).text());
	});

	// Strategy 2: section headings "Tracks", "Categories", "Categorías"
	if (tracks.length === 0) {
		$("h2, h3, h4, h5").each((_, heading) => {
			const headingText = $(heading).text().trim().toLowerCase();
			if (
				/^(tracks?|categories|categorías|challenge tracks|retos)$/.test(
					headingText,
				)
			) {
				// Collect list items or paragraphs after this heading
				let next = $(heading).next();
				while (next.length > 0 && !next.is("h2, h3, h4, h5")) {
					if (next.is("ul, ol")) {
						next.find("li").each((_, li) => addTrack($(li).text()));
					} else if (next.is("li, p")) {
						addTrack(next.text());
					}
					next = next.next();
				}
			}
		});
	}

	// Strategy 3: infer tracks from prize category names (e.g., "Best Agentic System")
	if (tracks.length === 0 && prizes.length > 3) {
		for (const p of prizes) {
			// Skip generic prizes like "First Prize", "Grand Prize"
			if (/^(first|second|third|grand|overall|1st|2nd|3rd)/i.test(p.place))
				continue;
			if (/^(best|most|top)\s+/i.test(p.place)) {
				addTrack(p.place.replace(/^(best|most|top)\s+/i, "").trim());
			}
		}
	}
	if (tracks.length > 0) result.tracks = tracks;

	// ---------------------------------------------------------------------------
	// Judges — extract name, title, organization, photo
	// Devpost pattern: <img src="judge_photos/..."> <strong>Name</strong> <em>Title | Org</em>
	// These are siblings or near-siblings in the DOM, not in dedicated containers.
	// ---------------------------------------------------------------------------
	const judges: Array<{
		name: string;
		title?: string;
		organization?: string;
		photo?: string;
	}> = [];
	const seenJudges = new Set<string>();

	function parseTitleOrg(text: string): {
		title?: string;
		organization?: string;
	} {
		if (!text) return {};
		const parts = text.split(/\s*[|]\s*/);
		return {
			title: parts[0]?.trim() || undefined,
			organization: parts[1]?.trim() || undefined,
		};
	}

	// Strategy 1: find judge photo images and resolve name/title from grid layout.
	// Devpost pattern: <div class="row"><div class="columns"><figure><img></figure></div>
	//   <div class="columns"><p><strong>Name</strong><br><i>Title | Org</i></p></div></div>
	// The img alt also contains the judge name as fallback.
	$('img[src*="judge_photos"]').each((_, el) => {
		let photo = $(el).attr("src");
		if (photo?.startsWith("//")) photo = `https:${photo}`;

		// The row container is 3-4 levels up: img → figure → div.columns → div.row
		const row = $(el).closest(".row, [class*='judge'], div").parent();
		// Find strong (name) and i/em (title) in the adjacent columns div
		let name = row.find("strong").first().text().trim();
		// Fallback: use img alt attribute
		if (!name) name = $(el).attr("alt")?.trim() ?? "";
		const titleOrg = row.find("i, em").first().text().trim();

		if (!name || seenJudges.has(name.toLowerCase())) return;
		if (
			/^(a qualified|judging panel|judges?|tbd|tba|will be announced)/i.test(
				name,
			)
		)
			return;
		seenJudges.add(name.toLowerCase());
		const { title, organization } = parseTitleOrg(titleOrg);
		judges.push({ name, title, organization, photo: photo || undefined });
	});

	// Strategy 2: structured containers (fallback)
	if (judges.length === 0) {
		$(".judge, .judge-item, [class*='judge-']").each((_, el) => {
			const name = $(el)
				.find("strong, .judge-name, h4, h5")
				.first()
				.text()
				.trim();
			if (!name || seenJudges.has(name.toLowerCase())) return;
			if (/^(a qualified|judging panel|judges?|tbd|tba)$/i.test(name)) return;
			seenJudges.add(name.toLowerCase());
			const titleOrg = $(el)
				.find("em, .judge-title, .judge-role")
				.first()
				.text()
				.trim();
			let photo = $(el).find("img").attr("src");
			if (photo?.startsWith("//")) photo = `https:${photo}`;
			const { title, organization } = parseTitleOrg(titleOrg);
			judges.push({ name, title, organization, photo: photo || undefined });
		});
	}
	if (judges.length > 0) result.judges = judges;

	// ---------------------------------------------------------------------------
	// Judging criteria — criterion name, weight, description
	// Devpost pattern: <h6>Criterion Name - 60%</h6> followed by description text
	// ---------------------------------------------------------------------------
	const judgingCriteria: Array<{
		criterion: string;
		weight?: string;
		description?: string;
	}> = [];

	// Find all h6 headings that contain a percentage (Devpost's standard criteria format)
	$("h6, h5").each((_, heading) => {
		const headingText = $(heading).text().trim();
		const weightMatch = headingText.match(/(.+?)\s*[-–:]\s*(\d+%)/);
		if (!weightMatch) return;
		const criterion = weightMatch[1].trim();
		const weight = weightMatch[2];
		// Collect description from following siblings until next heading
		let desc = "";
		let sibling = $(heading).next();
		while (sibling.length > 0 && !sibling.is("h5, h6, h4, h3, h2, hr")) {
			const text = sibling.text().trim();
			if (text) desc = desc ? `${desc} ${text}` : text;
			sibling = sibling.next();
		}
		judgingCriteria.push({
			criterion,
			weight,
			description: desc.slice(0, 500) || undefined,
		});
	});

	// Fallback: headings without percentages in a judging section
	if (judgingCriteria.length === 0) {
		const judgingSection = $(
			"#judging-criteria, [id*='judging'], .judging-criteria",
		).first();
		if (judgingSection.length > 0) {
			judgingSection.find("h5, h6, li").each((_, el) => {
				const text = $(el).text().trim();
				if (text && text.length < 200) {
					const wm = text.match(/(.+?)\s*[-–:]\s*(\d+%)/);
					if (wm) {
						judgingCriteria.push({ criterion: wm[1].trim(), weight: wm[2] });
					} else {
						judgingCriteria.push({ criterion: text });
					}
				}
			});
		}
	}
	if (judgingCriteria.length > 0) result.judgingCriteria = judgingCriteria;

	// ---------------------------------------------------------------------------
	// Resources — documentation links, API references, workshops
	// Devpost pages link to resources inline in the description. We also look
	// for a dedicated resources section or links to docs/APIs/GitHub/YouTube.
	// ---------------------------------------------------------------------------
	const resources: Array<{ title: string; url: string }> = [];
	const seenResourceUrls = new Set<string>();
	const RESOURCE_URL_PATTERNS =
		/\b(docs\.|documentation|github\.com|youtube\.com|workshop|tutorial|getting-started|quickstart|api-reference|developer\.|dev\.)\b/i;

	// Strategy 1: dedicated resources section
	$(".resource, .resources a, [class*='resource'] a, #resources a").each(
		(_, el) => {
			const title = $(el).text().trim();
			const url = $(el).attr("href");
			if (
				title &&
				url &&
				!seenResourceUrls.has(url) &&
				url.startsWith("http")
			) {
				seenResourceUrls.add(url);
				resources.push({ title, url });
			}
		},
	);

	// Strategy 2: links in description that look like resources
	if (resources.length === 0) {
		$("#challenge-description a, .challenge-description a").each((_, el) => {
			const url = $(el).attr("href");
			const title = $(el).text().trim();
			if (
				!url ||
				!title ||
				seenResourceUrls.has(url) ||
				!url.startsWith("http")
			)
				return;
			if (
				RESOURCE_URL_PATTERNS.test(url) ||
				RESOURCE_URL_PATTERNS.test(title)
			) {
				seenResourceUrls.add(url);
				resources.push({ title, url });
			}
		});
	}
	if (resources.length > 0) result.resources = resources;

	// ---------------------------------------------------------------------------
	// Contact email
	// ---------------------------------------------------------------------------
	const emailMatch = $.html().match(
		/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
	);
	if (emailMatch) result.contactEmail = emailMatch[1];

	// ---------------------------------------------------------------------------
	// Hackathon-confirmation signals
	// ---------------------------------------------------------------------------
	const hasSubmissionSection =
		bodyHtml.includes("submit your project") ||
		bodyHtml.includes("submit project") ||
		bodyHtml.includes("challenge-submissions") ||
		bodyHtml.includes("submit-project") ||
		bodyHtml.includes('id="submission"');

	const hasJudgingCriteria =
		bodyHtml.includes("judging-criteria") ||
		bodyHtml.includes("judging criteria") ||
		bodyHtml.includes("criterios de evaluación") ||
		bodyHtml.includes("criterios de calificación");

	const schemaTypeIsConference =
		bodyHtml.includes('"@type":"conference"') ||
		bodyHtml.includes('"@type": "conference"') ||
		bodyHtml.includes('"@type":"BusinessEvent"') ||
		bodyHtml.includes('"@type": "BusinessEvent"');

	if (hasSubmissionSection || hasJudgingCriteria) {
		const currentEligibility = result.eligibility ?? "";
		result.eligibility = currentEligibility
			? `${currentEligibility}\ndevpost_hackathon_confirmed`
			: "devpost_hackathon_confirmed";
	}

	if (schemaTypeIsConference) {
		const currentEligibility = result.eligibility ?? "";
		result.eligibility = currentEligibility
			? `${currentEligibility}\ndevpost_schema_type_conference`
			: "devpost_schema_type_conference";
	}

	// ---------------------------------------------------------------------------
	// Language detection from detail page content
	// ---------------------------------------------------------------------------
	if (!result.languages || result.languages.length === 0) {
		const bodyText = bodyHtml.slice(0, 8000);
		const ES_PROSE =
			/\b(participa|inscríbete|inscribete|convocatoria|desarrolladores|emprendedores|innovadores|tecnología|soluciones|programación|equipo|categoría|reto tecnológico|desafío|ganadores|premios)\b/i;
		const PT_PROSE =
			/\b(participe|inscreva-se|desenvolvedores|empreendedores|inovação|tecnologia|solucoes|programação|equipe|categoria|desafio tecnologico|ganhadores|prêmios|prêmio)\b/i;
		if (PT_PROSE.test(bodyText)) {
			result.languages = ["pt"];
		} else if (ES_PROSE.test(bodyText)) {
			result.languages = ["es"];
		}
	}

	return result;
}

function _parseDevpostListHtml(html: string): RawHackathon[] {
	const $ = cheerio.load(html);
	const results: RawHackathon[] = [];

	$(".hackathon-tile, .challenge-listing, [class*='hackathon']").each(
		(_, el) => {
			const $el = $(el);
			const name = $el.find("h2, h3, .title").first().text().trim();
			const link = $el.find("a").first().attr("href");
			if (!name || !link) return;

			const sourceUrl = link.startsWith("http")
				? link
				: `https://devpost.com${link}`;
			results.push({
				name,
				sourceUrl,
				sourceType: "devpost",
				externalId: link
					.replace(/^https?:\/\//, "")
					.replace(".devpost.com/", "")
					.replace(/\/$/, ""),
			});
		},
	);

	return results;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const API_HEADERS = {
	Accept: "application/json",
	"User-Agent": "HackathonScraper/1.0 (LATAM hackathon aggregator)",
};

async function fetchDevpostSweeps(
	sweeps: DevpostSweep[],
	allHackathons: RawHackathon[],
	seenIds: Set<string>,
): Promise<void> {
	const CONCURRENCY = 8;
	const PER_PAGE = 40;

	function processItems(
		apiHackathons: DevpostApiHackathon[],
		scopeHint: "latam" | "global" | undefined,
	): void {
		for (const item of apiHackathons) {
			// Skip events where winners are already announced — these are ended regardless of open_state
			if (item.winners_announced) continue;
			// Scraper-level noise filter: drop obvious non-hackathons early
			if (!isLikelyHackathon(item)) {
				console.debug(
					`[devpost] noise-filter drop: "${item.title}" (tagline: "${item.tagline ?? ""}")`,
				);
				continue;
			}
			const raw = apiHackathonToRaw(item);
			if (raw.externalId && seenIds.has(raw.externalId)) continue;
			if (raw.externalId) seenIds.add(raw.externalId);
			allHackathons.push(scopeHint ? { ...raw, scopeHint } : raw);
		}
	}

	async function fetchOneSweep(sweep: DevpostSweep): Promise<void> {
		const { baseUrl, maxPages, scopeHint, label } = sweep;
		try {
			// Page 1 — also reads meta.total_count to determine how many pages to fetch
			const res1 = await fetch(`${baseUrl}&page=1`, { headers: API_HEADERS });
			if (!res1.ok) {
				console.warn(`[devpost] API ${res1.status} for ${label ?? baseUrl}`);
				return;
			}
			const json1 = await res1.json();
			const { hackathons: page1Items, meta } = parseDevpostApiResponse(json1);
			processItems(page1Items, scopeHint);

			const totalCount = meta.total_count ?? 0;
			const pagesNeeded = Math.min(Math.ceil(totalCount / PER_PAGE), maxPages);
			console.log(
				`[devpost] ${label ?? "sweep"}: ${totalCount} total → ${pagesNeeded} page(s) (p1 returned ${page1Items.length})`,
			);

			if (pagesNeeded <= 1) return;

			// Fetch remaining pages in batches of CONCURRENCY
			const remainingPages = Array.from(
				{ length: pagesNeeded - 1 },
				(_, i) => i + 2,
			);
			for (let i = 0; i < remainingPages.length; i += CONCURRENCY) {
				const batch = remainingPages.slice(i, i + CONCURRENCY);
				await Promise.all(
					batch.map(async (p) => {
						try {
							const r = await fetch(`${baseUrl}&page=${p}`, {
								headers: API_HEADERS,
							});
							if (r.ok) {
								const { hackathons } = parseDevpostApiResponse(await r.json());
								processItems(hackathons, scopeHint);
							}
						} catch (err) {
							console.error(
								`[devpost] Error page ${p} of ${label}: ${err instanceof Error ? err.message : String(err)}`,
							);
						}
					}),
				);
			}
		} catch (err) {
			console.error(
				`[devpost] Error sweep ${label}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	// Run sweeps concurrently
	for (let i = 0; i < sweeps.length; i += CONCURRENCY) {
		const batch = sweeps.slice(i, i + CONCURRENCY);
		await Promise.all(batch.map(fetchOneSweep));
	}
}

export async function scrapeDevpost(): Promise<RawHackathon[]> {
	const latamSweeps = getDevpostListingSweeps();
	const globalSweeps = getDevpostGlobalSweeps();
	const allHackathons: RawHackathon[] = [];
	const seenIds = new Set<string>();

	console.log(
		`[devpost] Starting scrape with ${latamSweeps.length} LATAM sweeps + ${globalSweeps.length} global sweeps (smart pagination, per_page=40)`,
	);

	await fetchDevpostSweeps(latamSweeps, allHackathons, seenIds);
	await fetchDevpostSweeps(globalSweeps, allHackathons, seenIds);

	// Enrich ALL hackathons with detail pages (native fetch, no Firecrawl credits).
	// Every event gets the full detail page scrape for maximum data extraction:
	// description, prizes, sponsors, judges, judging criteria, tracks, banner,
	// venue, rules, team size, resources, contact, eligibility signals, etc.
	const toEnrich = allHackathons.filter((h) => h.externalId);

	// Bounded concurrency pool — 10 parallel requests balances speed vs rate-limiting
	const CONCURRENCY = 10;
	async function enrichOne(h: RawHackathon): Promise<void> {
		if (!h.externalId) return;
		try {
			const detailUrl = getDevpostDetailUrl(h.externalId);
			const detailRes = await fetch(detailUrl, {
				headers: {
					Accept: "text/html",
					"User-Agent": "HackathonScraper/1.0 (LATAM hackathon aggregator)",
				},
			});
			if (detailRes.ok) {
				const html = await detailRes.text();
				const enriched = parseDevpostDetailPage(html, detailUrl);
				const idx = allHackathons.indexOf(h);
				if (idx >= 0) Object.assign(allHackathons[idx], enriched);
			}
		} catch (err) {
			console.warn(`[devpost] Failed to enrich ${h.name}: ${err}`);
		}
	}

	// Run enrichment in batches of CONCURRENCY
	for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
		const batch = toEnrich.slice(i, i + CONCURRENCY);
		await Promise.all(batch.map(enrichOne));
	}

	console.log(
		`[devpost] Scrape complete: ${allHackathons.length} total hackathons`,
	);
	return allHackathons;
}
