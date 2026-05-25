import type { NewEvent } from "@/lib/db/schema/events";
import {
	generateSlug,
	inferDomains,
	inferEventType,
	parsePrizeAmount,
} from "@/lib/scraper/firecrawl";
import {
	LATAM_CITIES,
	LATAM_COUNTRY_NAMES,
	scoreLATAM,
} from "@/lib/scraper/latam-filter";
import type { RawHackathon } from "@/lib/scraper/types";
import { sanitizeImageUrl } from "@/lib/utils";

export const SYSTEM_IMPORT_ORGANIZATION_ID =
	"00000000-0000-0000-0000-000000000001";

/** Strip trailing slash and known informational path suffixes for consistent URL storage & dedup. */
function normalizeUrl(url: string): string {
	return url
		.trim()
		.replace(/\/+$/, "") // strip trailing slashes
		.replace(/\/(detail|info|register|signup|apply|overview|about)$/i, ""); // strip common detail suffixes
}

/** Clean and normalize text: collapse whitespace, strip control chars. */
function cleanText(text: string): string {
	return text
		.replace(/[\r\n\t]+/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim();
}

const FULL_COUNTRY_TO_ISO: Record<string, string> = {
	colombia: "CO",
	méxico: "MX",
	mexico: "MX",
	brasil: "BR",
	brazil: "BR",
	argentina: "AR",
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
};

/** Derive event status from start/end dates. */
function deriveStatus(
	startDate: Date | null,
	endDate: Date | null,
): "upcoming" | "open" | "ongoing" | "ended" {
	const now = new Date();

	if (!startDate) return "upcoming";

	if (endDate && endDate < now) return "ended";
	if (startDate <= now && (!endDate || endDate >= now)) return "ongoing";
	return "upcoming";
}

/** Map RawHackathon modality to hack0 format enum. */
function mapModality(raw: RawHackathon): "virtual" | "in-person" | "hybrid" {
	if (raw.modality) {
		const m = raw.modality.toLowerCase();
		if (m.includes("hybrid") || m.includes("híbrido")) return "hybrid";
		if (m.includes("online") || m.includes("virtual") || m.includes("remote"))
			return "virtual";
		if (
			m.includes("in-person") ||
			m.includes("in_person") ||
			m.includes("presencial") ||
			m.includes("physical")
		) {
			return "in-person";
		}
	}

	// Fall back to parseLocation if websiteUrl or sourceUrl hints exist
	if (raw.city || raw.venue || raw.country) {
		return "in-person";
	}

	return "virtual";
}

/** Safely parse a date string, returning null if invalid. */
function safeParseDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return d;
}

export function normalizeHackathon(raw: RawHackathon): NewEvent {
	// Parse dates (ISO string → Date), null if malformed
	const startDate = safeParseDate(raw.startDate);
	const endDate = safeParseDate(raw.endDate);
	const registrationDeadline = safeParseDate(raw.registrationDeadline);

	// Normalize full country names → ISO 2-letter codes before any country logic
	const rawCountryNorm = raw.country
		? (FULL_COUNTRY_TO_ISO[raw.country.toLowerCase().trim()] ?? raw.country)
		: raw.country;

	// Resolve country — drop values > 10 chars (unrecognized country names that don't fit varchar(10))
	let country = rawCountryNorm?.toUpperCase() ?? null;
	if (country && country.length > 10) country = null;

	if (!country && raw.city) {
		const cityLower = raw.city.toLowerCase();
		if (LATAM_CITIES[cityLower]) {
			country = LATAM_CITIES[cityLower];
		}
	}

	if (!country) {
		// Try to detect from text fields
		const textBlob = [raw.name, raw.description, raw.fullAddress, raw.venue]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		for (const [name, iso] of Object.entries(LATAM_COUNTRY_NAMES)) {
			if (textBlob.includes(name)) {
				country = iso;
				break;
			}
		}
	}

	// LATAM scoring (use normalized country so Signal 1 fires correctly)
	const normalizedRaw = { ...raw, country: rawCountryNorm };
	const latamResult = scoreLATAM(normalizedRaw);

	// Determine format
	const format = mapModality(raw);

	// Determine status
	const status = deriveStatus(startDate, endDate);

	// Infer event type
	const eventType = inferEventType(raw.name, raw.description ?? "");

	// Parse prize pool as integer (USD amount)
	const prizePool = parsePrizeAmount(raw.prizePool ?? undefined) ?? null;

	// Generate slug
	const slug = generateSlug(raw.name);

	// Build websiteUrl: prefer explicit websiteUrl, fall back to sourceUrl
	const websiteUrl = raw.websiteUrl
		? normalizeUrl(raw.websiteUrl)
		: normalizeUrl(raw.sourceUrl);

	// Domains: use inferDomains with themes/technologies as additional text context
	// (raw scraper themes may contain noise, so we always go through keyword matching)
	const themeText = [
		...(raw.themes ?? []),
		...(raw.technologies ?? []),
		...(raw.tracks ?? []),
	].join(" ");
	const domains = inferDomains(
		raw.name,
		`${raw.description ?? ""} ${themeText}`,
	);

	// meetingUrl for virtual events
	const meetingUrl =
		format === "virtual" ? (raw.websiteUrl ?? raw.sourceUrl ?? null) : null;

	// Prize description from structured prizes array
	const prizeDescription =
		raw.prizes && raw.prizes.length > 0
			? raw.prizes
					.map(
						(p) =>
							`${p.place}: ${p.amount}${p.description ? ` — ${p.description}` : ""}`,
					)
					.join("; ")
			: null;

	return {
		name: cleanText(raw.name),
		slug,
		description: raw.description ? cleanText(raw.description) : null,
		eventType,

		// Parent/child not applicable for scraped events
		parentEventId: null,
		dayNumber: null,

		// Dates
		startDate,
		endDate,
		registrationDeadline,

		// Location
		format,
		country,
		department: null, // scrapers don't provide department/state
		city: raw.city ?? null,
		venue: raw.venue ?? null,
		timezone: null, // scrapers don't reliably provide timezone
		geoLatitude: null,
		geoLongitude: null,
		meetingUrl,

		// Classification
		skillLevel: "all",
		domains,

		// Prizes
		prizePool,
		prizeCurrency: "USD",
		prizeDescription,

		// Links
		websiteUrl,
		registrationUrl: raw.registrationUrl
			? normalizeUrl(raw.registrationUrl)
			: null,
		devpostUrl:
			raw.sourceType === "devpost" ? normalizeUrl(raw.sourceUrl) : null,

		// Media
		eventImageUrl: sanitizeImageUrl(raw.imageUrl ?? raw.bannerUrl) ?? null,

		// Status
		status,
		isFeatured: false,

		// Scope
		scope: raw.scopeHint === "global" ? "global_latam_eligible" : "latam",

		// Approval — all scraped events go to curation queue
		isApproved: false,
		approvalStatus: "pending",

		organizationId: SYSTEM_IMPORT_ORGANIZATION_ID,

		// Timestamps
		sourceScrapedAt: new Date(),

		// Scraper metadata
		scrapeSource: raw.sourceType,
		scrapeSourceUrl: raw.sourceUrl,
		scrapeConfidence: raw.classifyConfidence ?? latamResult.score,
		scrapeRawData: raw as unknown as Record<string, unknown>,
	};
}
