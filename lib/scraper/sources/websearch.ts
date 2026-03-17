/**
 * WebSearch Discovery Scraper
 *
 * Uses Claude Code's WebSearch tool (via agent invocation) to discover
 * LATAM hackathons. Unlike other scrapers, this file defines the query list
 * and data structures — the actual WebSearch execution happens when a
 * Claude Code agent runs the /websearch-scraper skill.
 *
 * Run via: /websearch-scraper skill in Claude Code
 * Skill: ~/.agents/skills/websearch-scraper/SKILL.md
 */

import type { RawHackathon } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function getCurrentYear(): number {
	return new Date().getFullYear();
}

// ---------------------------------------------------------------------------
// Query definitions — used by the Claude Code agent skill
// ---------------------------------------------------------------------------

export interface WebSearchQuery {
	label: string;
	query: string;
	scopeHint?: "latam" | "global";
}

export function getWebSearchQueries(): WebSearchQuery[] {
	const yr = getCurrentYear();
	const yrNext = yr + 1;

	return [
		// --- A: Geographic LATAM ---
		{
			label: `mexico-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon México ${yr} ${yrNext} convocatoria abierta inscripción Ciudad de México Guadalajara Monterrey universidades empresas tecnología`,
		},
		{
			label: `brasil-${yr}`,
			scopeHint: "latam" as const,
			query: `maratona hackathon desafio inovação Brasil ${yr} ${yrNext} inscrições abertas São Paulo Rio de Janeiro Belo Horizonte startups tecnologia`,
		},
		{
			label: `argentina-chile-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Argentina Chile ${yr} ${yrNext} inscripción abierta Buenos Aires Córdoba Santiago fintech innovación tecnología`,
		},
		{
			label: `colombia-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Colombia ${yr} ${yrNext} Bogotá Medellín Cali convocatoria abierta innovación tecnología universidades`,
		},
		{
			label: `peru-ecuador-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Perú Ecuador ${yr} ${yrNext} Lima Quito Guayaquil Arequipa convocatoria abierta innovación tecnología`,
		},
		{
			label: `centroamerica-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Centroamérica Guatemala Costa Rica Panamá ${yr} ${yrNext} tecnología innovación inscripción abierta`,
		},
		{
			label: `caribe-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Caribe República Dominicana Puerto Rico Cuba Jamaica Trinidad ${yr} ${yrNext} tecnología innovación convocatoria abierta`,
		},
		{
			label: `bolivia-paraguay-uruguay-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Bolivia Paraguay Uruguay ${yr} ${yrNext} La Paz Asunción Montevideo innovación tecnología convocatoria`,
		},
		{
			label: `venezuela-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Venezuela ${yr} ${yrNext} Caracas tecnología innovación convocatoria abierta programación`,
		},
		{
			label: `salvador-honduras-nicaragua-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon El Salvador Honduras Nicaragua ${yr} ${yrNext} San Salvador Tegucigalpa Managua tecnología innovación convocatoria abierta`,
		},
		{
			label: `latam-virtual-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon virtual online América Latina ${yr} ${yrNext} inscripción abierta premio tecnología equipos remotos`,
		},
		{
			label: `latam-universitario-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon universitario América Latina ${yr} ${yrNext} estudiantes programación tecnología universidades competencia`,
		},
		{
			label: `latam-gobierno-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon gobierno innovación pública América Latina ${yr} ${yrNext} datos abiertos tecnología cívica ministerio`,
		},
		{
			label: `latam-fintech-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon fintech banca digital pagos América Latina ${yr} ${yrNext} startup financiero convocatoria`,
		},
		{
			label: `latam-web3-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon blockchain web3 criptomonedas América Latina ${yr} ${yrNext} DeFi desarrollo descentralizado`,
		},
		{
			label: `latam-impacto-social-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon impacto social sostenibilidad clima América Latina ${yr} ${yrNext} ONG fundación organización internacional`,
		},
		{
			label: `latam-datathon-${yr}`,
			scopeHint: "latam" as const,
			query: `datathon maratón datos ciencia de datos data science América Latina ${yr} ${yrNext} convocatoria abierta universidades empresas inteligencia artificial`,
		},

		// --- A2: City-level LATAM (high-density tech hubs) ---
		{
			label: `bogota-medellin-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Bogotá Medellín Cali Colombia ${yr} ${yrNext} inscripción abierta programación innovación tecnología convocatoria`,
		},
		{
			label: `cdmx-gdl-mty-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Ciudad de México CDMX Guadalajara Monterrey ${yr} ${yrNext} convocatoria abierta tecnología innovación startup`,
		},
		{
			label: `lima-arequipa-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Lima Arequipa Cusco Perú ${yr} ${yrNext} convocatoria abierta tecnología innovación programación`,
		},
		{
			label: `sao-paulo-rio-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon maratona São Paulo Rio de Janeiro Belo Horizonte Brasil ${yr} ${yrNext} inscrições abertas tecnologia inovação`,
		},
		{
			label: `buenos-aires-cordoba-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Buenos Aires Córdoba Rosario Argentina ${yr} ${yrNext} inscripción abierta tecnología innovación startup`,
		},
		{
			label: `santiago-valparaiso-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Santiago Valparaíso Concepción Chile ${yr} ${yrNext} inscripción abierta tecnología innovación`,
		},
		{
			label: `quito-guayaquil-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Quito Guayaquil Cuenca Ecuador ${yr} ${yrNext} convocatoria abierta tecnología innovación programación`,
		},
		{
			label: `caracas-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Caracas Maracaibo Valencia Venezuela ${yr} ${yrNext} convocatoria tecnología innovación programación`,
		},
		{
			label: `lapaz-cochabamba-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon La Paz Cochabamba Santa Cruz Bolivia ${yr} ${yrNext} convocatoria abierta tecnología innovación`,
		},
		{
			label: `montevideo-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Montevideo Uruguay ${yr} ${yrNext} convocatoria abierta tecnología innovación startup fintech`,
		},
		{
			label: `asuncion-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Asunción Paraguay ${yr} ${yrNext} convocatoria abierta tecnología innovación programación`,
		},
		{
			label: `san-jose-ciudad-panama-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon San José Costa Rica Ciudad de Panamá Panamá ${yr} ${yrNext} convocatoria abierta tecnología innovación`,
		},
		{
			label: `santo-domingo-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon Santo Domingo República Dominicana San Juan Puerto Rico ${yr} ${yrNext} tecnología innovación convocatoria`,
		},

		// --- B: Thematic ---
		{
			label: `ai-ml-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon inteligencia artificial machine learning LLM América Latina ${yr} ${yrNext} convocatoria abierta modelos`,
		},
		{
			label: `salud-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon salud digital biotecnología healthtech América Latina ${yr} ${yrNext} hospital innovación médica convocatoria`,
		},
		{
			label: `agritech-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon agritech agricultura tecnología alimentos América Latina ${yr} ${yrNext} innovación agropecuaria`,
		},
		{
			label: `educacion-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon educación edtech aprendizaje América Latina ${yr} ${yrNext} estudiantes convocatoria`,
		},
		{
			label: `smart-cities-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon smart city ciudad inteligente movilidad urbanismo América Latina ${yr} ${yrNext} municipio`,
		},
		{
			label: `ciberseguridad-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon ciberseguridad CTF ethical hacking América Latina ${yr} ${yrNext} convocatoria`,
		},
		{
			label: `hardware-iot-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon hardware IoT robótica electrónica makers América Latina ${yr} ${yrNext} convocatoria`,
		},
		{
			label: `climate-energy-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon energía renovable cambio climático medio ambiente América Latina ${yr} ${yrNext} sostenibilidad`,
		},
		{
			label: `open-source-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon open source código abierto América Latina ${yr} ${yrNext} GitHub comunidad desarrolladores`,
		},
		{
			label: `legaltech-latam-${yr}`,
			scopeHint: "latam" as const,
			query: `hackathon legaltech govtech justicia gobierno digital América Latina ${yr} ${yrNext} datos abiertos`,
		},

		// --- C: Major Tech Companies (scopeHint: global) ---
		{
			label: `microsoft-${yr}`,
			scopeHint: "global" as const,
			query: `Microsoft hackathon challenge ${yr} ${yrNext} open registration global online Azure AI developer participants`,
		},
		{
			label: `google-${yr}`,
			scopeHint: "global" as const,
			query: `Google hackathon challenge ${yr} ${yrNext} open registration global developers Cloud AI Gemini`,
		},
		{
			label: `openai-${yr}`,
			scopeHint: "global" as const,
			query: `OpenAI hackathon GPT API challenge ${yr} ${yrNext} developers open registration global`,
		},
		{
			label: `meta-${yr}`,
			scopeHint: "global" as const,
			query: `Meta hackathon Llama AI developer challenge ${yr} ${yrNext} open registration global`,
		},
		{
			label: `aws-${yr}`,
			scopeHint: "global" as const,
			query: `AWS Amazon hackathon challenge ${yr} ${yrNext} cloud builders open registration global Latin America`,
		},
		{
			label: `anthropic-${yr}`,
			scopeHint: "global" as const,
			query: `Anthropic Claude hackathon challenge ${yr} ${yrNext} AI developers open registration global`,
		},
		{
			label: `huggingface-${yr}`,
			scopeHint: "global" as const,
			query: `Hugging Face hackathon challenge ${yr} ${yrNext} open source AI models developers registration`,
		},
		{
			label: `github-${yr}`,
			scopeHint: "global" as const,
			query: `GitHub hackathon Copilot challenge ${yr} ${yrNext} developers open source registration global`,
		},
		{
			label: `nvidia-${yr}`,
			scopeHint: "global" as const,
			query: `NVIDIA GPU AI deep learning hackathon challenge ${yr} ${yrNext} open registration global`,
		},
		{
			label: `ibm-${yr}`,
			scopeHint: "global" as const,
			query: `IBM watsonx AI hackathon challenge ${yr} ${yrNext} open registration global developers`,
		},
		{
			label: `blockchain-foundations-${yr}`,
			scopeHint: "global" as const,
			query: `Ethereum Solana Polkadot hackathon grant challenge ${yr} ${yrNext} open registration global developers`,
		},

		// --- D: Global open to LATAM ---
		{
			label: `global-social-impact-${yr}`,
			scopeHint: "global" as const,
			query: `online hackathon social impact climate SDGs ${yr} ${yrNext} open registration international teams Latin America`,
		},
		{
			label: `global-ai-open-${yr}`,
			scopeHint: "global" as const,
			query: `global AI hackathon challenge ${yr} ${yrNext} open registration international participants no country restriction`,
		},
		{
			label: `devpost-featured-${yr}`,
			scopeHint: "global" as const,
			query: `devpost.com hackathon ${yr} ${yrNext} online open registration prize money international participants`,
		},
		{
			label: `luma-hackathon-${yr}`,
			scopeHint: "global" as const,
			query: `lu.ma hackathon event ${yr} ${yrNext} online registration open international developers`,
		},
		{
			label: `un-multilateral-${yr}`,
			scopeHint: "global" as const,
			query: `United Nations UNDP World Bank hackathon challenge ${yr} ${yrNext} open registration global developing countries`,
		},
	];
}

// ---------------------------------------------------------------------------
// Result filtering — exported so the skill agent can reference these
// ---------------------------------------------------------------------------

/**
 * Domains that publish news/articles about hackathons rather than hosting them.
 * A URL from these domains is coverage, not the event itself — discard.
 */
const NEWS_MEDIA_DOMAINS = new Set([
	"primicias.ec",
	"elcomercio.com",
	"larepublica.pe",
	"elperuano.pe",
	"andina.pe",
	"noticiasneo.com",
	"semana.com",
	"forbes.com.mx",
	"expansion.mx",
	"elfinanciero.com.mx",
	"folha.uol.com.br",
	"globo.com",
	"terra.com.br",
	"infobae.com",
	"clarin.com",
	"lanacion.com.ar",
	"gestion.pe",
	"rpp.pe",
	"diariolibre.com",
	"listindiario.com",
	"portafolio.co",
	"eltiempo.com",
	"elespectador.com",
	"trustfortheamericas.org",
	"copernicuslac.eu",
	"perplexity.ai",
	"bing.com",
	"google.com",
]);

/**
 * URL path segments that signal this is an article/news page, not an event page.
 */
const NEWS_PATH_PATTERN =
	/\/(news|noticias|articles?|blog|prensa|sala-de-prensa|ciencia-tecnologia|innovacion\/articulo|emprendimiento|actualidad|novedades|press)\//i;

/**
 * Date-segment pattern in paths (e.g. /2026/03/10/) — strong signal of news article.
 */
const DATE_PATH_PATTERN = /\/\d{4}\/\d{2}(\/\d{2})?[/-]/;

/**
 * Snippet signals indicating the event already happened.
 */
const PAST_EVENT_SIGNALS =
	/\b(concluy[oó]|finaliz[oó]|termin[oó]|se llev[oó] a cabo|realiz[oó] con [eé]xito|concluded|sparked|showcased|winners were announced|ganadores del|ganadores fueron|entrega de premios|ceremony|as[ií] fue el|cr[oó]nica del|recap|los resultados del)\b/i;

/**
 * A result URL must come from the event's own page, not a news site.
 * Returns true if the URL should be rejected.
 */
export function isNewsArticleUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.replace(/^www\./, "");
		if (NEWS_MEDIA_DOMAINS.has(hostname)) return true;
		if (NEWS_PATH_PATTERN.test(parsed.pathname)) return true;
		if (DATE_PATH_PATTERN.test(parsed.pathname)) return true;
		// Generic platform homepage without event path
		const genericPlatforms = [
			"ethglobal.com",
			"devpost.com",
			"eventbrite.com",
			"lu.ma",
			"dorahacks.io",
		];
		if (
			genericPlatforms.some((p) => hostname.endsWith(p)) &&
			parsed.pathname.replace(/\//g, "").length === 0
		)
			return true;
	} catch {
		return false;
	}
	return false;
}

/**
 * Returns true if the snippet signals this is a past event recap.
 */
export function isPastEventSnippet(snippet: string): boolean {
	return PAST_EVENT_SIGNALS.test(snippet);
}

/**
 * Hackathon keyword guard — same regex used by perplexity.ts and haiku.ts.
 * Returns true if name+snippet contain at least one hackathon keyword.
 */
const HACKATHON_KEYWORD_GUARD =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|hack[\s-]fest|hack[\s-]night|code[\s-]?jam|coding[\s-]challenge|maratona[\s-]de[\s-]programac|maratón[\s-]de[\s-]programaci|reto[\s-](de[\s-])?c[oó]digo)\b/i;

export function looksLikeHackathon(name: string, snippet: string): boolean {
	return HACKATHON_KEYWORD_GUARD.test(`${name} ${snippet}`);
}

/**
 * Composite filter for a single WebSearch result.
 * Returns { include: true } if the result should be kept, or { include: false, reason } otherwise.
 */
export function shouldIncludeWebResult(
	url: string,
	title: string,
	snippet: string,
): { include: boolean; reason?: string } {
	if (isNewsArticleUrl(url)) {
		return { include: false, reason: "news-article-url" };
	}
	if (isPastEventSnippet(snippet)) {
		return { include: false, reason: "past-event-snippet" };
	}
	if (!looksLikeHackathon(title, snippet)) {
		return { include: false, reason: "no-hackathon-keyword" };
	}
	return { include: true };
}

// ---------------------------------------------------------------------------
// Data extraction helpers
// ---------------------------------------------------------------------------

const COUNTRY_ISO: Record<string, string> = {
	peru: "PE",
	perú: "PE",
	colombia: "CO",
	mexico: "MX",
	méxico: "MX",
	brazil: "BR",
	brasil: "BR",
	argentina: "AR",
	chile: "CL",
	ecuador: "EC",
	uruguay: "UY",
	bolivia: "BO",
	paraguay: "PY",
	venezuela: "VE",
	"costa rica": "CR",
	cuba: "CU",
	panama: "PA",
	panamá: "PA",
	guatemala: "GT",
	"el salvador": "SV",
	honduras: "HN",
	nicaragua: "NI",
	"dominican republic": "DO",
	"república dominicana": "DO",
	dominicana: "DO",
	haiti: "HT",
	haití: "HT",
	guyana: "GY",
	suriname: "SR",
	belize: "BZ",
	jamaica: "JM",
	"trinidad and tobago": "TT",
	trinidad: "TT",
	barbados: "BB",
	"puerto rico": "PR",
};

export function normalizeCountry(raw: string | undefined): string | undefined {
	if (!raw) return undefined;
	const lower = raw.toLowerCase().trim();
	return (
		COUNTRY_ISO[lower] ?? (/^[A-Z]{2}$/.test(raw.trim()) ? raw.trim() : raw)
	);
}

/** Deduplicate by URL and fuzzy name match (same logic as perplexity.ts) */
export function deduplicateByName(hackathons: RawHackathon[]): RawHackathon[] {
	const unique: RawHackathon[] = [];
	for (const h of hackathons) {
		const nameLower = h.name.toLowerCase().trim();
		const urlNorm = h.sourceUrl.toLowerCase().replace(/\/$/, "");
		const isDuplicate = unique.some((e) => {
			if (e.sourceUrl.toLowerCase().replace(/\/$/, "") === urlNorm) return true;
			const words = (a: string, b: string) => {
				const setA = new Set(
					a
						.toLowerCase()
						.replace(/[^a-záéíóúüñãâêôçàèìòùõ0-9\s]/gi, " ")
						.split(/\s+/)
						.filter((w) => w.length > 2),
				);
				const setB = new Set(
					b
						.toLowerCase()
						.replace(/[^a-záéíóúüñãâêôçàèìòùõ0-9\s]/gi, " ")
						.split(/\s+/)
						.filter((w) => w.length > 2),
				);
				let inter = 0;
				for (const w of setA) if (setB.has(w)) inter++;
				return inter / Math.max(setA.size, setB.size);
			};
			return words(nameLower, e.name.toLowerCase().trim()) > 0.75;
		});
		if (!isDuplicate) unique.push(h);
	}
	return unique;
}

// ---------------------------------------------------------------------------
// Note: scrapeWebsearch() is intentionally not implemented here.
// This scraper runs via the Claude Code agent skill:
//   ~/.agents/skills/websearch-scraper/SKILL.md
//
// The skill uses Claude Code's WebSearch tool to execute getWebSearchQueries(),
// extract structured RawHackathon data from results, and insert to DB.
//
// To run: invoke /websearch-scraper in Claude Code
// ---------------------------------------------------------------------------

export type { RawHackathon };
