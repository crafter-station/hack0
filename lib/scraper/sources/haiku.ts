/**
 * Haiku Discovery Scraper — 2-step AI pipeline
 *
 * Uses Claude Haiku (via AI Gateway) with Perplexity sonar-pro for web search
 * to discover LATAM hackathons.
 *
 * Pipeline per query:
 *   1. generateText with perplexity/sonar-pro → raw web search results
 *   2. generateObject with Zod schema → structured hackathons
 *
 * Requires: AI_GATEWAY_API_KEY env var (Vercel AI Gateway)
 */

import { gateway } from "@ai-sdk/gateway";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { RawHackathon } from "@/lib/scraper/types";

const HAIKU_MODEL = gateway("anthropic/claude-haiku-4.5");
const SEARCH_MODEL = gateway("perplexity/sonar-pro");
const SOURCE_TYPE = "haiku_discovery" as const;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const hackathonSchema = z.object({
	hackathons: z.array(
		z.object({
			name: z.string().describe("Name of the hackathon"),
			startDate: z
				.string()
				.nullable()
				.describe("ISO 8601 (YYYY-MM-DD) or null"),
			endDate: z.string().nullable().describe("ISO 8601 (YYYY-MM-DD) or null"),
			city: z.string().nullable(),
			country: z
				.string()
				.nullable()
				.describe("ISO 2-letter code or country name"),
			websiteUrl: z
				.string()
				.nullable()
				.describe("Direct URL to the event page"),
			description: z.string().nullable().describe("1-2 sentence description"),
			modality: z.enum(["online", "in_person", "hybrid"]).nullable(),
			prizePool: z.string().nullable().describe("Prize string e.g. '$5,000'"),
			themes: z.array(z.string()).nullable(),
		}),
	),
});

// ---------------------------------------------------------------------------
// Query list
// ---------------------------------------------------------------------------

function getDateContext(): string {
	const now = new Date();
	const months = [
		"enero",
		"febrero",
		"marzo",
		"abril",
		"mayo",
		"junio",
		"julio",
		"agosto",
		"septiembre",
		"octubre",
		"noviembre",
		"diciembre",
	];
	return `Hoy es ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getLatamQueries(): Array<{
	label: string;
	query: string;
	scopeHint?: "latam" | "global";
}> {
	const yr = new Date().getFullYear();
	return [
		// --- Platform-targeted: surface events not caught by other scrapers ---
		{
			label: `dorahacks-latam-${yr}`,
			query: `dorahacks.io hackathon LATAM América Latina ${yr} convocatoria abierta Web3 IA blockchain cripto online participantes latinoamericanos`,
		},
		{
			label: `luma-latam-${yr}`,
			query: `lu.ma hackathon event LATAM América Latina ${yr} startup tech online presencial inscripción abierta estudiantes emprendedores`,
		},
		{
			label: `sympla-brasil-hackathon-${yr}`,
			query: `site:sympla.com.br hackathon maratona programação desafio inovação ${yr} São Paulo Rio de Janeiro Belo Horizonte presencial online inscrição aberta`,
		},

		// --- Geographic coverage: secondary LATAM markets less covered by perplexity ---
		{
			label: `peru-andino-${yr}`,
			query: `hackathon Perú ${yr} Lima Arequipa Trujillo Piura universidad PUCP UTEC UNI UPC gobierno ministerio startup convocatoria abierta`,
		},
		{
			label: `centroamerica-caribe-${yr}`,
			query: `hackathon Guatemala Costa Rica Panamá El Salvador Honduras Nicaragua República Dominicana Jamaica ${yr} innovación tecnología universidad gobierno`,
		},
		{
			label: `andino-cono-sur-${yr}`,
			query: `hackathon Ecuador Bolivia Uruguay Paraguay ${yr} Quito Guayaquil La Paz Montevideo Asunción innovación tecnología startup`,
		},

		// --- Thematic: distinct niches not well covered by perplexity ---
		{
			label: `latam-govtech-datos-abiertos-${yr}`,
			query: `hackathon datos abiertos gobierno digital smart city ciudades inteligentes América Latina ${yr} ministerio alcaldía municipio convocatoria`,
		},
		{
			label: `latam-agroindustria-agua-${yr}`,
			query: `hackathon agtech agricultura tecnología campo agua riego seguridad alimentaria América Latina ${yr} IICA FAO ministerio agricultura`,
		},
		{
			label: `latam-educacion-inclusion-${yr}`,
			query: `hackathon educación inclusión digital tecnología educativa EdTech juventud América Latina ${yr} ONG fundación BID UNICEF`,
		},
		{
			label: `latam-salud-biotech-${yr}`,
			query: `hackathon salud digital medicina tecnología biotech medtech América Latina ${yr} hospital clínica ministerio salud PAHO OPS`,
		},
		{
			label: `latam-fintech-web3-${yr}`,
			query: `hackathon fintech pagos digitales blockchain cripto Web3 América Latina ${yr} startup banco inclusión financiera Nubank Mercado Libre`,
		},

		// --- Organizer type: multilateral development banks and specific institutions ---
		{
			label: `latam-bid-caf-multilateral-${yr}`,
			query: `hackathon convocatoria BID IDB CAF FOMIN CEPAL banco desarrollo multilateral organismo internacional América Latina ${yr} innovación`,
		},
		{
			label: `latam-corporativo-telecom-${yr}`,
			query: `hackathon organizado empresa telecomunicaciones banca fintech corporativo América Latina ${yr} Claro Telefónica Tigo Bancolombia Bradesco Santander premios`,
		},

		// --- Global events open to LATAM participants ---
		{
			label: `global-ai-open-${yr}`,
			query: `AI hackathon ${yr} open worldwide no geographic restriction international participants online prize pool teams`,
			scopeHint: "global" as const,
		},
		{
			label: `global-web3-open-${yr}`,
			query: `blockchain Web3 hackathon ${yr} open globally international teams online remote participation prize pool protocol foundation`,
			scopeHint: "global" as const,
		},
		{
			label: `global-social-impact-open-${yr}`,
			query: `hackathon innovación social impacto ${yr} internacional abierto ONU PNUD organizaciones multilaterales equipos internacionales América Latina elegible`,
			scopeHint: "global" as const,
		},
	];
}

// ---------------------------------------------------------------------------
// Country normalisation
// ---------------------------------------------------------------------------

const COUNTRY_ISO: Record<string, string> = {
	méxico: "MX",
	mexico: "MX",
	argentina: "AR",
	brasil: "BR",
	brazil: "BR",
	colombia: "CO",
	chile: "CL",
	perú: "PE",
	peru: "PE",
	venezuela: "VE",
	ecuador: "EC",
	bolivia: "BO",
	paraguay: "PY",
	uruguay: "UY",
	"costa rica": "CR",
	panamá: "PA",
	panama: "PA",
	guatemala: "GT",
	"el salvador": "SV",
	honduras: "HN",
	nicaragua: "NI",
	"república dominicana": "DO",
	cuba: "CU",
	latam: "LATAM",
};

function normalizeCountry(raw: string | undefined | null): string | undefined {
	if (!raw) return undefined;
	const lower = raw.toLowerCase().trim();
	return (
		COUNTRY_ISO[lower] ?? (/^[A-Z]{2}$/.test(raw.trim()) ? raw.trim() : raw)
	);
}

// ---------------------------------------------------------------------------
// Item → RawHackathon
// ---------------------------------------------------------------------------

type HackathonItem = z.infer<typeof hackathonSchema>["hackathons"][number];

function itemToRaw(
	item: HackathonItem,
	scopeHint?: "latam" | "global",
): RawHackathon | null {
	if (!item.name?.trim()) return null;
	const name = item.name.trim();
	const rawUrl = item.websiteUrl?.trim();
	const websiteUrl = rawUrl
		? rawUrl.startsWith("http")
			? rawUrl
			: `https://${rawUrl}`
		: undefined;
	const sourceUrl =
		websiteUrl ??
		`https://discovery.haiku/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`;

	return {
		name,
		sourceUrl,
		sourceType: SOURCE_TYPE,
		description: item.description ?? undefined,
		startDate: item.startDate ?? undefined,
		endDate: item.endDate ?? undefined,
		country: normalizeCountry(item.country),
		city: item.city ?? undefined,
		modality: item.modality ?? undefined,
		websiteUrl,
		prizePool: item.prizePool ?? undefined,
		themes: item.themes ?? undefined,
		scopeHint,
	};
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function wordOverlapRatio(a: string, b: string): number {
	const words = (s: string) =>
		new Set(
			s
				.toLowerCase()
				.replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
				.split(/\s+/)
				.filter((w) => w.length > 2),
		);
	const wa = words(a);
	const wb = words(b);
	if (wa.size === 0 || wb.size === 0) return 0;
	let n = 0;
	for (const w of wa) if (wb.has(w)) n++;
	return n / Math.max(wa.size, wb.size);
}

function deduplicateByName(hackathons: RawHackathon[]): RawHackathon[] {
	const unique: RawHackathon[] = [];
	for (const h of hackathons) {
		const n = h.name.toLowerCase().trim();
		const isDup = unique.some((e) => {
			if (e.name.toLowerCase().trim() === n) return true;
			if (wordOverlapRatio(n, e.name.toLowerCase().trim()) > 0.75) return true;
			if (
				h.websiteUrl &&
				e.websiteUrl &&
				h.websiteUrl.toLowerCase().replace(/\/$/, "") ===
					e.websiteUrl.toLowerCase().replace(/\/$/, "") &&
				h.country === e.country
			)
				return true;
			return false;
		});
		if (!isDup) unique.push(h);
	}
	return unique;
}

// ---------------------------------------------------------------------------
// Hackathon keyword guard (code-level, applied after LLM extraction)
// ---------------------------------------------------------------------------

/**
 * Keyword regex for genuine hackathon event types.
 * Applied to name + description after extraction to catch non-hackathon
 * events that slip through the prompt-based guard.
 */
const HACKATHON_NAME_KEYWORDS =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|code[\s-]?jam|coding[\s-]challenge|maratona[\s-]de[\s-]programac|maratón[\s-]de[\s-]programación|desafio[\s-](de[\s-])?programac|reto[\s-](de[\s-])?codigo|sprint[\s-]de[\s-]inovac|programa[\s-]de[\s-]desafio)\b/i;

/**
 * Returns true if the hackathon item passes the keyword guard OR has no
 * name/description to check (benefit of the doubt for sparse records).
 */
function passesHackathonGuard(item: {
	name: string;
	description: string | null;
}): boolean {
	const text = `${item.name} ${item.description ?? ""}`;
	// If the name alone contains a keyword, fast-pass
	if (HACKATHON_NAME_KEYWORDS.test(item.name)) return true;
	// Check combined name+description
	if (HACKATHON_NAME_KEYWORDS.test(text)) return true;
	// No keyword found — apply conservative drop only if description is substantial
	// (≥ 30 chars). Short/empty descriptions get benefit of the doubt.
	if ((item.description ?? "").length >= 30) return false;
	return true;
}

// ---------------------------------------------------------------------------
// Per-query scrape
// ---------------------------------------------------------------------------

async function scrapeQuery(
	label: string,
	query: string,
	scopeHint?: "latam" | "global",
): Promise<RawHackathon[]> {
	// Step 1: web search via Perplexity sonar-pro
	const searchResult = await generateText({
		model: SEARCH_MODEL,
		prompt: `Search for upcoming hackathon events. ${getDateContext()}. Query: ${query}\n\nFind events with their names, dates, locations, and URLs.`,
	});

	const searchContent = searchResult.text;

	if (!searchContent.trim()) {
		console.warn(`[haiku] [${label}] No search results returned`);
		return [];
	}

	// Step 2: structured extraction via generateObject + Zod
	const structured = await generateObject({
		model: HAIKU_MODEL,
		system: `Extract hackathon events from web search results. Only include genuine hackathons, datathons, buildathons, or programming marathons — events where participants build a project or solution within a time limit and compete for prizes or recognition. EXCLUDE: meetups, conferences, bootcamps, courses, workshops, recruiting events, demo days, and networking events. Only include upcoming events (after ${getDateContext()}).`,
		prompt: `Extract ALL hackathon events from these search results for query "${label}":\n\n${searchContent.slice(0, 16_000)}\n\nFor each event include: name, dates (ISO 8601), city, country, websiteUrl, description (1-2 sentences), modality, prizePool, and themes. Prefer events with confirmed URLs.`,
		schema: hackathonSchema,
	});

	// Step 3: code-level keyword guard — filter items without hackathon keywords
	// in name+description. This catches non-hackathons the LLM prompt may miss.
	const rawItems = structured.object.hackathons;
	const guardedItems = rawItems.filter((item) => {
		const passes = passesHackathonGuard(item);
		if (!passes) {
			console.debug(`[haiku] [${label}] keyword-guard drop: "${item.name}"`);
		}
		return passes;
	});

	if (guardedItems.length < rawItems.length) {
		console.log(
			`[haiku] [${label}] keyword-guard: ${rawItems.length - guardedItems.length} dropped (${rawItems.length} → ${guardedItems.length})`,
		);
	}

	const hackathons = guardedItems
		.map((item) => itemToRaw(item, scopeHint))
		.filter((h): h is RawHackathon => h !== null);

	return hackathons;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapeHaiku(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];

	const LATAM_QUERIES = getLatamQueries();
	console.log(
		`[haiku] Starting discovery scrape (${LATAM_QUERIES.length} queries)`,
	);

	for (let i = 0; i < LATAM_QUERIES.length; i++) {
		const { label, query, scopeHint } = LATAM_QUERIES[i];
		console.log(
			`[haiku] Querying [${i + 1}/${LATAM_QUERIES.length}]: ${label}${scopeHint ? ` [${scopeHint}]` : ""}`,
		);

		try {
			const hackathons = await scrapeQuery(label, query, scopeHint);
			console.log(`[haiku] [${label}] ${hackathons.length} hackathons found`);
			allHackathons.push(...hackathons);
		} catch (err) {
			console.error(
				`[haiku] [${label}] failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}

		if (i < LATAM_QUERIES.length - 1) {
			await new Promise((r) => setTimeout(r, 300));
		}
	}

	const deduplicated = deduplicateByName(allHackathons);
	console.log(
		`[haiku] Discovery complete: ${deduplicated.length} unique (${allHackathons.length} raw)`,
	);

	return deduplicated;
}
