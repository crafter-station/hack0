/**
 * Perplexity Discovery Scraper
 *
 * Uses Perplexity Sonar (web search + LLM) to discover LATAM hackathons
 * that may not be indexed on Devpost, Eventbrite or Meetup.
 * Queries are in Spanish, Portuguese and English to maximize coverage.
 *
 * Env: PERPLEXITY_API_KEY
 */

import type { RawHackathon } from "@/lib/scraper/types";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar-pro";

const SYSTEM_PROMPT = `Eres un asistente especializado en descubrir hackathones genuinos en América Latina.
Cuando el usuario te pida información, busca en internet y responde ÚNICAMENTE con un array JSON válido.
No incluyas texto fuera del JSON. No uses bloques de código markdown.

IMPORTANTE — Solo incluye eventos que cumplan TODOS estos criterios:
1. Es un hackathon, datathon, buildathon, maratón de programación o competencia donde los participantes CONSTRUYEN un proyecto en tiempo limitado (horas o días) y hay evaluación por jurado.
2. El evento es FUTURO (fecha de inicio posterior a hoy). No incluyas eventos pasados ni ediciones de años anteriores.
3. Tienes una URL oficial DIRECTA del evento (página de registro, convocatoria, o sitio del organizador). No uses URLs de artículos de noticias ni blogs de terceros.

NO incluyas bajo ningún concepto:
- Conferencias, cumbres, summits (aunque tengan "hackathon" en el nombre del evento general)
- Meetups, networking, charlas, paneles, talleres, cursos, bootcamps, demos days
- Ferias de empleo, programas de becas o fellowships
- Eventos pasados, ganadores ya anunciados, recaps o crónicas
- Resultados de búsqueda que sean artículos periodísticos (primicias.ec, infobae.com, elcomercio.com, etc.)
- Páginas genéricas de plataformas sin evento específico (ej: ethglobal.com sin URL de evento concreto)

Para el campo websiteUrl: usa EXCLUSIVAMENTE la URL de la página oficial del evento (el dominio del organizador, devpost.com/nombre-hackathon, lu.ma/evento, etc.). Nunca uses una URL de cobertura de prensa.

Cada elemento del array debe tener estos campos (omite los que no encuentres):
- name: string (nombre exacto del hackathon)
- startDate: string (fecha ISO 8601, ej: "2026-04-15")
- endDate: string (opcional)
- city: string
- country: string (nombre del país o código ISO de 2 letras)
- websiteUrl: string (URL OFICIAL del evento — no artículos, no buscadores)
- description: string (1-2 oraciones describiendo el formato de competencia)
- modality: string ("online", "in_person" o "hybrid")
- prizePool: string (premios, ej: "$5,000")
- themes: array de strings (temas, ej: ["IA", "fintech"])

Si no encuentras la URL oficial del evento, omite ese evento del array. Si no encuentras eventos genuinos, responde [].`;

interface PerplexityHackathonItem {
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
	technologies?: string[];
	registrationUrl?: string;
}

interface PerplexityResponse {
	choices: Array<{
		message: { role: string; content: string };
		finish_reason: string;
	}>;
	citations?: string[];
}

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

function getYearRange(): string {
	const year = new Date().getFullYear();
	return `${year}-${year + 1}`;
}

function getLatamQueries(): Array<{
	label: string;
	query: string;
	scopeHint?: "latam" | "global";
}> {
	const dc = getDateContext();
	const yr = new Date().getFullYear();
	const yrRange = getYearRange();
	return [
		// --- Geographic coverage: major markets ---
		{
			label: `mexico-${yr}`,
			query: `${dc}. Busca hackathones próximos en México en ${yrRange}, organizados por universidades públicas y privadas, empresas tecnológicas y dependencias de gobierno federal o estatal. Cubre ciudades como Ciudad de México, Guadalajara, Monterrey y Puebla. Incluye hackathones presenciales, híbridos y virtuales con inscripción abierta. Lista nombre, ciudad, fecha, modalidad y URL de cada evento.`,
		},
		{
			label: `brasil-${yr}`,
			query: `${dc}. Busca maratonas de programação, hackathons e desafios de inovação no Brasil em ${yrRange}, organizados por universidades federais, startups, bancos e empresas de tecnologia. Inclui eventos em São Paulo, Rio de Janeiro, Belo Horizonte, Recife e Brasília. Lista nome, cidade, data, modalidade e URL de cada evento.`,
		},
		{
			label: `cono-sur-${yr}`,
			query: `${dc}. Busca hackathones próximos en Argentina, Chile y Uruguay en ${yrRange}, organizados por universidades, agencias gubernamentales de innovación, empresas fintech o tecnológicas, y aceleradoras de startups. Cubre Buenos Aires, Córdoba, Santiago, Valparaíso y Montevideo. Incluye hackathones presenciales y virtuales con inscripción abierta. Lista nombre, país, ciudad, fecha y URL.`,
		},
		{
			label: `colombia-${yr}`,
			query: `${dc}. Busca hackathones próximos en Colombia en ${yrRange}, organizados por universidades (EAFIT, Uniandes, Universidad Nacional, ICESI), empresas de tecnología y finanzas (Bancolombia, Grupo Bolívar, Rappi), Ministerio de Ciencia Tecnología e Innovación y aceleradoras de startups. Cubre Bogotá, Medellín, Cali, Barranquilla y Cartagena. Incluye modalidad presencial, híbrida y virtual. Lista nombre, ciudad, fecha, modalidad y URL.`,
		},
		{
			label: `pais-andinos-venezuela-${yr}`,
			query: `${dc}. Busca hackathones en Perú, Ecuador, Bolivia y Venezuela en ${yrRange}, organizados por universidades nacionales, organismos de gobierno, empresas privadas y ONGs. Cubre Lima, Arequipa, Quito, Guayaquil, La Paz, Caracas y Maracaibo. Incluye hackathones de innovación pública, tecnología agropecuaria, salud y educación. Lista nombre, país, ciudad, fecha y URL.`,
		},
		{
			label: `centroamerica-caribe-${yr}`,
			query: `${dc}. Busca hackathones en Centroamérica y el Caribe en ${yrRange}: Guatemala, Costa Rica, Panamá, El Salvador, Honduras, Nicaragua y República Dominicana. Organizados por universidades, operadoras de telecomunicaciones, bancos de desarrollo regional u organismos internacionales. Lista nombre, país, ciudad, fecha, modalidad y URL.`,
		},
		// --- Thematic coverage ---
		{
			label: `latam-ia-fintech-${yr}`,
			query: `${dc}. Busca hackathones temáticos de inteligencia artificial, machine learning y fintech en América Latina en ${yrRange}. Incluye eventos organizados por empresas de tecnología financiera, startups de IA, aceleradoras de innovación y fondos de inversión. Modalidad presencial, híbrida o virtual. Lista nombre, país, fecha y URL.`,
		},
		{
			label: `latam-impacto-social-${yr}`,
			query: `${dc}. Busca hackathones de impacto social, gobierno abierto, educación y cambio climático en América Latina en ${yrRange}. Incluye convocatorias de ministerios de tecnología o innovación, organismos multilaterales de desarrollo, agencias de cooperación internacional y ONGs con presencia en la región. Lista nombre, país, fecha y URL.`,
		},
		{
			label: `latam-salud-agro-${yr}`,
			query: `${dc}. Busca hackathones de salud digital, biotecnología, tecnología agropecuaria y economía circular en América Latina en ${yrRange}. Organizados por ministerios de salud, institutos de investigación, empresas del sector agroindustrial o farmacéutico, o fondos de innovación. Lista nombre, país, ciudad, fecha y URL.`,
		},
		{
			label: `latam-web3-blockchain-${yr}`,
			query: `${dc}. Busca hackathones de blockchain, web3 y criptomonedas en América Latina en ${yrRange}. Organizados por fundaciones de protocolos descentralizados, fondos de capital de riesgo en cripto o comunidades blockchain de la región. Lista nombre, país, ciudad, fecha, modalidad y URL.`,
		},
		// --- Organizer type coverage ---
		{
			label: `latam-universitario-${yr}`,
			query: `${dc}. Busca hackathones organizados por universidades latinoamericanas en ${yrRange}, incluyendo eventos de facultades de ingeniería, ciencias de la computación y administración. También incluye competencias interuniversitarias de programación y desafíos tecnológicos estudiantiles organizados por capítulos de asociaciones académicas de ingeniería y computación. Lista nombre, universidad, país, fecha y URL.`,
		},
		{
			label: `latam-virtual-abierto-${yr}`,
			query: `${dc}. Busca hackathones virtuales en ${yrRange} con inscripción abierta a participantes de cualquier país de América Latina. Organizados por empresas tecnológicas, aceleradoras o plataformas de innovación en línea. Sin restricción geográfica dentro de LATAM. Lista nombre, organizador, fecha, URL de registro y temas del hackathon.`,
		},
		// --- Global hackathons open to LATAM participants ---
		{
			label: `global-social-impact-${yr}`,
			scopeHint: "global" as const,
			query: `${dc}. Search for upcoming online hackathons in ${yrRange} organized by international NGOs, development banks, or United Nations agencies focused on social impact, climate, or sustainable development goals. Open to international teams including Latin America. List name, organizer type, dates, modality, and registration URL.`,
		},
		{
			label: `global-ai-open-${yr}`,
			scopeHint: "global" as const,
			query: `${dc}. Search for upcoming global AI and machine learning hackathons in ${yrRange} with open registration for international participants. Organized by technology companies, research institutions, or open-source foundations. No country restriction. List name, organizer, dates, themes, and registration URL.`,
		},
		{
			label: `global-web3-fintech-open-${yr}`,
			scopeHint: "global" as const,
			query: `${dc}. Search for upcoming global online hackathons in ${yrRange} focused on blockchain, web3, fintech, or open finance. Open to participants from any country. Organized by protocol foundations, fintech companies, or international financial institutions. List name, organizer, dates, themes, and registration URL.`,
		},
		{
			label: `global-open-pt-${yr}`,
			scopeHint: "global" as const,
			query: `${dc}. Busca hackathons globais online em ${yrRange} com inscrições abertas para participantes do Brasil e da América Latina. Organizados por empresas de tecnologia internacionais, fundações de código aberto, bancos de desenvolvimento multilaterais ou organizações de pesquisa. Inclui hackathons de IA, dados, sustentabilidade ou inovação social. Lista nome, organizador, datas, temas e URL de inscrição.`,
		},
	];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryPerplexity(query: string): Promise<PerplexityResponse> {
	const apiKey = process.env.PERPLEXITY_API_KEY;
	if (!apiKey) throw new Error("PERPLEXITY_API_KEY is not set");

	const response = await fetch(PERPLEXITY_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: PERPLEXITY_MODEL,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: query },
			],
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Perplexity API error ${response.status}: ${body}`);
	}

	return response.json() as Promise<PerplexityResponse>;
}

function extractJsonArray(text: string): PerplexityHackathonItem[] {
	const stripped = text
		.replace(/```json\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();

	const start = stripped.indexOf("[");
	const end = stripped.lastIndexOf("]");

	if (start === -1 || end === -1 || end <= start) {
		console.warn("[perplexity] No JSON array in response, skipping");
		return [];
	}

	const parsed: unknown = JSON.parse(stripped.slice(start, end + 1));
	if (!Array.isArray(parsed)) return [];
	return parsed as PerplexityHackathonItem[];
}

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
	panama: "PA",
	panamá: "PA",
	guatemala: "GT",
	"el salvador": "SV",
	honduras: "HN",
	nicaragua: "NI",
	"dominican republic": "DO",
	"república dominicana": "DO",
	cuba: "CU",
	"latin america": "LATAM",
	latinoamérica: "LATAM",
	latam: "LATAM",
};

function normalizeCountry(raw: string | undefined): string | undefined {
	if (!raw) return undefined;
	const lower = raw.toLowerCase().trim();
	if (COUNTRY_ISO[lower]) return COUNTRY_ISO[lower];
	if (/^[A-Z]{2}$/.test(raw.trim())) return raw.trim();
	return raw;
}

/**
 * Hackathon keyword guard. Items that match neither name nor description are
 * rejected before conversion to RawHackathon to reduce non-hackathon noise
 * (conferences, meetups, bootcamps) slipping through the Perplexity prompt.
 */
const HACKATHON_KEYWORD_GUARD =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|hack[\s-]fest|hack[\s-]night|code[\s-]?jam|coding[\s-]challenge|programming[\s-]challenge|maratona[\s-]de[\s-]programac|maratón[\s-]de[\s-]programaci|desafio[\s-](de[\s-])?programac|desafío[\s-](de[\s-])?programac|reto[\s-](de[\s-])?c[oó]digo|reto[\s-](de[\s-])?innovaci|competencia[\s-]de[\s-]programac)\b/i;

/**
 * Domains that publish news/articles about hackathons — not the events themselves.
 * If websiteUrl points to one of these, the item is media coverage, not an event page.
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
]);

const NEWS_PATH_PATTERN =
	/\/(news|noticias|articles?|blog|prensa|sala-de-prensa|ciencia-tecnologia|innovacion\/articulo)\//i;

const DATE_PATH_PATTERN = /\/\d{4}\/\d{2}(\/\d{2})?[/-]/;

function isNewsSiteUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.replace(/^www\./, "");
		if (NEWS_MEDIA_DOMAINS.has(hostname)) return true;
		if (NEWS_PATH_PATTERN.test(parsed.pathname)) return true;
		if (DATE_PATH_PATTERN.test(parsed.pathname)) return true;
	} catch {
		return false;
	}
	return false;
}

function itemToRaw(
	item: PerplexityHackathonItem,
	scopeHint?: "latam" | "global",
): RawHackathon | null {
	if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
		return null;
	}

	// Hackathon keyword guard: reject items that look like conferences, meetups,
	// or bootcamps. Check name + description together. If neither matches, drop.
	const textToGuard = `${item.name} ${item.description ?? ""}`;
	if (!HACKATHON_KEYWORD_GUARD.test(textToGuard)) {
		console.debug(`[perplexity] keyword-guard drop: "${item.name}"`);
		return null;
	}

	const name = item.name.trim();
	const rawUrl =
		item.websiteUrl && typeof item.websiteUrl === "string"
			? item.websiteUrl.trim()
			: undefined;
	const websiteUrl = rawUrl
		? rawUrl.startsWith("http")
			? rawUrl
			: `https://${rawUrl}`
		: undefined;

	// Structural false positive guard: if no real URL was provided, drop the item.
	// Previously this fell back to a perplexity.ai/discovery/... URL which is not
	// the event page — it was a Perplexity search result URL, not a real event.
	if (!websiteUrl) {
		console.debug(`[perplexity] no-url drop: "${name}"`);
		return null;
	}

	// Reject if the URL points to a news/media site instead of the event page.
	if (isNewsSiteUrl(websiteUrl)) {
		console.debug(`[perplexity] news-url drop: "${name}" (${websiteUrl})`);
		return null;
	}

	const sourceUrl = websiteUrl;

	const country = normalizeCountry(
		item.country && typeof item.country === "string" ? item.country : undefined,
	);

	const validModalities = ["online", "in_person", "hybrid"];
	const rawModality = item.modality?.toLowerCase().replace(/[^a-z_]/g, "");
	const modality = validModalities.includes(rawModality ?? "")
		? rawModality
		: undefined;

	return {
		name,
		sourceUrl,
		sourceType: "perplexity_discovery",
		description:
			item.description && typeof item.description === "string"
				? item.description.slice(0, 5000)
				: undefined,
		startDate:
			item.startDate && typeof item.startDate === "string"
				? item.startDate
				: undefined,
		endDate:
			item.endDate && typeof item.endDate === "string"
				? item.endDate
				: undefined,
		country,
		city:
			item.city && typeof item.city === "string" ? item.city.trim() : undefined,
		modality,
		websiteUrl,
		prizePool:
			item.prizePool && typeof item.prizePool === "string"
				? item.prizePool
				: undefined,
		themes: Array.isArray(item.themes) ? (item.themes as string[]) : undefined,
		technologies: Array.isArray(item.technologies)
			? (item.technologies as string[])
			: undefined,
		registrationUrl:
			item.registrationUrl && typeof item.registrationUrl === "string"
				? item.registrationUrl
				: undefined,
		scopeHint,
	};
}

function wordOverlapRatio(a: string, b: string): number {
	const wordsA = new Set(
		a
			.toLowerCase()
			.replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);
	const wordsB = new Set(
		b
			.toLowerCase()
			.replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);
	if (wordsA.size === 0 || wordsB.size === 0) return 0;
	let intersection = 0;
	for (const w of wordsA) {
		if (wordsB.has(w)) intersection++;
	}
	return intersection / Math.max(wordsA.size, wordsB.size);
}

function deduplicateByName(hackathons: RawHackathon[]): RawHackathon[] {
	const unique: RawHackathon[] = [];

	for (const h of hackathons) {
		const nameLower = h.name.toLowerCase().trim();
		const isDuplicate = unique.some((existing) => {
			const existingLower = existing.name.toLowerCase().trim();
			if (existingLower === nameLower) return true;
			if (wordOverlapRatio(nameLower, existingLower) > 0.75) return true;
			if (
				h.websiteUrl &&
				existing.websiteUrl &&
				h.websiteUrl.toLowerCase().replace(/\/$/, "") ===
					existing.websiteUrl.toLowerCase().replace(/\/$/, "") &&
				h.country === existing.country
			) {
				return true;
			}
			return false;
		});
		if (!isDuplicate) unique.push(h);
	}
	return unique;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapePerplexity(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];

	const LATAM_QUERIES = getLatamQueries();
	console.log(
		`[perplexity] starting discovery scrape (${LATAM_QUERIES.length} queries)`,
	);

	for (let i = 0; i < LATAM_QUERIES.length; i++) {
		const { label, query, scopeHint } = LATAM_QUERIES[i];
		console.log(
			`[perplexity] querying: ${label}${scopeHint ? ` [${scopeHint}]` : ""}`,
		);
		try {
			const response = await queryPerplexity(query);
			const content = response.choices?.[0]?.message?.content ?? "";

			if (response.citations && response.citations.length > 0) {
				console.log(
					`[perplexity] ${label} citations: ${response.citations.slice(0, 5).join(", ")}`,
				);
			}

			if (!content.trim()) {
				console.warn(`[perplexity] empty response for query: ${label}`);
				continue;
			}

			const items = extractJsonArray(content);
			const hackathons = items
				.map((item) => itemToRaw(item, scopeHint))
				.filter((h): h is RawHackathon => h !== null);

			console.log(
				`[perplexity] ${label}: ${hackathons.length} hackathons found`,
			);
			allHackathons.push(...hackathons);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[perplexity] query "${label}" failed: ${msg}`);
		}

		if (i < LATAM_QUERIES.length - 1) {
			await delay(500);
		}
	}

	const deduplicated = deduplicateByName(allHackathons);
	console.log(
		`[perplexity] done: ${deduplicated.length} unique hackathons (from ${allHackathons.length} raw)`,
	);

	return deduplicated;
}
