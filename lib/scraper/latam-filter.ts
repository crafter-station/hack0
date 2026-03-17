import type { RawHackathon } from "@/lib/scraper/types";

export const LATAM_COUNTRIES_ISO = [
	"AR",
	"BO",
	"BR",
	"CL",
	"CO",
	"CR",
	"CU",
	"DO",
	"EC",
	"SV",
	"GT",
	"HN",
	"MX",
	"NI",
	"PA",
	"PY",
	"PE",
	"UY",
	"VE",
	"GY",
	"SR",
	"BZ",
	"HT",
	"JM",
	"TT",
	"BB",
	"PR",
] as const;

export const LATAM_COUNTRY_NAMES: Record<string, string> = {
	argentina: "AR",
	bolivia: "BO",
	brazil: "BR",
	brasil: "BR",
	chile: "CL",
	colombia: "CO",
	"costa rica": "CR",
	cuba: "CU",
	"dominican republic": "DO",
	dominicana: "DO",
	"república dominicana": "DO",
	ecuador: "EC",
	"el salvador": "SV",
	guatemala: "GT",
	honduras: "HN",
	mexico: "MX",
	méxico: "MX",
	nicaragua: "NI",
	panama: "PA",
	panamá: "PA",
	paraguay: "PY",
	peru: "PE",
	perú: "PE",
	uruguay: "UY",
	venezuela: "VE",
	guyana: "GY",
	suriname: "SR",
	belize: "BZ",
	haiti: "HT",
	jamaica: "JM",
	"trinidad and tobago": "TT",
	trinidad: "TT",
	tobago: "TT",
	barbados: "BB",
	"puerto rico": "PR",
};

export const LATAM_CITIES: Record<string, string> = {
	// Peru
	lima: "PE",
	cusco: "PE",
	arequipa: "PE",
	trujillo: "PE",
	piura: "PE",
	huancayo: "PE",
	chiclayo: "PE",
	iquitos: "PE",

	// Colombia
	bogotá: "CO",
	bogota: "CO",
	medellín: "CO",
	medellin: "CO",
	cali: "CO",
	barranquilla: "CO",
	cartagena: "CO",
	bucaramanga: "CO",
	pereira: "CO",
	manizales: "CO",
	"santa marta": "CO",

	// Mexico
	"ciudad de mexico": "MX",
	"ciudad de méxico": "MX",
	cdmx: "MX",
	guadalajara: "MX",
	monterrey: "MX",
	puebla: "MX",
	tijuana: "MX",
	león: "MX",
	querétaro: "MX",
	queretaro: "MX",
	mérida: "MX",
	merida: "MX",

	// Argentina
	"buenos aires": "AR",
	córdoba: "AR",
	cordoba: "AR",
	rosario: "AR",
	mendoza: "AR",
	"la plata": "AR",
	tucumán: "AR",

	// Brazil
	"são paulo": "BR",
	"sao paulo": "BR",
	"rio de janeiro": "BR",
	curitiba: "BR",
	"belo horizonte": "BR",
	brasília: "BR",
	brasilia: "BR",
	fortaleza: "BR",
	salvador: "BR",
	recife: "BR",
	"porto alegre": "BR",
	campinas: "BR",
	florianópolis: "BR",
	florianopolis: "BR",

	// Chile
	santiago: "CL",
	valparaíso: "CL",
	valparaiso: "CL",
	concepción: "CL",
	concepcion: "CL",

	// Others
	montevideo: "UY",
	asunción: "PY",
	asuncion: "PY",
	"la paz": "BO",
	sucre: "BO",
	"santa cruz": "BO",
	quito: "EC",
	guayaquil: "EC",
	caracas: "VE",
	maracaibo: "VE",
	"san josé": "CR",
	"san jose": "CR",
	"panama city": "PA",
	"ciudad de panamá": "PA",
	"santo domingo": "DO",
	"san salvador": "SV",
	"guatemala city": "GT",
	"ciudad de guatemala": "GT",
	tegucigalpa: "HN",
	managua: "NI",
	havana: "CU",
	"la habana": "CU",
};

export const LATAM_KEYWORDS_ES = [
	"hackathon latinoamérica",
	"hackathon latam",
	"hackathón",
	"innovación",
	"tecnología",
	"programación",
	"desarrollo",
	"emprendimiento",
	"startups latam",
	"maratón de programación",
	"convocatoria hackathon",
	"reto de innovación",
];

export const LATAM_KEYWORDS_PT = [
	"hackathon brasil",
	"inovação",
	"tecnologia",
	"programação",
	"desenvolvimento",
	"maratona de programação",
	"desafio de programação",
];

export const LATAM_TLDS = [
	".mx",
	".br",
	".ar",
	".cl",
	".co",
	".pe",
	".uy",
	".ec",
	".ve",
	".cr",
	".pa",
	".do",
	".gt",
	".hn",
	".sv",
	".ni",
	".bo",
	".py",
	".cu",
	".pr",
];

export const ISO_TO_COUNTRY_NAME: Record<string, string> = {
	AR: "Argentina",
	BO: "Bolivia",
	BR: "Brazil",
	CL: "Chile",
	CO: "Colombia",
	CR: "Costa Rica",
	CU: "Cuba",
	DO: "Dominican Republic",
	EC: "Ecuador",
	SV: "El Salvador",
	GT: "Guatemala",
	HN: "Honduras",
	MX: "Mexico",
	NI: "Nicaragua",
	PA: "Panama",
	PY: "Paraguay",
	PE: "Peru",
	UY: "Uruguay",
	VE: "Venezuela",
	GY: "Guyana",
	SR: "Suriname",
	BZ: "Belize",
	HT: "Haiti",
	JM: "Jamaica",
	TT: "Trinidad and Tobago",
	BB: "Barbados",
	PR: "Puerto Rico",
};

// US state abbreviations that collide with LATAM ISO codes:
// PA = Pennsylvania ≠ Panama, CO = Colorado ≠ Colombia
// We detect these by looking for US state context (city + 2-letter state pattern)
const US_STATE_ABBREVS = new Set([
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"DC",
]);

/**
 * Returns true if the country field looks like a US state abbreviation used
 * in US location strings (e.g. "Pittsburgh, PA" → country="PA").
 * US locations often have city names that don't match any LATAM city.
 */
function isUsStateAbbreviation(
	hackathon: RawHackathon,
	countryUpper: string,
): boolean {
	if (!US_STATE_ABBREVS.has(countryUpper)) return false;

	// Verify: if neither city, description, nor venue contains LATAM indicators,
	// it's likely a US state abbreviation rather than a LATAM country.
	const textBlob = [
		hackathon.city,
		hackathon.fullAddress,
		hackathon.venue,
		hackathon.name,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	// Check if any LATAM city or country name appears in the text
	const hasLatamCity = Object.keys(LATAM_CITIES).some((city) =>
		textBlob.includes(city),
	);
	const hasLatamCountry = Object.keys(LATAM_COUNTRY_NAMES).some((name) =>
		textBlob.includes(name),
	);

	return !hasLatamCity && !hasLatamCountry;
}

export interface LatamScore {
	score: number;
	isLatam: boolean;
	detectedCountry: string | null;
	signals: string[];
}

export function scoreLATAM(hackathon: RawHackathon): LatamScore {
	let score = 0;
	const signals: string[] = [];
	let detectedCountry: string | null = null;

	// Signal 1: Explicit country ISO match (strongest signal)
	if (hackathon.country) {
		const countryUpper = hackathon.country.toUpperCase();
		if (
			(LATAM_COUNTRIES_ISO as readonly string[]).includes(countryUpper) &&
			!isUsStateAbbreviation(hackathon, countryUpper)
		) {
			score += 80;
			detectedCountry = countryUpper;
			signals.push(`country_iso:${countryUpper}`);
		}
	}

	// Build text blob from all text fields
	const textBlob = [
		hackathon.name,
		hackathon.description,
		hackathon.city,
		hackathon.fullAddress,
		hackathon.venue,
		hackathon.eligibility,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	// Signal 2: Country name in text fields
	// Use word-boundary matching for short country names to avoid false positives:
	// "cuba" in "incubation", "peru" in "perungudi"/"perundurai", "chile" in "child"
	for (const [countryName, iso] of Object.entries(LATAM_COUNTRY_NAMES)) {
		let matches: boolean;
		if (countryName.length <= 5) {
			const escapedName = countryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const nameRegex = new RegExp(
				`(?<![a-záéíóúüñ])${escapedName}(?![a-záéíóúüñ])`,
				"i",
			);
			matches = nameRegex.test(textBlob);
		} else {
			matches = textBlob.includes(countryName);
		}
		if (matches) {
			score += 60;
			if (!detectedCountry) detectedCountry = iso;
			signals.push(`country_name:${countryName}`);
			break;
		}
	}

	// Signal 3: City match
	// Use word-boundary matching to avoid short city names matching inside longer words
	// e.g., "cali" (Colombia) should not match "California", "lima" should not match "preliminary"
	for (const [city, iso] of Object.entries(LATAM_CITIES)) {
		// For short city names (≤5 chars), require word boundaries to reduce false positives
		let matches: boolean;
		if (city.length <= 5) {
			const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const cityRegex = new RegExp(
				`(?<![a-záéíóúüñ])${escapedCity}(?![a-záéíóúüñ])`,
				"i",
			);
			matches = cityRegex.test(textBlob);
		} else {
			matches = textBlob.includes(city);
		}
		if (matches) {
			score += 50;
			if (!detectedCountry) detectedCountry = iso;
			signals.push(`city:${city}`);
			break;
		}
	}

	// Signal 4: URL contains LATAM TLD
	// Use regex with word-boundary / end-of-domain check to avoid matching ".co" inside ".com"
	const urlBlob = [hackathon.sourceUrl, hackathon.websiteUrl]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	for (const tld of LATAM_TLDS) {
		// Escape dots and require the TLD to be followed by "/" or "?" or end-of-string or space,
		// not by another letter (to prevent ".co" matching inside ".com")
		const escapedTld = tld.replace(".", "\\.");
		const tldRegex = new RegExp(`${escapedTld}(?=[/?#\\s]|$)`);
		if (tldRegex.test(urlBlob)) {
			score += 40;
			signals.push(`tld:${tld}`);
			break;
		}
	}

	// Signal 5: Language indicators
	if (hackathon.languages?.some((l) => ["es", "pt", "pt-BR"].includes(l))) {
		score += 20;
		signals.push("language:es/pt");
	}

	// Signal 6: Spanish/Portuguese keywords
	for (const kw of [...LATAM_KEYWORDS_ES, ...LATAM_KEYWORDS_PT]) {
		if (textBlob.includes(kw)) {
			score += 15;
			signals.push(`keyword:${kw}`);
			break;
		}
	}

	// Signal 7: "latam" or "latin america" explicitly mentioned
	if (
		textBlob.includes("latam") ||
		textBlob.includes("latin america") ||
		textBlob.includes("latinoamérica") ||
		textBlob.includes("latinoamerica") ||
		textBlob.includes("américa latina")
	) {
		score += 30;
		signals.push("explicit_latam_mention");
	}

	// Signal 8: Global online hackathon with "latam eligible" marker
	// This is set by the Devpost detail page parser when the hackathon is open to all countries
	// and LATAM is not explicitly excluded from eligibility.
	// Marker text deliberately avoids the word "latam" to not double-trigger explicit_latam_mention.
	// Score is intentionally low (15) so this signal alone cannot push a US event past the threshold.
	if (textBlob.includes("global_open_eligible_la")) {
		score += 25;
		signals.push("global_online_latam_eligible");
	}

	// Guard: US-country events with no strong geographic LATAM signal
	if (hackathon.country?.toUpperCase() === "US" && score < 60) {
		return {
			score: 0,
			isLatam: false,
			detectedCountry: null,
			signals: ["blocked:country_us"],
		};
	}

	const finalScore = Math.min(score, 100);

	return {
		score: finalScore,
		isLatam: finalScore >= 60,
		detectedCountry,
		signals,
	};
}

export function filterLatam(hackathons: RawHackathon[]): Array<{
	hackathon: RawHackathon;
	latamScore: LatamScore;
}> {
	return hackathons
		.map((h) => ({ hackathon: h, latamScore: scoreLATAM(h) }))
		.filter((item) => item.latamScore.isLatam);
}
