/**
 * Eventbrite scraper
 *
 * Scrapes LATAM hackathon/datathon events from Eventbrite country and city pages.
 * Uses native fetch (no Firecrawl credits) since Eventbrite server-renders JSON-LD
 * and window.__SERVER_DATA__ inline JSON.
 *
 * Requires: cheerio (bun add cheerio)
 */

import * as cheerio from "cheerio";
import type { RawHackathon } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// URL generation
// ---------------------------------------------------------------------------

// All LATAM countries supported by Eventbrite's /d/ routing
const EVENTBRITE_COUNTRIES = [
	"peru",
	"colombia",
	"mexico",
	"brazil",
	"argentina",
	"chile",
	"ecuador",
	"uruguay",
	"venezuela",
	"costa-rica",
	"panama",
	"dominican-republic",
	"guatemala",
	"bolivia",
	"paraguay",
	"honduras",
	"el-salvador",
	"nicaragua",
	"haiti",
	"jamaica",
	"puerto-rico",
	"trinidad-tobago",
	"barbados",
	"guyana",
	"belize",
];

// City-level searches for high-density countries to improve precision
const EVENTBRITE_CITIES: Record<string, string[]> = {
	peru: ["lima", "arequipa", "trujillo", "cusco", "piura", "chiclayo"],
	colombia: [
		"bogota",
		"medellin",
		"cali",
		"barranquilla",
		"cartagena",
		"bucaramanga",
	],
	mexico: [
		"mexico-city",
		"guadalajara",
		"monterrey",
		"puebla",
		"queretaro",
		"merida",
		"tijuana",
	],
	brazil: [
		"sao-paulo",
		"rio-de-janeiro",
		"belo-horizonte",
		"curitiba",
		"brasilia",
		"recife",
		"fortaleza",
		"porto-alegre",
		"campinas",
	],
	argentina: ["buenos-aires", "rosario", "cordoba", "mendoza"],
	chile: ["santiago", "valparaiso", "concepcion"],
	ecuador: ["quito", "guayaquil"],
	uruguay: ["montevideo"],
	"costa-rica": ["san-jose"],
	panama: ["panama-city"],
	// Smaller markets: add key capital cities to improve recall
	bolivia: ["la-paz", "santa-cruz-de-la-sierra"],
	venezuela: ["caracas", "maracaibo"],
	paraguay: ["asuncion"],
	"el-salvador": ["san-salvador"],
	honduras: ["tegucigalpa", "san-pedro-sula"],
	nicaragua: ["managua"],
	"dominican-republic": ["santo-domingo"],
	guatemala: ["guatemala-city"],
};

// The primary hackathon-specific search keyword for /d/<country>/<keyword>/
// Eventbrite's category routing means these return pre-filtered results.
const PRIMARY_HACK_TERMS = ["hackathon", "hackaton", "datathon"];

// Additional terms used for explicit keyword searches on big countries
// These have a higher false-positive risk so we apply stricter post-filtering.
const SECONDARY_HACK_TERMS_ES = [
	"maratn-de-programacin", // URL-encoded form Eventbrite uses
	"maratona-hack",
	"buildathon",
	"innovathon",
	"codeathon",
	// Thematic hackathon terms common on Eventbrite LATAM
	"ia-hackathon", // inteligencia artificial / AI hackathons
	"ai-hackathon", // English variant — bilingual pair for ia-hackathon
	"blockchain-hackathon",
	"web3-hackathon",
	"hack-de-salud", // health hackathons
	"hackathon-salud",
	"social-hackathon",
	"hackathon-social",
];
const SECONDARY_HACK_TERMS_PT = [
	"maratona-hackathon",
	"datathon",
	"buildathon",
	"hackathon-ia", // inteligência artificial — PT variant
	"hackathon-saude", // saúde = health
	"hackathon-social",
	"hackathon-blockchain",
];

// Big countries where we paginate deeper because they have many events
const DEEP_PAGINATION_COUNTRIES: Record<string, number> = {
	mexico: 4,
	brazil: 4,
	colombia: 3,
	argentina: 3,
	chile: 2,
	peru: 2,
};

// Eventbrite query param for upcoming events only — avoids past events cluttering results
const UPCOMING_SUFFIX = "?start_date=today";

function getEventbriteUrls(): string[] {
	const urls: string[] = [];
	const seen = new Set<string>();

	function addUrl(url: string): void {
		if (!seen.has(url)) {
			seen.add(url);
			urls.push(url);
		}
	}

	// Primary: country-level hackathon pages (all LATAM countries, all primary terms)
	for (const country of EVENTBRITE_COUNTRIES) {
		for (const term of PRIMARY_HACK_TERMS) {
			addUrl(
				`https://www.eventbrite.com/d/${country}/${term}/${UPCOMING_SUFFIX}`,
			);
		}
	}

	// Pagination for high-volume countries
	for (const [country, maxPage] of Object.entries(DEEP_PAGINATION_COUNTRIES)) {
		for (const term of PRIMARY_HACK_TERMS) {
			for (let page = 2; page <= maxPage; page++) {
				addUrl(
					`https://www.eventbrite.com/d/${country}/${term}/?page=${page}&start_date=today`,
				);
			}
		}
	}

	// City-level searches for precision in dense urban tech hubs
	for (const [country, cities] of Object.entries(EVENTBRITE_CITIES)) {
		for (const city of cities) {
			for (const term of PRIMARY_HACK_TERMS) {
				addUrl(
					`https://www.eventbrite.com/d/${country}--${city}/${term}/${UPCOMING_SUFFIX}`,
				);
			}
		}
	}

	// Secondary keyword searches on largest markets (ES)
	// Extended to include Ecuador and Dominican Republic as growing LATAM tech scenes
	for (const term of SECONDARY_HACK_TERMS_ES) {
		for (const country of [
			"mexico",
			"colombia",
			"argentina",
			"chile",
			"peru",
			"ecuador",
			"dominican-republic",
		]) {
			addUrl(
				`https://www.eventbrite.com/d/${country}/${term}/${UPCOMING_SUFFIX}`,
			);
		}
	}

	// Secondary keyword searches for Brazil (PT)
	for (const term of SECONDARY_HACK_TERMS_PT) {
		addUrl(`https://www.eventbrite.com/d/brazil/${term}/${UPCOMING_SUFFIX}`);
	}

	// Online events targeting LATAM (virtual hackathons that specify LATAM location)
	for (const term of PRIMARY_HACK_TERMS) {
		addUrl(`https://www.eventbrite.com/d/online/${term}/${UPCOMING_SUFFIX}`);
	}

	return urls;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

interface EbServerEvent {
	name?: string;
	url?: string;
	start_date?: string;
	start_time?: string;
	end_date?: string;
	end_time?: string;
	summary?: string;
	full_description?: string;
	primary_venue?: {
		name?: string;
		address?: {
			city?: string;
			country?: string;
			address_1?: string;
			localized_address_display?: string;
		};
	};
	image?: { url?: string };
	is_online_event?: boolean;
	tags?: Array<{ tag?: string; prefix?: string; display_name?: string }>;
	ticket_availability?: {
		is_free?: boolean;
		minimum_ticket_price?: { major_value?: string; currency?: string };
	};
}

function extractEventbriteId(url: string): string | undefined {
	const match = url.match(/\/e\/[^/]*?-(\d+)\/?(?:\?|$)/);
	return match ? match[1] : undefined;
}

function extractFromServerData(html: string, pageUrl: string): RawHackathon[] {
	const results: RawHackathon[] = [];
	const MARKER = "window.__SERVER_DATA__ = ";
	const markerIdx = html.indexOf(MARKER);
	if (markerIdx < 0) return results;
	const jsonStart = markerIdx + MARKER.length;

	const scriptEnd = html.indexOf("</script>", jsonStart);
	if (scriptEnd < 0) return results;
	const rawContent = html.slice(jsonStart, scriptEnd);

	let depth = 0;
	let jsonEndIdx = -1;
	for (let i = 0; i < rawContent.length; i++) {
		const ch = rawContent[i];
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) {
				jsonEndIdx = i + 1;
				break;
			}
		}
	}

	const rawJson =
		jsonEndIdx > 0 ? rawContent.slice(0, jsonEndIdx) : rawContent.trim();
	if (!rawJson) return results;

	try {
		const serverData = JSON.parse(rawJson) as {
			search_data?: {
				events?: {
					results?: EbServerEvent[];
				};
			};
		};

		const events = serverData?.search_data?.events?.results ?? [];
		for (const ev of events) {
			const name = ev.name ?? "";
			if (!name) continue;

			const venue = ev.primary_venue;
			const addr = venue?.address;
			const eventUrl = ev.url ?? pageUrl;

			const startDate = ev.start_date
				? `${ev.start_date}${ev.start_time ? `T${ev.start_time}` : ""}`
				: undefined;
			const endDate = ev.end_date
				? `${ev.end_date}${ev.end_time ? `T${ev.end_time}` : ""}`
				: undefined;

			// Extract tags/themes if available
			const themes = ev.tags
				?.map((t) => t.display_name || t.tag)
				.filter((t): t is string => Boolean(t));

			results.push({
				name,
				sourceUrl: eventUrl,
				sourceType: "eventbrite",
				externalId: extractEventbriteId(eventUrl),
				startDate,
				endDate,
				city: addr?.city || undefined,
				country: addr?.country || undefined,
				venue: venue?.name || undefined,
				fullAddress:
					addr?.address_1 || addr?.localized_address_display || undefined,
				imageUrl: ev.image?.url || undefined,
				websiteUrl: eventUrl,
				modality: ev.is_online_event ? "online" : undefined,
				description: ev.full_description || ev.summary || undefined,
				themes: themes?.length ? themes : undefined,
			});
		}
	} catch {
		// JSON parse failed
	}

	return results;
}

function eventLdToRaw(
	event: Record<string, unknown>,
	pageUrl: string,
): RawHackathon {
	const location = event.location as Record<string, unknown> | undefined;
	const address = location?.address as Record<string, unknown> | undefined;
	const eventUrl = String(event.url || pageUrl);

	return {
		name: String(event.name || ""),
		sourceUrl: eventUrl,
		sourceType: "eventbrite",
		externalId: extractEventbriteId(eventUrl),
		description: String(event.description || ""),
		startDate: String(event.startDate || ""),
		endDate: String(event.endDate || ""),
		city: address ? String(address.addressLocality || "") : undefined,
		country: address ? String(address.addressCountry || "") : undefined,
		venue: location ? String(location.name || "") : undefined,
		fullAddress: address ? String(address.streetAddress || "") : undefined,
		imageUrl: event.image ? String(event.image) : undefined,
		websiteUrl: eventUrl,
		organizers: event.organizer
			? [
					{
						name: String(
							(event.organizer as Record<string, unknown>).name || "",
						),
						url: String((event.organizer as Record<string, unknown>).url || ""),
					},
				]
			: undefined,
	};
}

function parseEventbriteListPage(html: string, url: string): RawHackathon[] {
	const $ = cheerio.load(html);
	const results: RawHackathon[] = [];

	const serverDataResults = extractFromServerData(html, url);
	results.push(...serverDataResults);

	if (results.length === 0) {
		$('script[type="application/ld+json"]').each((_, el) => {
			try {
				const jsonStr = $(el).html();
				if (!jsonStr) return;
				const data = JSON.parse(jsonStr);

				if (data["@type"] === "ItemList" && data.itemListElement) {
					for (const item of data.itemListElement) {
						const event = item.item || item;
						if (event["@type"] !== "Event") continue;
						results.push(eventLdToRaw(event, url));
					}
				}

				if (data["@type"] === "Event") {
					results.push(eventLdToRaw(data, url));
				}
			} catch {
				// JSON parse failed, continue
			}
		});
	}

	if (results.length === 0) {
		$(
			"[data-testid='event-card'], .search-event-card-wrapper, .eds-event-card, [class*='event-card']",
		).each((_, el) => {
			const $el = $(el);

			const name = $el
				.find("h2, h3, [class*='title'], [data-testid='event-card-title']")
				.first()
				.text()
				.trim();
			if (!name) return;

			const eventLink =
				$el.find("a[href*='eventbrite.com/e/']").first().attr("href") ||
				$el.find("a").first().attr("href");
			if (!eventLink) return;

			const dateText = $el
				.find("[class*='date'], time, [data-testid='event-card-date']")
				.first()
				.text()
				.trim();

			const locationText = $el
				.find("[class*='location'], [data-testid='event-card-location']")
				.first()
				.text()
				.trim();

			const imageUrl = $el.find("img").first().attr("src") || undefined;

			const priceText = $el
				.find("[class*='price'], [data-testid='event-card-price']")
				.first()
				.text()
				.trim();

			let country: string | undefined;
			const urlMatch = url.match(/\/d\/([^/]+)\//);
			if (urlMatch) {
				country = urlMatch[1].split("--")[0];
			}

			results.push({
				name,
				sourceUrl: eventLink.startsWith("http")
					? eventLink
					: `https://www.eventbrite.com${eventLink}`,
				sourceType: "eventbrite",
				startDate: dateText || undefined,
				country,
				city: locationText || undefined,
				imageUrl,
				prizePool:
					priceText && priceText.toLowerCase() !== "free"
						? priceText
						: undefined,
			});
		});
	}

	return filterHackathonEvents(results, url);
}

// ---------------------------------------------------------------------------
// Hackathon relevance filtering
// ---------------------------------------------------------------------------

/**
 * Core hackathon identity keywords. These terms in the event NAME strongly
 * indicate a legitimate hackathon/competitive coding event.
 *
 * Split into tiers:
 *  - TIER_1: unambiguous (hackathon, datathon, hackaton variants) — pass immediately
 *  - TIER_2: probable hackathon (marathon of programming, competitive jam) — pass with no disqualifiers
 */
const HACK_TIER1 =
	/\b(hackathon|hackaton|hackath[oó]n|hack[\s-]?night|hack[\s-]?day|hack[\s-]?fest|hackfest|hackday|hacksprint|datathon|buildathon)\b/i;

// City/country-branded hackathon shorthands commonly used in LATAM (e.g. HackGDL, HackMTY, HackBog)
const HACK_CITY_BRAND =
	/\bhack(?:gdl|mtx|mx|mty|mde|bog|scl|bsas|ba|sp|rj|cdmx|rd|lima|qto|guaya|stgo|valpo|cba|rosario|cor|uru|col|ecu|pan|cri|gtm|hn|slv|ni|py|bo)\b/i;

// Competitive programming marathon variants in Spanish/Portuguese
const MARATONA_TECH =
	/marat[oó]n[a]?\s+(?:de\s+)?(?:programaci[oó]n|c[oó]digo|coding|hack|tech|software|datos|data|ia\b|ml\b|innovaci[oó]n)|(?:programaci[oó]n|c[oó]digo|coding|hack|tech)\s+marat[oó]n[a]?/i;

// Common LATAM naming patterns for hackathon-adjacent competitions
const HACK_LATAM_PATTERNS =
	/\b(innovathon|ideathon|appathon|devathon|coderathon|codeathon|maratona\s+hack|desaf[ií]o\s+(?:de\s+)?(?:innovaci[oó]n|tecnolog[ií]a|programaci[oó]n|digital|datos|ia|inteligencia)|reto\s+(?:de\s+)?(?:innovaci[oó]n|tecnolog[ií]a|programaci[oó]n|digital|datos)|reto\s+digital\s+(?:de\s+)?(?:innovaci[oó]n|programaci[oó]n)|concurso\s+de\s+programaci[oó]n|olimpiada\s+de\s+programaci[oó]n|olimp[ií]ada\s+(?:de\s+)?(?:programaci[oó]n|tecnolog[ií]a))\b/i;

/**
 * Noise patterns — event names that match hack keywords but are NOT hackathons.
 * Ordered roughly by frequency of occurrence in Eventbrite LATAM data.
 */
const NOISE_NAME_PATTERNS =
	/\b(hackerx|hacker\s*x)\b|(?:employer|candidate|job|career|hiring|recruitment)\s*(?:ticket|event|fair|night)|language\s*hack(?:er)?s?|\bbar\s*crawl\b|\bopen\s*mic\b|\bsocial\s*club\b|defensor[ií]a|\bsentir\b|\bconcierto\b|\bfestival\s+de\s+m[úu]sica\b|\bshow\b|\btour\b|\bexpo\s+(?!hac)|\bferia\s+(?!hac)|\bcongreso\s+(?!hac)|\bcumbre\b|\bsummit\s+(?!hac)|\bnetworking\s*(?:night|dinner|lunch|coffee|only|event)\b|\bcocktail\b|\bfitness\b|\byoga\b|\bmeditaci[oó]n\b|\bcertificaci[oó]n\b|\bcertification\b|\bcurso\s+de\b|\bcourse\s+(?:on|for|in)\b|\btaller\s+de\b|\bworkshop\b|\bwebinar\b|\bseminario\b|\bconferencia\b|\bcharla\b|\bpanel\b|\bforum\b|\bmeetup\b|\bbeer\s*(?:night|bash|fest|crawl)\b|\bcocktail\s*(?:night|party|event)\b|\bdinner\b|\bgala\b|\baward\b/i;

/**
 * Secondary false-positive guard on description/name for events that passed
 * the name-level filter but look dubious (e.g. "hackathon" mentioned inside a
 * workshop/conference description but that's clearly not the event type).
 */
const NOISE_TYPE_INDICATORS =
	/\b(?:workshop|webinar|seminar[io]*|conferencia|congreso|taller\s+de|curso\s+de|certificaci[oó]n|masterclass|bootcamp)\b/i;

function isLikelyHackathon(name: string, description?: string): boolean {
	// Tier 1: unambiguous hackathon keywords — accept immediately regardless of description
	if (HACK_TIER1.test(name) || HACK_CITY_BRAND.test(name)) {
		if (NOISE_NAME_PATTERNS.test(name)) return false;
		return true;
	}

	// Tier 2: maratona/LATAM competitive patterns
	if (MARATONA_TECH.test(name) || HACK_LATAM_PATTERNS.test(name)) {
		if (NOISE_NAME_PATTERNS.test(name)) return false;
		// Extra guard: if the event title itself signals a workshop/course type, reject
		if (NOISE_TYPE_INDICATORS.test(name)) return false;
		return true;
	}

	return false;
}

function filterHackathonEvents(
	results: RawHackathon[],
	url: string,
): RawHackathon[] {
	const filtered = results.filter((h) => {
		if (!h.name) return false;
		return isLikelyHackathon(h.name, h.description);
	});

	if (url.includes("/online/")) {
		return filtered.map((h) => ({
			...h,
			modality: h.modality ?? "online",
		}));
	}

	return filtered;
}

// ---------------------------------------------------------------------------
// Fetch helper (native fetch, no Firecrawl credits)
// ---------------------------------------------------------------------------

const DEFAULT_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	Accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"Accept-Language": "es-419,es;q=0.9,pt-BR;q=0.8,pt;q=0.7,en;q=0.6",
	"Accept-Encoding": "gzip, deflate, br",
	"Cache-Control": "no-cache",
	Pragma: "no-cache",
};

/**
 * Fetch with retry and jitter to handle transient rate limiting.
 * Returns null if all attempts fail.
 */
async function fetchHtml(url: string, retries = 2): Promise<string | null> {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch(url, {
				headers: DEFAULT_HEADERS,
				redirect: "follow",
			});

			if (res.status === 429 || res.status === 503) {
				// Rate limited or unavailable — wait longer before retry
				const backoff = (attempt + 1) * 3000 + Math.random() * 2000;
				console.warn(
					`[eventbrite] rate limited (${res.status}) at ${url}, retrying in ${Math.round(backoff)}ms`,
				);
				await new Promise((r) => setTimeout(r, backoff));
				continue;
			}

			if (!res.ok) {
				console.warn(`[eventbrite] HTTP ${res.status} for ${url}`);
				return null;
			}

			return await res.text();
		} catch (err) {
			if (attempt < retries) {
				const backoff = (attempt + 1) * 2000 + Math.random() * 1000;
				console.warn(
					`[eventbrite] fetch error for ${url}: ${err instanceof Error ? err.message : String(err)} — retrying in ${Math.round(backoff)}ms`,
				);
				await new Promise((r) => setTimeout(r, backoff));
			} else {
				console.warn(
					`[eventbrite] fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapeEventbrite(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];
	const seenUrls = new Set<string>();
	const urls = getEventbriteUrls();
	const CONCURRENCY = 5;

	console.log(
		`[eventbrite] scraping ${urls.length} URLs (concurrency=${CONCURRENCY})`,
	);

	// Process URLs in batches of CONCURRENCY
	for (let i = 0; i < urls.length; i += CONCURRENCY) {
		const batch = urls.slice(i, i + CONCURRENCY);
		const results = await Promise.all(
			batch.map(async (url) => {
				try {
					const html = await fetchHtml(url);
					if (!html) return [];
					return filterHackathonEvents(parseEventbriteListPage(html, url), url);
				} catch (err) {
					console.warn(
						`[eventbrite] failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
					);
					return [];
				}
			}),
		);

		for (const hackathons of results) {
			for (const h of hackathons) {
				if (seenUrls.has(h.sourceUrl)) continue;
				seenUrls.add(h.sourceUrl);
				allHackathons.push(h);
			}
		}

		// Small delay between batches to avoid rate limiting
		if (i + CONCURRENCY < urls.length) {
			await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
		}
	}

	console.log(`[eventbrite] done: ${allHackathons.length} hackathons`);
	return allHackathons;
}
