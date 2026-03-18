export type SourceType =
	| "devpost"
	| "mlh"
	| "eventbrite"
	| "meetup"
	| "linkedin"
	| "twitter"
	| "instagram"
	| "university"
	| "hackathon_com"
	| "perplexity_discovery"
	| "haiku_discovery"
	| "exa_discovery"
	| "websearch_discovery"
	| "other";

export interface RawHackathon {
	// Required
	name: string;
	sourceUrl: string;
	sourceType: SourceType;

	// Optional — extract as much as possible
	externalId?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	registrationDeadline?: string;
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
	scopeHint?: "latam" | "global"; // scrapers set this when they know the event is global
	classifyConfidence?: number; // LLM confidence 0-100, set by classifyLatamHybrid
}

export interface ScraperResult {
	source: SourceType;
	hackathons: RawHackathon[];
	errors: Array<{ url: string; error: string }>;
	metadata: {
		pagesScraped: number;
		totalFound: number;
		durationMs: number;
	};
}
