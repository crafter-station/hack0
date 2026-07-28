export const EVENT_SOURCE_TYPES = [
	"devpost",
	"mlh",
	"eventbrite",
	"meetup",
	"linkedin",
	"twitter",
	"instagram",
	"university",
	"hackathon_com",
	"perplexity_discovery",
	"haiku_discovery",
	"exa_discovery",
	"websearch_discovery",
	"luma_official",
	"luma_router",
	"luma_community",
	"luma_discovery",
	"peruanos_dev",
	"other",
] as const;

export type SourceType = (typeof EVENT_SOURCE_TYPES)[number];

export interface EventCandidate {
	// Every adapter must provide a human-readable name and a stable source URL.
	name: string;
	sourceUrl: string;
	sourceType: SourceType;

	externalId?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	registrationDeadline?: string;
	timezone?: string;
	modality?: string;
	country?: string;
	city?: string;
	venue?: string;
	fullAddress?: string;
	websiteUrl?: string;
	registrationUrl?: string;
	imageUrl?: string;
	bannerUrl?: string;
	prizePool?: string;
	prizes?: Array<{ place: string; amount: string; description: string }>;
	maxParticipants?: number;
	currentParticipants?: number;
	teamSizeMin?: number;
	teamSizeMax?: number;
	themes?: string[];
	technologies?: string[];
	tracks?: string[];
	organizers?: Array<{ name: string; url?: string; logo?: string }>;
	sponsors?: Array<{
		name: string;
		url?: string;
		tier?: string;
		logo?: string;
	}>;
	eligibility?: string;
	eligibilityEvidence?: string[];
	rules?: string;
	languages?: string[];
	judges?: Array<{
		name: string;
		title?: string;
		organization?: string;
		photo?: string;
	}>;
	judgingCriteria?: Array<{
		criterion: string;
		weight?: string;
		description?: string;
	}>;
	schedule?: Array<{ date?: string; title: string; description?: string }>;
	resources?: Array<{ title: string; url: string }>;
	contactEmail?: string;
	scopeHint?: "latam" | "global";
	classifyConfidence?: number;
	discoveredAt?: string;
	raw?: unknown;
}

/**
 * Backward-compatible name for existing scraper adapters. New adapters should
 * return EventCandidate directly.
 */
export type RawHackathon = EventCandidate;

export interface ScraperResult {
	source: SourceType;
	hackathons: EventCandidate[];
	errors: Array<{ url: string; error: string }>;
	metadata: {
		pagesScraped: number;
		totalFound: number;
		durationMs: number;
	};
}
