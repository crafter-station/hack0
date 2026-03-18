/**
 * Exa Discovery Scraper
 *
 * Uses Exa.ai deep search with outputSchema to discover LATAM hackathons in a
 * single API call per query — no secondary LLM step needed.
 *
 * type: "deep" runs multiple query variations internally, ranks combined results,
 * and returns web-grounded structured JSON with field-level citations.
 *
 * Advantages vs Perplexity:
 * - 1 API call per query (vs 2 for haiku-discovery)
 * - Structured output from search itself (Exa's outputSchema)
 * - Neural semantic search finds pages by meaning, not keyword
 * - Per-field grounding/citations for verification
 * - Domain filtering and date filtering built-in
 *
 * Requires: exa-js (bun add exa-js)
 * Env: EXA_API_KEY
 */

import Exa from "exa-js";
import type { RawHackathon } from "@/lib/scraper/types";

const SOURCE_TYPE = "exa_discovery" as const;

const HACKATHON_OUTPUT_SCHEMA: {
	type: "object";
	properties: Record<string, unknown>;
	required: string[];
} = {
	type: "object",
	required: ["hackathons"],
	properties: {
		hackathons: {
			type: "array",
			description: "Upcoming hackathon events in Latin America",
			items: {
				type: "object",
				properties: {
					name: { type: "string", description: "Hackathon name" },
					startDate: { type: "string", description: "ISO 8601 YYYY-MM-DD" },
					city: { type: "string" },
					country: {
						type: "string",
						description: "ISO 2-letter code e.g. CO MX BR",
					},
					websiteUrl: { type: "string", description: "Event URL" },
					description: { type: "string" },
					modality: {
						type: "string",
						description: "online/in_person/hybrid",
					},
				},
			},
		},
	},
};

interface ExaHackathonOutput {
	hackathons: Array<{
		name?: string;
		startDate?: string;
		endDate?: string;
		city?: string;
		country?: string;
		websiteUrl?: string;
		description?: string;
		modality?: string;
		prizePool?: string;
		themes?: string[];
	}>;
}

function getQueries(): Array<{
	label: string;
	query: string;
	domains?: string[];
	scopeHint?: "latam" | "global";
	numResults?: number;
}> {
	const yr = new Date().getFullYear();
	return [
		// ── Aggregator platforms (domain-filtered) ───────────────────────────────
		{
			label: "devpost-latam",
			query: `upcoming hackathon Latin America LATAM ${yr} registration open`,
			domains: ["devpost.com"],
			numResults: 15,
		},
		{
			label: "luma-latam",
			query: `hackathon datathon innovation challenge Latin America ${yr}`,
			domains: ["lu.ma"],
			numResults: 15,
		},
		{
			label: "eventbrite-latam",
			query: `hackathon datathon innovation challenge ${yr} Latin America`,
			domains: [
				"eventbrite.com",
				"eventbrite.com.mx",
				"eventbrite.com.ar",
				"eventbrite.com.br",
				"eventbrite.co",
			],
		},
		{
			label: "sympla-brasil",
			// Sympla is Brazil's largest event ticketing/discovery platform
			query: `hackathon maratona programação datathon ${yr} Brasil`,
			domains: ["sympla.com.br"],
			numResults: 15,
		},
		{
			label: "dorahacks-latam",
			// DoraHacks is a major Web3/blockchain hackathon aggregator with growing LATAM presence
			query: `hackathon Web3 blockchain innovation Latin America LATAM ${yr} open registration`,
			domains: ["dorahacks.io"],
		},
		{
			label: "online-aggregators",
			query: `hackathon open to Latin American participants online virtual ${yr} remote teams`,
			domains: ["lablab.ai", "hackathon.com"],
		},

		// ── Geographic coverage (semantic, no domain filter) ─────────────────────
		{
			label: `peru-andean-${yr}`,
			query: `hackathon innovación tecnológica Peru Ecuador Bolivia ${yr} presencial o virtual convocatoria abierta`,
		},
		{
			label: `colombia-venezuela-${yr}`,
			query: `hackathon reto tecnológico Colombia Venezuela ${yr} universidades gobierno empresa convocatoria`,
		},
		{
			label: `mexico-centroamerica-${yr}`,
			query: `hackathon innovación México América Central Guatemala Costa Rica Panamá ${yr} equipos estudiantes profesionales`,
		},
		{
			label: `brasil-cono-sur-${yr}`,
			query: `hackathon maratona tecnologia Brasil Argentina Chile Uruguay Paraguay ${yr} inscrições abertas`,
		},
		{
			label: `caribe-${yr}`,
			query: `hackathon tecnología innovación Caribe República Dominicana Puerto Rico Cuba Jamaica ${yr}`,
		},

		// ── Thematic coverage (semantic, no domain filter) ────────────────────────
		{
			label: `latam-ai-ml-${yr}`,
			query: `hackathon inteligencia artificial machine learning datos LATAM ${yr} abierto participantes`,
		},
		{
			label: `latam-fintech-web3-${yr}`,
			query: `hackathon fintech blockchain web3 criptomonedas servicios financieros América Latina ${yr}`,
		},
		{
			label: `latam-health-climate-${yr}`,
			query: `hackathon salud medtech cambio climático sostenibilidad medio ambiente América Latina ${yr}`,
		},
		{
			label: `latam-govtech-social-${yr}`,
			query: `hackathon gobierno abierto civic tech impacto social ONGs organismos internacionales LATAM ${yr}`,
		},

		// ── Global (semantic, scopeHint global) ──────────────────────────────────
		{
			label: "global-open-online",
			query: `global hackathon ${yr} open to international participants no geographic restrictions online worldwide`,
			scopeHint: "global" as const,
		},
		{
			label: "global-ai-web3",
			query: `worldwide AI web3 blockchain hackathon ${yr} international teams open registration prize pool`,
			scopeHint: "global" as const,
		},
	];
}

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

function normalizeCountry(raw?: string | null): string | undefined {
	if (!raw) return undefined;
	const lower = raw.toLowerCase().trim();
	return (
		COUNTRY_ISO[lower] ?? (/^[A-Z]{2}$/.test(raw.trim()) ? raw.trim() : raw)
	);
}

function normalizeModality(
	raw?: string | null,
): "online" | "in_person" | "hybrid" | undefined {
	if (!raw) return undefined;
	const m = raw.toLowerCase();
	if (m.includes("hybrid") || m.includes("híbrido")) return "hybrid";
	if (m.includes("online") || m.includes("virtual") || m.includes("remote"))
		return "online";
	if (
		m.includes("in_person") ||
		m.includes("presencial") ||
		m.includes("in-person")
	)
		return "in_person";
	return undefined;
}

/**
 * Keyword guard: returns true if the event name or description suggests a genuine
 * hackathon/datathon/buildathon. This prevents non-hackathon events (conferences,
 * meetups, bootcamps) from passing through when Exa's outputSchema over-captures.
 * Events without a match still pass when scopeHint="global" (more lenient) or
 * when the name itself contains the word "hack" as a substring.
 */
const HACKATHON_KEYWORD_GUARD =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|hack[\s-]night|code[\s-]?jam|coding[\s-]challenge|programming[\s-]challenge|maratona[\s-]de[\s-]programa|desafio[\s-](de[\s-])?programa|reto[\s-](de[\s-])?c[oó]digo|reto[\s-]tecnol[oó]gico)\b/i;

function looksLikeHackathon(name: string, description?: string): boolean {
	const text = `${name} ${description ?? ""}`;
	return HACKATHON_KEYWORD_GUARD.test(text);
}

function itemToRaw(
	item: ExaHackathonOutput["hackathons"][number],
	label: string,
	scopeHint?: "latam" | "global",
): RawHackathon | null {
	if (!item.name?.trim()) return null;
	const name = item.name.trim();

	// Hackathon keyword guard: drop items that don't match hackathon vocabulary.
	// Global-scope queries get a pass (post-processor LLM handles global classification).
	if (scopeHint !== "global" && !looksLikeHackathon(name, item.description)) {
		return null;
	}
	const rawUrl = item.websiteUrl?.trim();
	const websiteUrl = rawUrl
		? rawUrl.startsWith("http")
			? rawUrl
			: `https://${rawUrl}`
		: undefined;

	return {
		name,
		sourceUrl:
			websiteUrl ??
			`https://exa.ai/discovery/${label}/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`,
		sourceType: SOURCE_TYPE,
		description: item.description ?? undefined,
		startDate: item.startDate ?? undefined,
		endDate: item.endDate ?? undefined,
		country: normalizeCountry(item.country),
		city: item.city ?? undefined,
		modality: normalizeModality(item.modality),
		websiteUrl,
		prizePool: item.prizePool ?? undefined,
		themes:
			Array.isArray(item.themes) && item.themes.length > 0
				? item.themes
				: undefined,
		scopeHint,
	};
}

/**
 * Word-overlap dedup ratio. Computes Jaccard similarity over the word sets
 * of two event names to detect near-duplicate events with minor name variations
 * (e.g. "Hackathon LATAM 2026" vs "LATAM Hackathon 2026").
 */
function nameOverlapRatio(a: string, b: string): number {
	const wordsOf = (s: string) =>
		new Set(
			s
				.toLowerCase()
				.replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
				.split(/\s+/)
				.filter(Boolean),
		);
	const setA = wordsOf(a);
	const setB = wordsOf(b);
	const intersection = [...setA].filter((w) => setB.has(w)).length;
	const union = new Set([...setA, ...setB]).size;
	return union === 0 ? 0 : intersection / union;
}

function dedup(hackathons: RawHackathon[]): RawHackathon[] {
	const unique: RawHackathon[] = [];
	for (const h of hackathons) {
		const n = h.name.toLowerCase().trim();
		if (
			!unique.some((e) => {
				// Exact name match
				if (e.name.toLowerCase().trim() === n) return true;
				// Exact URL match
				if (
					h.websiteUrl &&
					e.websiteUrl &&
					h.websiteUrl.replace(/\/$/, "") === e.websiteUrl.replace(/\/$/, "")
				)
					return true;
				// Fuzzy name overlap (Jaccard ≥ 0.75 → likely same event)
				if (nameOverlapRatio(h.name, e.name) >= 0.75) return true;
				return false;
			})
		)
			unique.push(h);
	}
	return unique;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapeExa(): Promise<RawHackathon[]> {
	const apiKey = process.env.EXA_API_KEY;
	if (!apiKey) {
		throw new Error("EXA_API_KEY is not set");
	}

	const exa = new Exa(apiKey);
	const allHackathons: RawHackathon[] = [];

	const QUERIES = getQueries();
	console.log(
		`[exa] starting deep-search discovery (${QUERIES.length} queries)`,
	);

	for (let i = 0; i < QUERIES.length; i++) {
		const {
			label,
			query,
			domains,
			scopeHint,
			numResults: queryNumResults,
		} = QUERIES[i];
		console.log(
			`[exa] [${i + 1}/${QUERIES.length}] ${label}${scopeHint ? ` [${scopeHint}]` : ""}`,
		);

		try {
			const result = await exa.search(query, {
				type: "deep",
				numResults: queryNumResults ?? 10,
				startPublishedDate: `${new Date().getFullYear()}-01-01`,
				outputSchema: HACKATHON_OUTPUT_SCHEMA,
				contents: {
					highlights: {
						query: "hackathon date registration city country prize",
						numSentences: 3,
						highlightsPerUrl: 2,
					},
				},
				...(domains ? { includeDomains: domains } : {}),
			});

			const output = result.output?.content as ExaHackathonOutput | undefined;
			const items = output?.hackathons ?? [];

			const hackathons = items
				.map((item) => itemToRaw(item, label, scopeHint))
				.filter((h): h is RawHackathon => h !== null);

			const cost = (result as Record<string, unknown>).costDollars as
				| { total?: number }
				| undefined;
			console.log(
				`[exa] [${label}] ${hackathons.length} hackathons found${cost?.total != null ? ` | cost $${cost.total.toFixed(4)}` : ""}`,
			);

			allHackathons.push(...hackathons);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[exa] [${label}] failed: ${msg}`);
		}

		if (i < QUERIES.length - 1) {
			await new Promise((r) => setTimeout(r, 500));
		}
	}

	const deduplicated = dedup(allHackathons);
	console.log(
		`[exa] done: ${deduplicated.length} unique (${allHackathons.length} raw)`,
	);

	return deduplicated;
}
