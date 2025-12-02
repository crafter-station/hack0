import Firecrawl from "@mendable/firecrawl-js";
import type { EVENT_TYPES, ORGANIZER_TYPES } from "@/lib/db/schema";

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

export type EventType = typeof EVENT_TYPES[number];
export type OrganizerType = typeof ORGANIZER_TYPES[number];

export interface ScrapedEvent {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
  prizeAmount?: string;
  location: string;
  participantCount?: number;
  themes?: string[];
  logoUrl?: string;
  organizerName?: string;
}

// Legacy alias
export type DevpostHackathon = ScrapedEvent;

export interface ScrapeResult {
  hackathons: ScrapedEvent[];
}

const DEVPOST_SEARCH_URLS = [
  // Peru first for testing
  "https://devpost.com/hackathons?search=peru",
  "https://devpost.com/hackathons?search=latam",
  "https://devpost.com/hackathons?search=latin+america",
  "https://devpost.com/hackathons?search=mexico",
  "https://devpost.com/hackathons?search=brazil",
  "https://devpost.com/hackathons?search=argentina",
  "https://devpost.com/hackathons?search=colombia",
  "https://devpost.com/hackathons?search=chile",
];

export async function scrapeDevpostPage(url: string): Promise<DevpostHackathon[]> {
  try {
    console.log(`  📡 Fetching: ${url}`);

    const result = await firecrawl.extract({
      urls: [url],
      schema: {
        type: "object",
        properties: {
          hackathons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name of the hackathon" },
                description: { type: "string", description: "Brief description" },
                url: { type: "string", description: "URL to the hackathon page" },
                startDate: { type: "string", description: "Start date in ISO format" },
                endDate: { type: "string", description: "End date in ISO format" },
                prizeAmount: { type: "string", description: "Prize amount if available" },
                location: { type: "string", description: "Location or 'Online'" },
                participantCount: { type: "number", description: "Number of participants" },
                themes: { type: "array", items: { type: "string" }, description: "Themes/tags" },
                logoUrl: { type: "string", description: "Logo image URL" },
                organizerName: { type: "string", description: "Name of the organizer" },
              },
              required: ["name", "url"],
            },
          },
        },
        required: ["hackathons"],
      },
      prompt: "Extract all hackathons listed on this page. For each hackathon, get the name, description, URL, dates, prize amount, location, themes, logo URL, and organizer name.",
    });

    console.log(`  📦 Response success: ${result.success}`);

    if (result.success && result.data) {
      const data = result.data as ScrapeResult;
      console.log(`  ✅ Found ${data.hackathons?.length || 0} hackathons`);

      if (data.hackathons?.length > 0) {
        console.log(`  📋 First hackathon: ${data.hackathons[0].name}`);
      }

      return data.hackathons || [];
    }

    console.log(`  ⚠️ No data in response`);
    console.log(`  📄 Response:`, JSON.stringify(result, null, 2));

    return [];
  } catch (error) {
    console.error(`  ❌ Error scraping ${url}:`, error);
    return [];
  }
}

export async function scrapeAllDevpostPages(): Promise<DevpostHackathon[]> {
  const allHackathons: DevpostHackathon[] = [];
  const seenUrls = new Set<string>();

  for (const url of DEVPOST_SEARCH_URLS) {
    console.log(`Scraping: ${url}`);
    const hackathons = await scrapeDevpostPage(url);

    for (const hackathon of hackathons) {
      // Deduplicate by URL
      if (!seenUrls.has(hackathon.url)) {
        seenUrls.add(hackathon.url);
        allHackathons.push(hackathon);
      }
    }

    // Rate limiting - wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Total unique hackathons found: ${allHackathons.length}`);
  return allHackathons;
}

export function parseLocation(location: string): { country: string; city?: string; format: "virtual" | "in-person" | "hybrid" } {
  const locationLower = location.toLowerCase();

  // Check for virtual/online indicators
  if (
    locationLower.includes("virtual") ||
    locationLower.includes("online") ||
    locationLower.includes("remote")
  ) {
    // Check if hybrid
    if (locationLower.includes("hybrid") || locationLower.includes("in-person")) {
      return { country: "GLOBAL", format: "hybrid" };
    }
    return { country: "GLOBAL", format: "virtual" };
  }

  // Map common LATAM locations to country codes
  const countryMap: Record<string, string> = {
    mexico: "MX",
    "méxico": "MX",
    "ciudad de mexico": "MX",
    "mexico city": "MX",
    guadalajara: "MX",
    monterrey: "MX",
    brazil: "BR",
    brasil: "BR",
    "são paulo": "BR",
    "sao paulo": "BR",
    "rio de janeiro": "BR",
    argentina: "AR",
    "buenos aires": "AR",
    colombia: "CO",
    bogota: "CO",
    "bogotá": "CO",
    medellin: "CO",
    "medellín": "CO",
    peru: "PE",
    "perú": "PE",
    lima: "PE",
    chile: "CL",
    santiago: "CL",
    uruguay: "UY",
    montevideo: "UY",
    venezuela: "VE",
    caracas: "VE",
    ecuador: "EC",
    quito: "EC",
    guatemala: "GT",
    "costa rica": "CR",
    panama: "PA",
    "panamá": "PA",
  };

  for (const [key, code] of Object.entries(countryMap)) {
    if (locationLower.includes(key)) {
      return { country: code, city: location, format: "in-person" };
    }
  }

  // Default to Global virtual if we can't determine location
  return { country: "GLOBAL", format: "virtual" };
}

export function parsePrizeAmount(prizeString?: string): number | null {
  if (!prizeString) return null;

  // Extract number from strings like "$50,000", "USD 10000", "$5K", etc.
  const match = prizeString.match(/[\$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)[kK]?/);
  if (!match) return null;

  let amount = parseFloat(match[1].replace(/,/g, ""));

  // Handle "K" suffix
  if (prizeString.toLowerCase().includes("k")) {
    amount *= 1000;
  }

  return Math.round(amount);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function inferDomains(
  name: string,
  description: string,
  themes?: string[]
): string[] {
  const domains: string[] = [];
  const text = `${name} ${description} ${(themes || []).join(" ")}`.toLowerCase();

  const domainKeywords: Record<string, string[]> = {
    ai: ["ai", "artificial intelligence", "machine learning", "ml", "llm", "gpt", "deep learning", "neural", "inteligencia artificial"],
    web3: ["web3", "blockchain", "crypto", "nft", "defi", "dao", "ethereum", "solana", "bitcoin"],
    blockchain: ["blockchain", "smart contract", "decentralized"],
    fintech: ["fintech", "finance", "banking", "payment", "trading", "investment", "banca", "pagos"],
    "social-impact": ["social", "impact", "sustainability", "nonprofit", "community", "charity", "impacto social", "ciudadan"],
    "open-source": ["open source", "open-source", "oss", "foss"],
    mobile: ["mobile", "ios", "android", "app"],
    gaming: ["game", "gaming", "esports", "vr", "ar", "metaverse"],
    healthtech: ["health", "healthcare", "medical", "biotech", "wellness", "salud", "médic"],
    edtech: ["education", "edtech", "learning", "students", "university", "educación", "universidad", "escuela"],
    climate: ["climate", "environment", "green", "sustainable", "carbon", "clima", "sostenible", "circular", "verde"],
    cybersecurity: ["security", "cybersecurity", "hacking", "infosec", "seguridad", "ciberseguridad"],
    "data-science": ["data science", "analytics", "big data", "datos", "analítica"],
    iot: ["iot", "internet of things", "sensors", "embedded", "smart home"],
    robotics: ["robot", "robotic", "automation", "robótica", "automa"],
    quantum: ["quantum", "cuántic"],
    biotech: ["biotech", "biology", "genetic", "biología", "genétic"],
    agritech: ["agri", "agriculture", "farming", "crop", "agricultur"],
    legaltech: ["legal", "law", "justice", "jurídic", "justicia"],
    govtech: ["government", "civic", "public sector", "gobierno", "municipal", "público"],
    space: ["space", "nasa", "satellite", "aerospace", "espacio", "aeroespacial"],
    energy: ["energy", "renewable", "solar", "wind", "energía", "renovable"],
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      domains.push(domain);
    }
  }

  // If no domains found, mark as general
  if (domains.length === 0) {
    domains.push("general");
  }

  return domains;
}

/**
 * Infer the event type from name and description
 */
export function inferEventType(
  name: string,
  description: string
): EventType {
  const text = `${name} ${description}`.toLowerCase();

  // Check for specific event types (order matters - more specific first)
  const typeKeywords: [EventType, string[]][] = [
    ["summer_school", ["escuela de verano", "summer school", "winter school", "escuela de invierno", "programa intensivo"]],
    ["bootcamp", ["bootcamp", "boot camp", "programa intensivo", "inmersivo"]],
    ["olympiad", ["olimpiada", "olympiad", "olimpíada"]],
    ["robotics", ["robótica", "robotics", "robot"]],
    ["research_fair", ["feria científica", "research fair", "póster", "semillero", "investigación"]],
    ["fellowship", ["fellowship", "beca", "scholarship", "grant"]],
    ["accelerator", ["aceleradora", "accelerator", "acceleration"]],
    ["incubator", ["incubadora", "incubator", "incubation"]],
    ["call_for_papers", ["call for papers", "cfp", "convocatoria de papers", "paper submission"]],
    ["certification", ["certificación", "certification", "certified"]],
    ["course", ["curso", "course", "diplomado", "diploma"]],
    ["workshop", ["taller", "workshop", "hands-on", "práctico"]],
    ["seminar", ["seminario", "seminar", "ponencia", "charla", "talk"]],
    ["conference", ["congreso", "conference", "simposio", "symposium", "cumbre", "summit"]],
    ["meetup", ["meetup", "meet-up", "encuentro", "gathering"]],
    ["networking", ["networking", "network event"]],
    ["competition", ["competencia", "competition", "concurso", "contest", "torneo", "reto", "challenge", "desafío"]],
    ["hackathon", ["hackathon", "hackatón", "hack", "buildathon", "codeathon", "convocatoria"]],
  ];

  for (const [type, keywords] of typeKeywords) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return type;
    }
  }

  // Default to hackathon for Devpost scrapes
  return "hackathon";
}

/**
 * Infer the organizer type from organizer name and URL
 */
export function inferOrganizerType(
  organizerName?: string,
  organizerUrl?: string
): OrganizerType | null {
  if (!organizerName && !organizerUrl) return null;

  const text = `${organizerName || ""} ${organizerUrl || ""}`.toLowerCase();

  const typeKeywords: [OrganizerType, string[]][] = [
    ["international_org", ["nasa", "unesco", "onu", "un.", "world bank", "interamerican", "oas", "bid", "iadb"]],
    ["embassy", ["embajada", "embassy", "consulado", "consulate", "british council", "goethe", "alianza francesa"]],
    ["government", ["gobierno", "government", "ministerio", "ministry", "municipalidad", "municipal", "gob.pe", "gob.mx", "gov.", "senaju", "concytec", "produce", "minedu"]],
    ["university", ["universidad", "university", "univ", "upc", "pucp", "ulima", "usil", "utp", "uni.", "unmsm", "utec", "cayetano", "pacífico", "continental"]],
    ["student_org", ["ieee", "acm", "gdg", "dsc", "google developer", "mlsa", "estudiantil", "student"]],
    ["ngo", ["fundación", "foundation", "ong", "ngo", "asociación", "association", "colegio de ingeniero", "cip"]],
    ["community", ["comunidad", "community", "meetup", "pycon", "jsconf", "devconf", "women in tech", "girl"]],
    ["startup", ["startup", "ventures", "labs", "incubadora", "aceleradora", "ycombinator", "techstars"]],
    ["media", ["media", "techcrunch", "platzi", "código facilito"]],
    ["company", ["microsoft", "google", "aws", "amazon", "meta", "facebook", "oracle", "ibm", "intel", "nvidia", "openai", "anthropic"]],
  ];

  for (const [type, keywords] of typeKeywords) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return type;
    }
  }

  return null;
}

/**
 * Infer if event is junior/beginner friendly
 */
export function inferJuniorFriendly(
  name: string,
  description: string,
  skillLevel?: string
): boolean {
  // If explicitly marked as beginner, it's junior friendly
  if (skillLevel === "beginner" || skillLevel === "all") {
    return true;
  }

  const text = `${name} ${description}`.toLowerCase();

  const juniorKeywords = [
    "beginner",
    "principiante",
    "first-time",
    "primera vez",
    "newcomer",
    "newbie",
    "starter",
    "intro ",
    "introduction",
    "básico",
    "basic",
    "no experience",
    "sin experiencia",
    "students",
    "estudiantes",
    "universitarios",
    "escolar",
    "high school",
    "colegio",
    "all levels",
    "todos los niveles",
    "welcome all",
    "abierto a todos",
    "no coding",
    "low-code",
    "no-code",
  ];

  return juniorKeywords.some((keyword) => text.includes(keyword));
}
