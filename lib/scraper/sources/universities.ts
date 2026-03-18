/**
 * University Scraper
 *
 * Discovers hackathon and tech competitions from LATAM university event pages
 * and student chapter sites (IEEE, ACM, GDSC).
 *
 * Strategy:
 *   1. For each entry in UNIVERSITY_REGISTRY, use Firecrawl mapSite() to find
 *      URLs that match event/hackathon path patterns.
 *   2. Scrape each matched URL with cheerio for structured event cards.
 *   3. Apply keyword filtering to reject unrelated university events.
 *   4. Deduplicate by name similarity and URL.
 *
 * Coverage:
 *   - 45+ universities across 17 LATAM countries + Caribbean (PR, DO)
 *   - Student chapter aggregator pages (IEEE, ACM, GDSC)
 *   - Community aggregators (lu.ma LATAM, Sympla Brasil)
 *   - Inter-university competition pages
 *
 * Requires: cheerio (bun add cheerio)
 * Uses: @mendable/firecrawl-js (already installed)
 * Env: FIRECRAWL_API_KEY
 */

import Firecrawl from "@mendable/firecrawl-js";
import * as cheerio from "cheerio";
import type { RawHackathon } from "@/lib/scraper/types";

// ---------------------------------------------------------------------------
// Firecrawl client
// ---------------------------------------------------------------------------

let _fc: Firecrawl | null = null;
function getFirecrawl(): Firecrawl {
	if (!_fc) {
		_fc = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
	}
	return _fc;
}

async function scrapePage(
	url: string,
	options: {
		formats?: ("html" | "markdown" | "rawHtml")[];
		waitFor?: number;
	} = {},
): Promise<{ html?: string }> {
	const fc = getFirecrawl();
	const result = await fc.scrape(url, {
		formats: options.formats ?? ["html"],
		onlyMainContent: true,
		waitFor: options.waitFor ?? 3000,
	});
	return { html: result.html };
}

async function mapSite(
	url: string,
	options?: { search?: string; limit?: number },
): Promise<string[]> {
	const fc = getFirecrawl();
	const result = await fc.map(url, {
		search: options?.search,
		limit: options?.limit ?? 50,
	});
	return (result.links ?? []).map((item) => item.url);
}

// ---------------------------------------------------------------------------
// University / student-chapter registry
// ---------------------------------------------------------------------------

interface UniversityEntry {
	name: string;
	country: string;
	/** Known language(s) of event pages */
	lang: string[];
	urls: string[];
}

/**
 * Registry of LATAM universities and student chapters with high hackathon
 * yield.  URL hints point directly at events/activities pages where available
 * to reduce unnecessary map-crawl depth.
 */
const UNIVERSITY_REGISTRY: UniversityEntry[] = [
	// =========================================================================
	// PERU
	// =========================================================================
	{
		name: "PUCP - Pontificia Universidad Católica del Perú",
		country: "PE",
		lang: ["es"],
		urls: [
			"https://www.pucp.edu.pe/eventosdestacados/",
			"https://facultad.pucp.edu.pe/ingenieria/eventos/",
		],
	},
	{
		name: "UTEC - Universidad de Ingeniería y Tecnología",
		country: "PE",
		lang: ["es"],
		urls: ["https://utec.edu.pe/eventos"],
	},
	{
		name: "UNI - Universidad Nacional de Ingeniería",
		country: "PE",
		lang: ["es"],
		urls: ["https://www.uni.edu.pe/index.php/noticias-uni"],
	},
	{
		name: "UPC - Universidad Peruana de Ciencias Aplicadas",
		country: "PE",
		lang: ["es"],
		urls: ["https://www.upc.edu.pe/landing/eventos/"],
	},
	{
		name: "UNMSM - Universidad Nacional Mayor de San Marcos",
		country: "PE",
		lang: ["es"],
		urls: ["https://www.unmsm.edu.pe/home/inicio/noticias"],
	},
	{
		name: "Universidad del Pacífico",
		country: "PE",
		lang: ["es"],
		urls: ["https://www.up.edu.pe/noticias-eventos/"],
	},

	// =========================================================================
	// COLOMBIA
	// =========================================================================
	{
		name: "Universidad EAFIT",
		country: "CO",
		lang: ["es"],
		urls: ["https://www.eafit.edu.co/eventos"],
	},
	{
		name: "Universidad de los Andes",
		country: "CO",
		lang: ["es"],
		urls: [
			"https://uniandes.edu.co/eventos",
			"https://ingenieria.uniandes.edu.co/eventos",
		],
	},
	{
		name: "Universidad Nacional de Colombia",
		country: "CO",
		lang: ["es"],
		urls: ["https://bogota.unal.edu.co/noticias/"],
	},
	{
		name: "Universidad ICESI",
		country: "CO",
		lang: ["es"],
		urls: ["https://www.icesi.edu.co/micrositios/eventos/"],
	},
	{
		name: "Pontificia Universidad Javeriana",
		country: "CO",
		lang: ["es"],
		urls: ["https://www.javeriana.edu.co/inicio/noticias-y-eventos"],
	},

	// =========================================================================
	// MEXICO
	// =========================================================================
	{
		name: "ITESM - Tec de Monterrey",
		country: "MX",
		lang: ["es"],
		urls: ["https://tec.mx/es/eventos", "https://hackmty.com"],
	},
	{
		name: "UNAM - Facultad de Ingeniería",
		country: "MX",
		lang: ["es"],
		urls: ["https://www.ingenieria.unam.mx/eventos/"],
	},
	{
		name: "UNAM - Facultad de Ciencias",
		country: "MX",
		lang: ["es"],
		urls: ["https://www.fciencias.unam.mx/events"],
	},
	{
		name: "IPN - Instituto Politécnico Nacional",
		country: "MX",
		lang: ["es"],
		urls: ["https://www.ipn.mx/index.html"],
	},
	{
		name: "CINVESTAV",
		country: "MX",
		lang: ["es"],
		urls: ["https://www.cinvestav.mx/Eventos"],
	},

	// =========================================================================
	// BRAZIL
	// =========================================================================
	{
		name: "USP - Instituto de Matemática e Estatística",
		country: "BR",
		lang: ["pt"],
		urls: ["https://www.ime.usp.br/eventos"],
	},
	{
		name: "USP - Escola Politécnica",
		country: "BR",
		lang: ["pt"],
		urls: ["https://poli.usp.br/noticias/"],
	},
	{
		name: "UNICAMP - Instituto de Computação",
		country: "BR",
		lang: ["pt"],
		urls: ["https://ic.unicamp.br/noticias-e-eventos/"],
	},
	{
		name: "UFMG - Escola de Engenharia",
		country: "BR",
		lang: ["pt"],
		urls: ["https://www.eng.ufmg.br/portal/noticias/"],
	},
	{
		name: "PUC-Rio",
		country: "BR",
		lang: ["pt"],
		urls: ["https://www.puc-rio.br/ensinopesq/ccpg/divulgacao_evento.html"],
	},
	{
		name: "UnB - Universidade de Brasília",
		country: "BR",
		lang: ["pt"],
		urls: ["https://www.unb.br/noticias/"],
	},

	// =========================================================================
	// ARGENTINA
	// =========================================================================
	{
		name: "UBA - Facultad de Ingeniería",
		country: "AR",
		lang: ["es"],
		urls: ["https://www.fi.uba.ar/"],
	},
	{
		name: "ITBA - Instituto Tecnológico Buenos Aires",
		country: "AR",
		lang: ["es"],
		urls: ["https://www.itba.edu.ar/"],
	},
	{
		name: "UTN - Universidad Tecnológica Nacional",
		country: "AR",
		lang: ["es"],
		urls: ["https://www.utn.edu.ar/es/noticias"],
	},
	{
		name: "Universidad Austral",
		country: "AR",
		lang: ["es"],
		urls: ["https://www.austral.edu.ar/eventos/"],
	},

	// =========================================================================
	// CHILE
	// =========================================================================
	{
		name: "Universidad de Chile - DCC",
		country: "CL",
		lang: ["es"],
		urls: ["https://www.dcc.uchile.cl/eventos"],
	},
	{
		name: "PUC Chile - Ingeniería",
		country: "CL",
		lang: ["es"],
		urls: ["https://www.ing.uc.cl/noticias/", "https://www.ing.uc.cl/eventos/"],
	},
	{
		name: "Universidad Adolfo Ibáñez",
		country: "CL",
		lang: ["es"],
		urls: ["https://www.uai.cl/noticias/"],
	},
	{
		name: "USACH - Universidad de Santiago de Chile",
		country: "CL",
		lang: ["es"],
		urls: ["https://www.usach.cl/noticias"],
	},

	// =========================================================================
	// ECUADOR
	// =========================================================================
	{
		name: "ESPOL - Escuela Superior Politécnica del Litoral",
		country: "EC",
		lang: ["es"],
		urls: [
			"https://www.espol.edu.ec/es/noticias",
			"https://www.espol.edu.ec/es/eventos",
		],
	},
	{
		name: "EPN - Escuela Politécnica Nacional",
		country: "EC",
		lang: ["es"],
		urls: ["https://www.epn.edu.ec/noticias/"],
	},

	// =========================================================================
	// URUGUAY
	// =========================================================================
	{
		name: "FING - Facultad de Ingeniería UdelaR",
		country: "UY",
		lang: ["es"],
		urls: ["https://www.fing.edu.uy/"],
	},

	// =========================================================================
	// VENEZUELA
	// =========================================================================
	{
		name: "USB - Universidad Simón Bolívar",
		country: "VE",
		lang: ["es"],
		urls: ["https://www.usb.ve/noticias/"],
	},
	{
		name: "UCV - Universidad Central de Venezuela - Computación",
		country: "VE",
		lang: ["es"],
		urls: ["https://www.ucv.ve/noticias.html"],
	},

	// =========================================================================
	// BOLIVIA
	// =========================================================================
	{
		name: "UMSS - Universidad Mayor de San Simón",
		country: "BO",
		lang: ["es"],
		urls: ["https://www.umss.edu.bo/noticias/"],
	},

	// =========================================================================
	// PARAGUAY
	// =========================================================================
	{
		name: "UNA - Universidad Nacional de Asunción - Politécnica",
		country: "PY",
		lang: ["es"],
		urls: ["https://www.pol.una.py/noticias/"],
	},

	// =========================================================================
	// COSTA RICA
	// =========================================================================
	{
		name: "UCR - Universidad de Costa Rica - Ingeniería",
		country: "CR",
		lang: ["es"],
		urls: ["https://www.eie.ucr.ac.cr/noticias"],
	},
	{
		name: "TEC - Instituto Tecnológico de Costa Rica",
		country: "CR",
		lang: ["es"],
		urls: ["https://www.tec.ac.cr/noticias"],
	},

	// =========================================================================
	// PANAMA
	// =========================================================================
	{
		name: "USMA - Universidad Santa María La Antigua",
		country: "PA",
		lang: ["es"],
		urls: [
			"https://www.usma.ac.pa/noticias/",
			"https://www.usma.ac.pa/eventos/",
		],
	},
	{
		name: "UTP - Universidad Tecnológica de Panamá",
		country: "PA",
		lang: ["es"],
		urls: ["https://www.utp.ac.pa/noticias"],
	},

	// =========================================================================
	// GUATEMALA
	// =========================================================================
	{
		name: "URL - Universidad Rafael Landívar",
		country: "GT",
		lang: ["es"],
		urls: ["https://www.url.edu.gt/noticias/"],
	},
	{
		name: "USAC - Universidad de San Carlos de Guatemala - Ingeniería",
		country: "GT",
		lang: ["es"],
		urls: ["https://ingenieria.usac.edu.gt/noticias/"],
	},

	// =========================================================================
	// HONDURAS
	// =========================================================================
	{
		name: "UNITEC - Universidad Tecnológica Centroamericana",
		country: "HN",
		lang: ["es"],
		urls: ["https://www.unitec.edu/noticias/"],
	},
	{
		name: "UNAH - Universidad Nacional Autónoma de Honduras - CUEC",
		country: "HN",
		lang: ["es"],
		urls: ["https://cuec.unah.edu.hn/noticias/"],
	},

	// =========================================================================
	// NICARAGUA
	// =========================================================================
	{
		name: "UCA - Universidad Centroamericana Nicaragua",
		country: "NI",
		lang: ["es"],
		urls: ["https://www.uca.edu.ni/noticias/"],
	},
	{
		name: "UNI - Universidad Nacional de Ingeniería Nicaragua",
		country: "NI",
		lang: ["es"],
		urls: ["https://www.uni.edu.ni/noticias/"],
	},

	// =========================================================================
	// DOMINICAN REPUBLIC
	// =========================================================================
	{
		name: "INTEC - Instituto Tecnológico de Santo Domingo",
		country: "DO",
		lang: ["es"],
		urls: ["https://www.intec.edu.do/noticias/"],
	},
	{
		name: "PUCMM - Pontificia Universidad Católica Madre y Maestra",
		country: "DO",
		lang: ["es"],
		urls: ["https://www.pucmm.edu.do/noticias/"],
	},

	// =========================================================================
	// PUERTO RICO
	// =========================================================================
	{
		name: "UPRM - Universidad de Puerto Rico Recinto de Mayagüez - Ingeniería",
		country: "PR",
		lang: ["es", "en"],
		urls: [
			"https://www.uprm.edu/ciapr/noticias/",
			"https://www.uprm.edu/engineering/news/",
		],
	},

	// =========================================================================
	// STUDENT CHAPTERS — aggregator/hub pages
	// These often list events across multiple universities in a country/region.
	// =========================================================================
	{
		name: "IEEE Sección Perú",
		country: "PE",
		lang: ["es"],
		urls: ["https://ieeeperu.org/eventos/"],
	},
	{
		name: "IEEE Rama Estudiantil PUCP",
		country: "PE",
		lang: ["es"],
		urls: ["https://ieeepucp.org/events/"],
	},
	{
		name: "GDSC LATAM Hub",
		country: "LATAM",
		lang: ["es", "pt"],
		urls: ["https://gdsc.community.dev/events/#/list"],
	},
	{
		name: "IEEE Sección Colombia",
		country: "CO",
		lang: ["es"],
		urls: ["https://www.ieee-colombia.org/eventos/"],
	},
	{
		name: "IEEE Sección México",
		country: "MX",
		lang: ["es"],
		urls: ["https://www.ieeemexico.org/eventos/"],
	},
	{
		name: "IEEE Sección Brasil",
		country: "BR",
		lang: ["pt"],
		urls: ["https://ieeebrasil.org.br/eventos/"],
	},
	{
		name: "ACM ICPC South America",
		country: "LATAM",
		lang: ["es", "pt"],
		urls: ["https://icpc.global/regionals/finder/Latin-America"],
	},

	// =========================================================================
	// COMMUNITY AGGREGATORS — lu.ma and Sympla university tech club pages
	// These aggregate events from student communities across multiple countries.
	// =========================================================================
	{
		name: "lu.ma LATAM Tech Clubs",
		country: "LATAM",
		lang: ["es", "pt"],
		urls: ["https://lu.ma/latam-tech", "https://lu.ma/hackathon-latam"],
	},
	{
		name: "Sympla Brasil - Hackathons e Eventos Tech Universitários",
		country: "BR",
		lang: ["pt"],
		urls: [
			"https://www.sympla.com.br/eventos/hackathon?q=universidade",
			"https://www.sympla.com.br/eventos/hackathon",
		],
	},
];

// ---------------------------------------------------------------------------
// Keyword matching
// ---------------------------------------------------------------------------

/**
 * Primary hackathon/competition keywords in Spanish and Portuguese.
 * Matched as whole words or bounded substrings to reduce false positives.
 * Note: "hack" is NOT included bare because it matches "hardware", etc.
 */
const HACKATHON_KEYWORDS_REGEX = new RegExp(
	[
		// Hackathon variants
		"hackathon",
		"hackath[oó]n",
		"hackat[oó]n",
		"hack\\s*day",
		"buildathon",
		"datathon",
		"codeathon",
		"codefest",
		// Competition/challenge
		"coding\\s*challenge",
		"reto\\s+(de\\s+)?programaci[oó]n",
		"reto\\s+tecnol[oó]gico",
		"desaf[ií]o\\s+tecnol[oó]gico",
		"desaf[ií]o\\s+digital",
		"concurso\\s+de\\s+programaci[oó]n",
		"competencia\\s+de\\s+programaci[oó]n",
		"competici[oó]n\\s+de\\s+programaci[oó]n",
		"marath[oó]n\\s+de\\s+programaci[oó]n",
		"marat[oó]na\\s+de\\s+programa",
		// Spanish/Portuguese innovation terms commonly paired with tech
		"reto\\s+de\\s+innovaci[oó]n",
		"desaf[ií]o\\s+de\\s+innovaci[oó]n",
		"maraton\\s+de\\s+innovaci[oó]n",
		// Olympiad
		"olimpiada\\s+de\\s+inform[aá]tica",
		"olimpiada\\s+de\\s+programaci[oó]n",
		"ol[ií]mpicos?\\s+de\\s+inform[aá]tica",
		// ICPC / programming contests
		"icpc",
		"concurso\\s+acm",
		"competitive\\s+programming",
		// Startup/innovation competitions at universities
		"startup\\s+competition",
		"startup\\s+weekend",
		"innovation\\s+challenge",
		"pitch\\s+competition",
		"demo\\s+day",
	]
		.map((p) => `(?:${p})`)
		.join("|"),
	"i",
);

/**
 * Secondary keywords — broader terms that require stronger context
 * (used only if the element text is short enough that false positives are low).
 */
const SECONDARY_KEYWORDS_REGEX = new RegExp(
	[
		"hackear",
		"hackeaton",
		"buildspace",
		"innovation\\s+lab",
		"laboratorio\\s+de\\s+innovaci[oó]n",
		"reto\\s+estudiantil",
		"concurso\\s+estudiantil",
		"pitch",
	]
		.map((p) => `(?:${p})`)
		.join("|"),
	"i",
);

/**
 * Negative signal patterns: if any of these appear as the sole topic,
 * the element is likely a false positive (academic event unrelated to coding).
 * These are applied ONLY as tie-breakers when no primary keyword matches.
 */
const FALSE_POSITIVE_REGEX = new RegExp(
	[
		"defensa\\s+de\\s+tesis",
		"coloquio\\s+(?:de\\s+)?investigaci[oó]n",
		"asamblea\\s+(?:de\\s+)?docentes",
		"congreso\\s+de\\s+derecho",
		"ceremonia\\s+de\\s+graduaci[oó]n",
		"graduaci[oó]n",
		"reuni[oó]n\\s+de\\s+padres",
		"feria\\s+vocacional",
		"inscripciones\\s+abiertas",
		"convocatoria\\s+de\\s+becas?",
	]
		.map((p) => `(?:${p})`)
		.join("|"),
	"i",
);

function isRelevant(text: string): boolean {
	if (HACKATHON_KEYWORDS_REGEX.test(text)) return true;
	// Use secondary only for shorter texts (less risk of incidental match)
	if (text.length < 500 && SECONDARY_KEYWORDS_REGEX.test(text)) return true;
	return false;
}

function isFalsePositive(text: string): boolean {
	return FALSE_POSITIVE_REGEX.test(text);
}

// ---------------------------------------------------------------------------
// URL filtering for mapSite results
// ---------------------------------------------------------------------------

/**
 * URL path segments that strongly suggest an events/news/activities page.
 */
const EVENT_URL_SEGMENTS = [
	"event",
	"evento",
	"hackathon",
	"hack",
	"actividad",
	"actividades",
	"noticia",
	"noticias",
	"news",
	"programa",
	"convocatoria",
	"concurso",
	"competencia",
	"reto",
	"taller",
	"agenda",
	"calendario",
];

function isEventLikeUrl(url: string): boolean {
	try {
		const path = new URL(url).pathname.toLowerCase();
		return EVENT_URL_SEGMENTS.some((seg) => path.includes(seg));
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// HTML parser
// ---------------------------------------------------------------------------

function parseUniversityEventsPage(
	html: string,
	pageUrl: string,
	universityName: string,
	country: string,
	lang: string[],
): RawHackathon[] {
	const $ = cheerio.load(html);
	const results: RawHackathon[] = [];

	// Target common event-card patterns; be specific to avoid over-matching <li>
	const CARD_SELECTORS = [
		"article",
		".event",
		".evento",
		".card",
		".entry",
		".post",
		"[class*='event']",
		"[class*='evento']",
		"[class*='card']",
		"[class*='item']",
		"[class*='noticia']",
		"[class*='actividad']",
		// Table rows for competition listings
		"tr",
	].join(", ");

	$(CARD_SELECTORS).each((_, el) => {
		const $el = $(el);

		// Skip very small elements (likely navigation/footer items)
		const text = $el.text().trim();
		if (text.length < 10) return;

		// Must match at least one hackathon keyword
		if (!isRelevant(text)) return;

		// Skip if it looks like an unrelated academic event
		if (isFalsePositive(text)) return;

		// Extract name from heading or first link text
		const $heading = $el
			.find("h1, h2, h3, h4, h5, .title, [class*='title'], [class*='name']")
			.first();
		const nameFromHeading = $heading.text().trim();
		const nameFromLink = $el.find("a").first().text().trim();
		const name =
			(nameFromHeading.length > nameFromLink.length
				? nameFromHeading
				: nameFromLink) || text.slice(0, 80);

		if (!name || name.length < 6) return;

		// Avoid names that are just dates or navigation labels
		if (/^\d{1,2}[\\/-]\d{1,2}[\\/-]\d{2,4}$/.test(name)) return;
		if (name.split(" ").length < 2) return;

		// Extract URL
		const rawHref = $el.find("a").first().attr("href");
		let sourceUrl = pageUrl;
		if (rawHref) {
			try {
				sourceUrl = rawHref.startsWith("http")
					? rawHref
					: new URL(rawHref, pageUrl).href;
			} catch {
				sourceUrl = pageUrl;
			}
		}

		// Extract date text
		const dateText = $el
			.find(
				"time, [datetime], [class*='date'], [class*='fecha'], [class*='cuando'], .date, .fecha",
			)
			.first()
			.text()
			.trim();

		// Extract description
		const description = $el
			.find(
				"p, .description, [class*='excerpt'], [class*='resumen'], [class*='summary']",
			)
			.first()
			.text()
			.trim();

		// Extract image
		const imageUrl =
			$el.find("img").first().attr("src") ||
			$el.find("[class*='banner'], [class*='cover']").first().attr("src");

		const result: RawHackathon = {
			name,
			sourceUrl,
			sourceType: "university",
			country,
			organizers: [{ name: universityName }],
			languages: lang,
		};

		if (description && description.length > 10)
			result.description = description;
		if (dateText) result.startDate = dateText;
		if (imageUrl?.startsWith("http")) result.imageUrl = imageUrl;
		if (sourceUrl !== pageUrl) result.websiteUrl = sourceUrl;

		results.push(result);
	});

	return results;
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function normalizeForDedup(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function wordOverlapRatio(a: string, b: string): number {
	const words = (s: string) =>
		new Set(
			normalizeForDedup(s)
				.split(" ")
				.filter((w) => w.length > 3),
		);
	const wa = words(a);
	const wb = words(b);
	if (wa.size === 0 || wb.size === 0) return 0;
	let n = 0;
	for (const w of wa) if (wb.has(w)) n++;
	return n / Math.max(wa.size, wb.size);
}

function deduplicateResults(hackathons: RawHackathon[]): RawHackathon[] {
	const unique: RawHackathon[] = [];
	for (const h of hackathons) {
		const isDup = unique.some((e) => {
			// Exact name match
			if (normalizeForDedup(h.name) === normalizeForDedup(e.name)) return true;
			// High word overlap (same event, slightly different title)
			if (wordOverlapRatio(h.name, e.name) > 0.75) return true;
			// Same URL (different scrape of the same page)
			if (
				h.websiteUrl &&
				e.websiteUrl &&
				h.websiteUrl.toLowerCase().replace(/\/$/, "") ===
					e.websiteUrl.toLowerCase().replace(/\/$/, "")
			)
				return true;
			return false;
		});
		if (!isDup) unique.push(h);
	}
	return unique;
}

// ---------------------------------------------------------------------------
// Rate limiting helper
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function scrapeUniversities(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];

	console.log(
		`[universities] starting scrape for ${UNIVERSITY_REGISTRY.length} entries`,
	);

	for (const university of UNIVERSITY_REGISTRY) {
		for (const baseUrl of university.urls) {
			try {
				// Step 1: Discover event-related URLs via Firecrawl map
				let urlsToScrape: string[] = [baseUrl];
				try {
					const discovered = await mapSite(baseUrl, {
						search:
							"hackathon evento competition reto programación innovación datathon",
						limit: 20,
					});

					if (discovered.length > 0) {
						// Keep URLs that look event-related and belong to the same domain
						let baseDomain: string;
						try {
							baseDomain = new URL(baseUrl).hostname;
						} catch {
							baseDomain = "";
						}

						const eventUrls = discovered.filter((u) => {
							// Must be same root domain (avoid external redirects)
							try {
								const uDomain = new URL(u).hostname;
								const sameDomain =
									uDomain === baseDomain ||
									uDomain.endsWith(`.${baseDomain}`) ||
									baseDomain.endsWith(`.${uDomain}`);
								if (!sameDomain) return false;
							} catch {
								return false;
							}
							return isEventLikeUrl(u);
						});

						if (eventUrls.length > 0) {
							// Cap at 8 pages per base URL to control Firecrawl spend
							urlsToScrape = eventUrls.slice(0, 8);
						}
					}
				} catch {
					console.warn(
						`[universities] mapSite failed for ${baseUrl}, falling back to base URL`,
					);
				}

				// Step 2: Scrape each discovered URL
				for (const url of urlsToScrape) {
					try {
						const page = await scrapePage(url, {
							formats: ["html"],
							// Reduced from 3500 to lower Firecrawl credit burn (~25% saving)
							waitFor: 2500,
						});
						if (!page.html) continue;

						const hackathons = parseUniversityEventsPage(
							page.html,
							url,
							university.name,
							university.country,
							university.lang,
						);

						if (hackathons.length > 0) {
							allHackathons.push(...hackathons);
							console.log(
								`[universities] ${university.name}: +${hackathons.length} on ${url}`,
							);
						}

						// Brief pause between page scrapes to be polite
						await sleep(500);
					} catch (err) {
						const msg = err instanceof Error ? err.message : String(err);
						console.warn(`[universities] scrape error ${url}: ${msg}`);
					}
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(
					`[universities] failed for ${university.name} (${baseUrl}): ${msg}`,
				);
			}

			// Rate limit between universities
			await sleep(800);
		}
	}

	const deduplicated = deduplicateResults(allHackathons);
	console.log(
		`[universities] done: ${deduplicated.length} unique hackathons (${allHackathons.length} raw) from ${UNIVERSITY_REGISTRY.length} entries`,
	);

	return deduplicated;
}
