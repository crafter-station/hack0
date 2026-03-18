/**
 * hackathon-com scraper — Perplexity Sonar fallback
 *
 * hackathon.com is a pure Vue SPA with no public API and no SSR.
 * This scraper uses Perplexity Sonar (web search + LLM) queries
 * to discover LATAM hackathons, returning results under the "hackathon_com" sourceType
 * so existing pipeline integration is preserved.
 *
 * Query strategy: these 12 queries are intentionally DISTINCT from perplexity.ts.
 * perplexity.ts covers: broad geographic bundles, AI/fintech, social impact,
 * health/agro, web3, university, virtual-open, and 3 global queries.
 * This scraper covers: niche geographies, specific organizer types, thematic
 * angles not in perplexity, and platform-sourced discovery.
 *
 * Env: PERPLEXITY_API_KEY
 */

import type { RawHackathon } from "@/lib/scraper/types";

interface PerplexityMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

interface PerplexityHackathonItem {
	name?: string;
	startDate?: string;
	endDate?: string;
	city?: string;
	country?: string;
	websiteUrl?: string;
	description?: string;
	modality?: string;
	registrationUrl?: string;
	prizePool?: string;
	themes?: string[];
	technologies?: string[];
}

interface PerplexityChoice {
	message: {
		role: string;
		content: string;
	};
	finish_reason: string;
}

interface PerplexityResponse {
	choices: PerplexityChoice[];
	citations?: string[];
}

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar-pro";

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

function getSystemPrompt(): string {
	const yr = new Date().getFullYear();
	return `Eres un asistente especializado en hackathones de América Latina.
Cuando el usuario te pida información, busca en internet y responde ÚNICAMENTE con un array JSON válido.
No incluyas texto fuera del JSON. No uses bloques de código markdown.
Cada elemento debe tener: name, startDate (ISO 8601), city, country (código ISO 2 letras), websiteUrl, description (1-2 oraciones), modality ("online"/"in_person"/"hybrid"), prizePool (opcional).
Solo incluye hackathones, datathones, buildathones o maratones de programación — NO conferencias, meetups, bootcamps, talleres ni cursos.
Solo incluye eventos futuros a partir de ${yr}. Si no encuentras eventos, responde [].`;
}

function getLatamQueries(): Array<{
	label: string;
	query: string;
	scopeHint?: "latam" | "global";
}> {
	const dc = getDateContext();
	const yr = new Date().getFullYear();
	return [
		// --- Niche geographic focus ---
		{
			// Peru-only deep-dive: perplexity bundles Peru+Ecuador+Bolivia together;
			// Peru is the primary market and deserves its own dedicated query.
			label: "peru-only",
			query:
				`${dc}. Busca hackathones y datathones próximos en Perú en ${yr}, organizados por CONCYTEC, ` +
				`Innóvate Perú, universidades peruanas (PUCP, UTEC, UNI, UPC, UNMSM, Tecsup), ` +
				`empresas tecnológicas peruanas, ONGs o dependencias gubernamentales. ` +
				`Cubre Lima, Arequipa, Trujillo, Cusco, Piura y modalidades virtuales. ` +
				`Incluye nombre, fecha (ISO), ciudad, país (PE), URL oficial, descripción breve, modalidad, premios.`,
		},
		{
			// Caribbean islands beyond Spanish-speaking Caribbean: perplexity's centroamerica-caribe
			// query focuses on Spanish-speaking countries. This query targets English/French/Creole
			// Caribbean: Jamaica, Trinidad & Tobago, Barbados, Haiti, Guyana, Suriname, Belize.
			label: "caribbean-islands",
			query:
				`${dc}. Search for upcoming hackathons and innovation challenges in ${yr} in English and French-speaking Caribbean islands: ` +
				`Jamaica, Trinidad and Tobago, Barbados, Belize, Guyana, Suriname, Haiti, and smaller Caribbean islands. ` +
				`Organized by telecommunications companies, universities, tech hubs, or development banks operating in the Caribbean basin. ` +
				`Include name, dates (ISO), city, country (ISO code), website URL, brief description, modality, prize pool.`,
			scopeHint: "latam" as const,
		},
		// --- Organizer-type differentiation ---
		{
			// Government ministry and public-sector hackathons: perplexity's impacto-social is broad
			// and theme-based. This query specifically targets ministry-run, government-organized
			// hackathons across all themes (not just social impact).
			label: "latam-govtech-ministry",
			query:
				`${dc}. Busca hackathones organizados por ministerios, secretarías de Estado, alcaldías o instituciones públicas en América Latina en ${yr}. ` +
				`Incluye convocatorias de ministerios de economía digital, transformación digital, ciencia y tecnología, ` +
				`administración pública, educación o salud. También incluye hackatones de gobierno abierto, datos abiertos, ` +
				`servicios ciudadanos digitales o transparencia gubernamental. Cualquier país de LATAM. ` +
				`Incluye nombre, fecha (ISO), país (código ISO), URL oficial, descripción breve, modalidad, premios.`,
		},
		{
			// Corporate and telecom-sponsored hackathons: large companies (banks, telecoms, retail)
			// that run hackathons for external developers. Perplexity's queries don't isolate
			// corporate-sponsored events as a distinct organizer category.
			label: "latam-corporate-telecom",
			query:
				`${dc}. Busca hackathones y retos de innovación abierta organizados por empresas corporativas en América Latina en ${yr}. ` +
				`Incluye desafíos tecnológicos de bancos y fintechs (Bancolombia, Nubank, BBVA, Scotiabank, Rappi, Mercado Libre), ` +
				`operadoras de telecomunicaciones (Claro, Movistar, Tigo, Entel), empresas de retail tech o energía. ` +
				`Estos eventos suelen anunciarse en portales corporativos, LinkedIn o Eventbrite. ` +
				`Incluye nombre, empresa organizadora, fecha (ISO), país (código ISO), URL oficial, modalidad, premios.`,
		},
		// --- Thematic angles absent from perplexity ---
		{
			// Game development and creative tech: entirely absent from perplexity's query set.
			// Game jams, creative coding challenges, and XR hackathons are a distinct circuit.
			label: "latam-gamedev-creative",
			query:
				`${dc}. Busca game jams, hackathones de desarrollo de videojuegos, realidad virtual, realidad aumentada o tecnologías creativas en América Latina en ${yr}. ` +
				`Organizados por estudios de videojuegos, universidades con programas de diseño digital, ` +
				`comunidades de desarrolladores de juegos o festivales de cultura digital. ` +
				`Incluye también hackathones de arte generativo, música con IA o creación audiovisual con código. ` +
				`Incluye nombre, fecha (ISO), país (código ISO), URL oficial, descripción, modalidad, premios.`,
		},
		{
			// Space tech and robotics: niche but active segment in LATAM (Peru Space Agency,
			// Brazil INPE, Argentina CONAE, ESA cooperation programs). Entirely absent from perplexity.
			label: "latam-space-robotics",
			query:
				`${dc}. Busca hackathones de tecnología espacial, robótica, drones, satélites o exploración aeroespacial en América Latina en ${yr}. ` +
				`Incluye competencias de robótica estudiantil (FIRST, RoboCup, WRO), ` +
				`hackatones organizados por agencias espaciales nacionales (CONAE, AEB, CONIDA) o en colaboración con NASA, ESA o SpaceApps Challenge. ` +
				`Incluye nombre, fecha (ISO), país (código ISO), URL oficial, descripción breve, modalidad, premios.`,
		},
		{
			// EdTech and future-of-work: growing segment in LATAM post-pandemic. Not covered
			// by perplexity's query set at all.
			label: "latam-edtech-futureofwork",
			query:
				`${dc}. Busca hackathones de educación digital, tecnología educativa (EdTech), futuro del trabajo, ` +
				`habilidades digitales o inclusión digital en América Latina en ${yr}. ` +
				`Organizados por ministerios de educación, fundaciones educativas, empresas EdTech, ` +
				`ONG de inclusión digital u organismos como UNESCO, OEI o BID con sede en LATAM. ` +
				`Incluye nombre, fecha (ISO), país (código ISO), URL oficial, descripción, modalidad, premios.`,
		},
		// --- Platform-sourced discovery ---
		{
			// Sympla (Brazil's largest event platform) and lu.ma (growing LATAM startup circuit):
			// these platforms host hackathons that often don't cross-list to Devpost or Eventbrite.
			label: "brazil-sympla-luma",
			query:
				`${dc}. Busca hackathones e maratonas de programação no Brasil em ${yr} publicados nas plataformas Sympla, lu.ma ou Bevy. ` +
				`Foca em eventos organizados por hubs de inovação, aceleradoras de startups, ` +
				`empresas de tecnologia brasileiras ou comunidades de desenvolvedores. ` +
				`Cidades como São Paulo, Curitiba, Florianópolis, Belo Horizonte, Recife e Porto Alegre. ` +
				`Inclua nome, data (ISO), cidade, país (BR), URL oficial, descrição breve, modalidade, prêmios.`,
		},
		{
			// lu.ma LATAM-wide: lu.ma is the fastest-growing platform for startup events and
			// tech hackathons in LATAM (Mexico City, Bogotá, Buenos Aires, Lima tech scenes).
			// No other scraper queries lu.ma explicitly for LATAM outside Brazil.
			label: "latam-luma-platform",
			query:
				`${dc}. Busca hackathones y retos de innovación en América Latina en ${yr} publicados en la plataforma lu.ma. ` +
				`Cubre México, Colombia, Argentina, Chile y Perú. ` +
				`Incluye eventos organizados por comunidades de startups, hubs tecnológicos, ` +
				`fondos de inversión de etapa temprana o aceleradoras regionales como Y Combinator LATAM, Platzi, Rappi, Lemontech. ` +
				`Incluye nombre, fecha (ISO), país (código ISO), URL oficial en lu.ma, descripción, modalidad, premios.`,
		},
		// --- Peru + Bolivia deep-dive (distinct from perplexity's Andean bundle) ---
		{
			// Perplexity's pais-andinos covers Peru+Ecuador+Bolivia. This scraper gives Peru and
			// Bolivia separate dedicated attention with specific innovation ecosystem actors.
			label: "peru-bolivia-innovation",
			query:
				`${dc}. Busca hackathones en Perú y Bolivia en ${yr} organizados por ecosistemas de innovación locales: ` +
				`En Perú: CONCYTEC, StartUp Perú, APESOFT, cámaras de comercio, Google Developer Groups Lima, ` +
				`Laboratoria, aceleradoras locales o municipalidades. ` +
				`En Bolivia: ADSIB, Ministerio de Planificación del Desarrollo, Agencia Boliviana Espacial, universidades públicas. ` +
				`Incluye nombre, fecha (ISO), ciudad, país (PE o BO), URL oficial, descripción, modalidad, premios.`,
		},
		// --- Global queries distinct from perplexity's globals ---
		{
			// Hardware and IoT global hackathons: perplexity's globals cover AI, social impact,
			// and web3/fintech. Hardware/IoT/embedded is absent from perplexity entirely.
			label: "global-hardware-iot",
			query:
				`${dc}. Search for upcoming global online hackathons in ${yr} focused on hardware, IoT (Internet of Things), ` +
				`embedded systems, wearables, or smart cities. Open to international teams with remote participation. ` +
				`Organized by hardware companies, microcontroller communities (Arduino, Raspberry Pi Foundation, STMicroelectronics), ` +
				`or standards organizations. Include name, dates (ISO), website URL, modality, prize pool.`,
			scopeHint: "global" as const,
		},
		{
			// Global open-source and developer ecosystem hackathons: Google Summer of Code-adjacent
			// events, OSS foundation hackathons, and developer platform challenges open globally.
			// Absent from perplexity's global queries.
			label: "global-opensource-dev",
			query:
				`${dc}. Search for upcoming global online hackathons in ${yr} organized by open-source foundations, ` +
				`developer platform companies, or cloud providers, open to international participants. ` +
				`Examples: events by Linux Foundation, Apache Foundation, CNCF, GitHub, GitLab, AWS, GCP, Azure, ` +
				`or database companies. No country restrictions. Include name, organizer, dates (ISO), website URL, modality, prize pool.`,
			scopeHint: "global" as const,
		},
	];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hackathon keyword guard. Items that match neither name nor description are
 * rejected to reduce non-hackathon noise (conferences, meetups, bootcamps)
 * slipping through the Perplexity prompt.
 */
const HACKATHON_KEYWORD_GUARD =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|hack[\s-]fest|hack[\s-]night|code[\s-]?jam|coding[\s-]challenge|programming[\s-]challenge|maratona[\s-]de[\s-]programac|maratón[\s-]de[\s-]programaci|desafio[\s-](de[\s-])?programac|desafío[\s-](de[\s-])?programac|reto[\s-](de[\s-])?c[oó]digo|reto[\s-](de[\s-])?innovaci|competencia[\s-]de[\s-]programac|game[\s-]jam)\b/i;

async function queryPerplexity(
	messages: PerplexityMessage[],
): Promise<PerplexityResponse> {
	const apiKey = process.env.PERPLEXITY_API_KEY;
	if (!apiKey) {
		throw new Error("PERPLEXITY_API_KEY is not set in environment");
	}

	const response = await fetch(PERPLEXITY_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: PERPLEXITY_MODEL,
			messages,
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Perplexity API error ${response.status}: ${body}`);
	}

	return response.json() as Promise<PerplexityResponse>;
}

/**
 * Extracts a JSON array from a string that may contain prose, code blocks, or citations.
 * Uses bracket-balanced scanning so trailing prose/citations never corrupt the slice.
 */
function extractJsonArray(text: string): PerplexityHackathonItem[] {
	const stripped = text
		.replace(/```json\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();

	const start = stripped.indexOf("[");
	if (start === -1) {
		throw new Error("No JSON array found in response");
	}

	let depth = 0;
	let inString = false;
	let isEscaped = false;
	let end = -1;

	for (let i = start; i < stripped.length; i++) {
		const c = stripped[i];
		if (isEscaped) {
			isEscaped = false;
			continue;
		}
		if (c === "\\" && inString) {
			isEscaped = true;
			continue;
		}
		if (c === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (c === "[" || c === "{") depth++;
		else if (c === "]" || c === "}") {
			depth--;
			if (depth === 0) {
				end = i + 1;
				break;
			}
		}
	}

	if (end === -1) {
		throw new Error("Unbalanced JSON array in response");
	}

	const jsonStr = stripped.slice(start, end);
	const parsed: unknown = JSON.parse(jsonStr);

	if (!Array.isArray(parsed)) {
		throw new Error("Parsed JSON is not an array");
	}

	return parsed as PerplexityHackathonItem[];
}

function normalizeCountry(raw: string | undefined): string | undefined {
	if (!raw) return undefined;
	const map: Record<string, string> = {
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
		jamaica: "JM",
		haiti: "HT",
		haití: "HT",
		belize: "BZ",
		guyana: "GY",
		suriname: "SR",
		"trinidad and tobago": "TT",
		trinidad: "TT",
		barbados: "BB",
		"puerto rico": "PR",
		"latin america": "LATAM",
		latinoamérica: "LATAM",
		latinoamerica: "LATAM",
		latam: "LATAM",
	};

	const normalized = map[raw.toLowerCase().trim()];
	if (normalized) return normalized;
	if (/^[A-Z]{2}$/.test(raw.trim())) return raw.trim();
	return raw;
}

function itemToRawHackathon(
	item: PerplexityHackathonItem,
	scopeHint?: "latam" | "global",
): RawHackathon | null {
	if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
		return null;
	}

	// Hackathon keyword guard: reject items that look like conferences, meetups,
	// or bootcamps by checking that name + description contain a hackathon keyword.
	const textToGuard = `${item.name} ${item.description ?? ""}`;
	if (!HACKATHON_KEYWORD_GUARD.test(textToGuard)) {
		console.debug(`[hackathon-com] keyword-guard drop: "${item.name}"`);
		return null;
	}

	const name = item.name.trim();

	const rawUrl =
		item.websiteUrl && typeof item.websiteUrl === "string"
			? item.websiteUrl.trim()
			: undefined;

	// Prepend https:// for protocol-relative or scheme-less URLs
	const websiteUrl = rawUrl
		? rawUrl.startsWith("http")
			? rawUrl
			: `https://${rawUrl}`
		: undefined;

	const sourceUrl =
		websiteUrl ??
		`https://www.hackathon.com/perplexity-discovery/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`;

	const country = normalizeCountry(
		item.country && typeof item.country === "string" ? item.country : undefined,
	);

	const modality =
		item.modality && typeof item.modality === "string"
			? item.modality.toLowerCase().replace(/[^a-z_]/g, "")
			: undefined;

	const validModalities = ["online", "in_person", "hybrid"];
	const normalizedModality = validModalities.includes(modality ?? "")
		? modality
		: undefined;

	return {
		name,
		sourceUrl,
		sourceType: "hackathon_com",
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
		modality: normalizedModality,
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

/**
 * Word-overlap ratio deduplication — matches the approach used in perplexity.ts.
 * Catches near-duplicate names like "Hackathon Perú 2026" vs "Hackathon Peru 2026"
 * that exact-string matching misses.
 */
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
			// Exact name match
			if (existingLower === nameLower) return true;
			// Near-duplicate via word overlap (threshold 0.75 matches perplexity.ts)
			if (wordOverlapRatio(nameLower, existingLower) > 0.75) return true;
			// Same URL + same country → same event regardless of name variation
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

export async function scrapeHackathonCom(): Promise<RawHackathon[]> {
	const allHackathons: RawHackathon[] = [];

	console.log(
		"[hackathon-com] hackathon.com is a pure Vue SPA — using Perplexity Sonar fallback",
	);

	for (const { label, query, scopeHint } of getLatamQueries()) {
		console.log(
			`[hackathon-com] querying Perplexity for: ${label}${scopeHint ? ` [${scopeHint}]` : ""}`,
		);

		try {
			const response = await queryPerplexity([
				{ role: "system", content: getSystemPrompt() },
				{ role: "user", content: query },
			]);

			const content = response.choices?.[0]?.message?.content ?? "";

			if (!content.trim()) {
				console.warn(`[hackathon-com] empty response for: ${label}`);
				continue;
			}

			const items = extractJsonArray(content);
			const hackathons = items
				.map((item) => itemToRawHackathon(item, scopeHint))
				.filter((h): h is RawHackathon => h !== null);

			console.log(
				`[hackathon-com] ${label}: ${items.length} raw items → ${hackathons.length} valid hackathons`,
			);
			allHackathons.push(...hackathons);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error(
				`[hackathon-com] Perplexity (${label}) failed: ${errorMsg}`,
			);
		}
	}

	const deduplicated = deduplicateByName(allHackathons);
	console.log(
		`[hackathon-com] done: ${deduplicated.length} hackathons (from ${allHackathons.length} raw)`,
	);

	return deduplicated;
}
