/**
 * MLH (Major League Hacking) scraper.
 * Uses native fetch — MLH renders via Inertia.js with event data in the
 * HTML-entity-encoded `data-page` attribute on the page.
 *
 * Coverage strategy:
 *  - Scrapes previous, current, and next season pages so cross-season events
 *    near the year boundary are never missed.  MLH seasons run Fall→Spring
 *    (e.g. "2026" season = Fall 2025–Spring 2026), so the prior-year page
 *    can still hold relevant upcoming events in Q1 of the current year.
 *  - Uses venue_address.country to tag LATAM events with scopeHint:"latam"
 *    directly, saving downstream LLM classification calls.
 *    IMPORTANT: MLH's `region` field is "AMER" (all of the Americas, including
 *    both North and Latin America) — NOT "Latin America". We cannot use the
 *    region field alone to distinguish LATAM from US/CA events. Instead we
 *    check venue_address.country against the LATAM ISO country code list.
 *  - Digital events with no country (location="Everywhere, Worldwide") get
 *    scopeHint:"global"; the post-processor's global LLM path decides whether
 *    to keep them.
 */

import { LATAM_COUNTRIES_ISO } from "@/lib/scraper/latam-filter";
import type { RawHackathon } from "@/lib/scraper/types";

// MLH seasons run roughly Fall→Spring (e.g. "2026" = Fall 2025–Spring 2026).
// We include the previous year, current year, and next year to capture:
//  - prev year: hackathons announced in Fall of (year-1) that run in Q1 of current year
//  - current year: the main active season
//  - next year: early announcements for the upcoming Fall season
// The post-processor's filterFuture step drops truly past events.
const CURRENT_YEAR = new Date().getFullYear();
const MLH_URLS = [
	`https://www.mlh.com/seasons/${CURRENT_YEAR - 1}/events`,
	`https://www.mlh.com/seasons/${CURRENT_YEAR}/events`,
	`https://www.mlh.com/seasons/${CURRENT_YEAR + 1}/events`,
];

// ---------------------------------------------------------------------------
// Parser types
// ---------------------------------------------------------------------------

interface MlhVenueAddress {
	city?: string;
	state?: string;
	country?: string;
}

interface MlhEvent {
	id?: string;
	slug: string;
	name: string;
	/** MLH status values observed: "open", "upcoming", "closed", "live", "cancelled", "pending", "ended" */
	status: string;
	starts_at: string;
	ends_at: string;
	date_range?: string;
	url: string;
	location?: string;
	/**
	 * MLH format types observed in production:
	 *  "physical" | "digital" | "hybrid" | "hybrid_physical"
	 */
	format_type: string;
	background_url?: string;
	logo_url?: string;
	website_url?: string;
	/**
	 * MLH region tag. Observed values: "AMER", "APAC", "EMEA", null.
	 * "AMER" covers all of the Americas (North + Latin + Caribbean).
	 * null is used for global digital events (location="Everywhere, Worldwide").
	 * Do NOT use this field alone to detect LATAM — use venue_address.country instead.
	 */
	region?: string | null;
	custom_fields?: Record<string, unknown>;
	venue_address?: MlhVenueAddress;
}

interface InertiaProps {
	upcoming_events?: MlhEvent[];
	past_events?: MlhEvent[];
	[key: string]: unknown;
}

interface InertiaPage {
	props?: InertiaProps;
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * MLH embeds event data as HTML-entity-encoded JSON in the Inertia.js
 * `data-page` attribute on the page's #app element.
 *
 * The attribute value is HTML-entity encoded, so literal `"` in the JSON
 * appears as `&quot;`. We decode entities then parse the JSON.
 *
 * We include both upcoming_events and past_events from the payload. The
 * post-processor's filterFuture step will drop events whose end date has
 * already passed, so including past_events provides a safety net for events
 * that just ended (within the grace window).
 */
function extractEventsFromHtml(html: string): MlhEvent[] {
	// Match the data-page attribute on any element. The value is always
	// HTML-entity encoded, so it will never contain a literal unescaped `"`.
	// The pattern greedily captures everything between `data-page="` and the
	// closing `"` that is followed by whitespace or `>`.
	const match = html.match(/data-page="([^"]*)"(?:\s|\/|>)/);
	if (!match) {
		// Fallback: some builds may use single-quoted attributes
		const matchSingle = html.match(/data-page='([^']*)'/);
		if (!matchSingle) return [];
		return parseInertiaJson(matchSingle[1]);
	}
	return parseInertiaJson(match[1]);
}

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#39;/g, "'")
		.replace(/&#x27;/g, "'")
		.replace(/&#x2F;/g, "/")
		.replace(/&#x60;/g, "`")
		.replace(/&#x3D;/g, "=");
}

function parseInertiaJson(encoded: string): MlhEvent[] {
	const decoded = decodeHtmlEntities(encoded);

	let data: InertiaPage;
	try {
		data = JSON.parse(decoded) as InertiaPage;
	} catch {
		return [];
	}

	const upcoming: MlhEvent[] = (data.props?.upcoming_events ??
		[]) as MlhEvent[];
	const past: MlhEvent[] = (data.props?.past_events ?? []) as MlhEvent[];
	return [...upcoming, ...past];
}

/**
 * Determine scopeHint based on the event's actual country, not the coarse
 * MLH region tag. MLH's "AMER" region covers both North America and Latin
 * America, so we must check venue_address.country against the LATAM ISO list
 * to correctly identify LATAM in-person events.
 *
 * Logic:
 *  - country is a LATAM ISO code → "latam" (fast-keep path in post-processor)
 *  - no country (digital / worldwide events) → "global" (LLM decides)
 *  - country is non-LATAM (US, CA, GB, IN, …) → "global" (LLM decides or drops)
 *
 * Tagging LATAM events with scopeHint:"latam" allows the post-processor's
 * rule-based fast-keep path to fire immediately (when name contains "hackathon"),
 * skipping the expensive global-LLM classification call entirely.
 */
function determineScopeHint(
	country: string | undefined,
	modality: string | undefined,
): "latam" | "global" | undefined {
	// LATAM country → tag as latam for fast-keep
	if (
		country &&
		(LATAM_COUNTRIES_ISO as readonly string[]).includes(country.toUpperCase())
	) {
		return "latam";
	}
	// Online/worldwide with no country → global (LLM decides)
	if (!country && (modality === "online" || modality === "virtual")) {
		return "global";
	}
	// Non-LATAM in-person (US, CA, UK, IN, etc.) → no hint → preScoreFilter fast-drops
	return undefined;
}

function parseMlhEventsPage(html: string): RawHackathon[] {
	const events = extractEventsFromHtml(html);
	const results: RawHackathon[] = [];

	for (const event of events) {
		// Skip cancelled events — they will never run
		if (event.status?.toLowerCase() === "cancelled") continue;

		const mlhPageUrl = event.url.startsWith("http")
			? event.url
			: `https://www.mlh.com${event.url}`;
		const sourceUrl = mlhPageUrl;
		// Prefer the event's own website; fall back to the MLH listing page
		const websiteUrl = event.website_url ?? mlhPageUrl;

		let modality: string | undefined;
		const fmt = (event.format_type ?? "").toLowerCase();
		if (fmt === "physical" || fmt === "in-person" || fmt === "in_person")
			modality = "in_person";
		else if (fmt === "digital" || fmt === "online" || fmt === "virtual")
			modality = "online";
		else if (fmt === "hybrid" || fmt === "hybrid_physical") modality = "hybrid";

		let city: string | undefined;
		let country: string | undefined;

		// venue_address is the authoritative source; fall back to free-text location
		const va = event.venue_address;
		if (va && modality !== "online") {
			city = va.city ?? undefined;
			country = va.country ? va.country.toUpperCase() : undefined;
		} else if (event.location && modality !== "online") {
			const parts = event.location
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			if (parts.length >= 2) {
				city = parts[0];
				country = parts[parts.length - 1];
			} else if (parts.length === 1) {
				city = parts[0];
			}
		}

		// Prefer banner/background image; fall back to logo
		const imageUrl = event.background_url ?? event.logo_url;

		// Use country ISO to set scopeHint — NOT the MLH region field.
		// MLH uses "AMER" for all of the Americas (North + Latin), so we cannot
		// rely on it to identify LATAM events. We check the ISO country code instead.
		const scopeHint = determineScopeHint(country, modality);

		results.push({
			name: event.name,
			sourceUrl,
			sourceType: "mlh",
			externalId: event.slug,
			startDate: event.starts_at,
			endDate: event.ends_at,
			modality,
			city,
			country,
			imageUrl,
			websiteUrl,
			// MLH is always the co-organizer (they sanction/certify the event)
			organizers: [
				{ name: "MLH (Major League Hacking)", url: "https://mlh.io" },
			],
			...(scopeHint ? { scopeHint } : {}),
		});
	}

	return results;
}

// ---------------------------------------------------------------------------
// Native fetch helper
// ---------------------------------------------------------------------------

const RATE_LIMIT_MS = 1000;
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
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

export async function scrapeMlh(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];
	const seenIds = new Set<string>();

	console.log(`[mlh] Starting scrape of ${MLH_URLS.length} season URLs`);

	for (const url of MLH_URLS) {
		try {
			const page = await fetchHtml(url);
			const hackathons = parseMlhEventsPage(page.html);
			const latamCount = hackathons.filter(
				(h) => h.scopeHint === "latam",
			).length;
			const globalCount = hackathons.filter(
				(h) => h.scopeHint === "global",
			).length;
			console.log(
				`[mlh] ${url}: ${hackathons.length} events ` +
					`(${latamCount} LATAM-tagged, ${globalCount} global-tagged)`,
			);

			for (const h of hackathons) {
				const key = h.externalId ?? h.name;
				if (seenIds.has(key)) continue;
				seenIds.add(key);
				allHackathons.push(h);
			}
		} catch (err) {
			console.error(
				`[mlh] Scrape failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	const latamTotal = allHackathons.filter(
		(h) => h.scopeHint === "latam",
	).length;
	const globalTotal = allHackathons.filter(
		(h) => h.scopeHint === "global",
	).length;
	console.log(
		`[mlh] Scrape complete: ${allHackathons.length} unique hackathons ` +
			`(${latamTotal} LATAM, ${globalTotal} global)`,
	);
	return allHackathons;
}
