// Server-only Firecrawl helpers. Direct API mode (fc-* key).
// Only imported from server functions and server routes.
import type { EventEnrichment } from "@/lib/canonical/canonical-events";

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

function requireKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");
  return key;
}

export function hasFirecrawl(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

async function fcCall<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FIRECRAWL_V2}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Firecrawl ${path} [${res.status}]: ${raw.slice(0, 400)}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Firecrawl ${path} returned non-JSON: ${raw.slice(0, 200)}`);
  }
}

export type FirecrawlBranding = {
  colorScheme?: "light" | "dark";
  logo?: string;
  colors?: Partial<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
  }>;
  fonts?: Array<{ family: string }>;
  typography?: {
    fontFamilies?: Partial<{ primary: string; heading: string; code: string }>;
  };
  images?: Partial<{ logo: string; favicon: string; ogImage: string }>;
};

type ScrapeResponse<Extra = Record<string, unknown>> = {
  success?: boolean;
  data?: {
    markdown?: string;
    html?: string;
    links?: string[];
    metadata?: Record<string, unknown>;
    branding?: FirecrawlBranding;
    json?: unknown;
    summary?: string;
  } & Extra;
  markdown?: string;
  branding?: FirecrawlBranding;
  metadata?: Record<string, unknown>;
  json?: unknown;
};

/** Normalize v2 response shape: fields can be top-level or under `data`. */
function pickBody<T extends ScrapeResponse>(res: T) {
  const d = res.data ?? {};
  return {
    markdown: (res.markdown ?? d.markdown) as string | undefined,
    branding: (res.branding ?? d.branding) as FirecrawlBranding | undefined,
    metadata: (res.metadata ?? d.metadata) as Record<string, unknown> | undefined,
    json: (res.json ?? d.json) as unknown,
    links: d.links as string[] | undefined,
  };
}

export async function firecrawlBranding(url: string): Promise<FirecrawlBranding | null> {
  try {
    const res = await fcCall<ScrapeResponse>("/scrape", {
      url,
      formats: ["branding"],
      onlyMainContent: true,
    });
    return pickBody(res).branding ?? null;
  } catch (e) {
    console.error("[firecrawl] branding failed:", (e as Error).message);
    return null;
  }
}

export async function firecrawlScrapeSource(url: string): Promise<{
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  branding: FirecrawlBranding | null;
}> {
  try {
    const res = await fcCall<ScrapeResponse>("/scrape", {
      url,
      formats: ["branding", "markdown"],
      onlyMainContent: false,
      waitFor: 1000,
    });
    const body = pickBody(res);
    const metadata = body.metadata ?? {};
    const branding = body.branding ?? null;
    const logo = branding?.logo ?? branding?.images?.logo ?? branding?.images?.favicon ?? (metadata.favicon as string | undefined) ?? null;
    const cover =
      (metadata["og:image"] as string | undefined) ?? (metadata.ogImage as string | undefined) ?? branding?.images?.ogImage ?? null;
    return {
      name: (metadata.title as string | undefined)?.replace(/\s*[·|]\s*Luma\s*$/i, "").trim() ?? null,
      description: (metadata.description as string | undefined) ?? null,
      avatarUrl: logo,
      coverUrl: cover,
      branding,
    };
  } catch (error) {
    console.error("[firecrawl] source metadata failed:", (error as Error).message);
    return { name: null, description: null, avatarUrl: null, coverUrl: null, branding: null };
  }
}

/** Scrape an event page and extract provider-neutral structured event data. */
export async function firecrawlScrapeEvent(url: string): Promise<{
  name: string;
  description: string | null;
  coverUrl: string | null;
  city: string | null;
  startAt: string | null;
  endAt: string | null;
  hostName: string | null;
  enrichment: EventEnrichment;
  branding: FirecrawlBranding | null;
  ogImage: string | null;
} | null> {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      coverUrl: { type: "string" },
      city: { type: "string" },
      startAt: { type: "string" },
      endAt: { type: "string" },
      hostName: { type: "string" },
      countryCode: { type: "string" },
      languageCode: { type: "string" },
      isOnline: { type: "boolean" },
      format: { type: "string" },
      venueName: { type: "string" },
      venueAddress: { type: "string" },
    },
    required: ["name"],
  } as const;

  try {
    const res = await fcCall<ScrapeResponse>("/scrape", {
      url,
      formats: [
        "markdown",
        "branding",
        {
          type: "json",
          schema,
          prompt:
            "Extract the event's name, one-paragraph description, cover image URL, city, ISO start date, ISO end date, host/organizer, two-letter ISO country code, BCP-47 language code, whether it is online, format, venue name, and full venue address. Dates must include a timezone offset when the page provides one. Omit location values when they are not stated; do not infer them from the organizer alone.",
        },
      ],
      onlyMainContent: true,
    });
    const body = pickBody(res);
    const j = (body.json ?? {}) as Partial<{
      name: string;
      description: string;
      coverUrl: string;
      city: string;
      startAt: string;
      endAt: string;
      hostName: string;
      countryCode: string;
      languageCode: string;
      isOnline: boolean;
      format: string;
      venueName: string;
      venueAddress: string;
    }>;
    const meta = body.metadata ?? {};
    const ogImage =
      (meta["og:image"] as string | undefined) ?? (meta.ogImage as string | undefined) ?? body.branding?.images?.ogImage ?? null;
    const name = (j.name ?? (meta.title as string | undefined) ?? "").trim();
    if (!name) return null;
    const sources = Object.fromEntries(
      [
        ["countryCode", j.countryCode],
        ["languageCode", j.languageCode],
        ["isOnline", typeof j.isOnline === "boolean" ? String(j.isOnline) : null],
        ["format", j.format],
        ["venueName", j.venueName],
        ["venueAddress", j.venueAddress],
      ]
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([field]) => [field, "firecrawl"]),
    );
    return {
      name,
      description: j.description ?? (meta.description as string | undefined) ?? null,
      coverUrl: j.coverUrl ?? ogImage ?? null,
      city: j.city ?? null,
      startAt: j.startAt ?? null,
      endAt: j.endAt ?? null,
      hostName: j.hostName ?? null,
      enrichment: {
        countryCode: j.countryCode?.trim().toUpperCase() || null,
        languageCode: j.languageCode?.trim().toLowerCase() || null,
        isOnline: typeof j.isOnline === "boolean" ? j.isOnline : null,
        format: j.format?.trim() || null,
        venueName: j.venueName?.trim() || null,
        venueAddress: j.venueAddress?.trim() || null,
        confidence: Object.keys(sources).length > 0 ? 0.88 : null,
        sources,
      },
      branding: body.branding ?? null,
      ogImage,
    };
  } catch (e) {
    console.error("[firecrawl] scrapeEvent failed:", (e as Error).message);
    return null;
  }
}

/** Discover Eventbrite or Meetup event detail links from a public collection. */
export async function firecrawlDiscoverProviderEvents(
  sourceUrl: string,
  provider: "eventbrite" | "meetup",
  limit: number,
): Promise<string[]> {
  const seen = new Set<string>();
  const addUrls = (urls: string[]) => {
    for (const raw of urls) {
      try {
        const url = new URL(raw);
        const host = url.hostname.replace(/^www\./, "").toLowerCase();
        const matches =
          provider === "eventbrite"
            ? (host === "eventbrite.com" || host.includes(".eventbrite.")) && /\/e\/[^/]+-\d+\/?$/i.test(url.pathname)
            : host === "meetup.com" && /\/[^/]+\/events\/\d+\/?$/i.test(url.pathname);
        if (!matches) continue;
        url.search = "";
        url.hash = "";
        seen.add(url.toString().replace(/\/$/, ""));
        if (seen.size >= limit) break;
      } catch {
        // Ignore malformed discovery results.
      }
    }
  };

  try {
    const response = await fcCall<{ links?: unknown; data?: { links?: unknown } }>("/map", {
      url: sourceUrl,
      limit,
      includeSubdomains: false,
    });
    addUrls(linkUrls(response.links ?? response.data?.links));
  } catch (error) {
    console.error(`[firecrawl] ${provider} map failed:`, (error as Error).message);
  }

  if (seen.size < limit) {
    try {
      const actions = Array.from({ length: 20 }, () => [
        { type: "scroll", direction: "down" },
        { type: "wait", milliseconds: 500 },
      ]).flat();
      const response = await fcCall<ScrapeResponse>("/scrape", {
        url: sourceUrl,
        formats: ["links"],
        onlyMainContent: false,
        waitFor: 1500,
        maxAge: 0,
        timeout: 120000,
        actions,
      });
      addUrls(linkUrls(pickBody(response).links));
    } catch (error) {
      console.error(`[firecrawl] ${provider} link scrape failed:`, (error as Error).message);
    }
  }
  return [...seen];
}

const RESERVED_SEGMENTS = new Set([
  "home",
  "discover",
  "signin",
  "signup",
  "create",
  "help",
  "pricing",
  "terms",
  "privacy",
  "about",
  "settings",
  "cal",
]);

/** Pull URL strings out of a Firecrawl links payload — v2 returns `{ url, ... }`
 *  objects (map) while older responses used plain strings. Handle both. */
function linkUrls(links: unknown): string[] {
  if (!Array.isArray(links)) return [];
  return links.map((l) => (typeof l === "string" ? l : ((l as { url?: string })?.url ?? ""))).filter((u): u is string => Boolean(u));
}

/** Discover Luma event URLs under a calendar page. */
export async function firecrawlDiscoverLumaEvents(calendarUrl: string, limit: number): Promise<string[]> {
  const base = new URL(calendarUrl);
  const calendarSeg = base.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  const lumaHosts = new Set(["lu.ma", "luma.com", "www.luma.com"]);

  // Luma event slugs: single path segment, alphanumeric-ish, not the calendar
  // itself and not a known non-event route.
  const isEventUrl = (u: string): boolean => {
    try {
      const p = new URL(u);
      if (!lumaHosts.has(p.host.toLowerCase())) return false;
      const seg = p.pathname.replace(/^\/+|\/+$/g, "");
      if (!seg || seg.includes("/")) return false;
      const low = seg.toLowerCase();
      if (low === calendarSeg) return false; // the calendar page itself
      if (RESERVED_SEGMENTS.has(low)) return false;
      return /^[a-z0-9\-_]{3,}$/i.test(seg);
    } catch {
      return false;
    }
  };

  const discovered: string[] = [];
  const addDiscovered = (urls: string[]) => {
    for (const url of urls) {
      if (!isEventUrl(url)) continue;
      const parsed = new URL(url);
      const canonicalUrl = `https://luma.com${parsed.pathname.replace(/\/+$/, "")}`;
      if (discovered.includes(canonicalUrl)) continue;
      discovered.push(canonicalUrl);
      if (discovered.length >= limit) break;
    }
  };

  // 1) /map — fast sitemap + crawl discovery. v2 returns `links` as objects.
  try {
    const res = await fcCall<{ links?: unknown }>("/map", {
      url: calendarUrl,
      limit,
      includeSubdomains: false,
    });
    addDiscovered(linkUrls(res.links));
  } catch (e) {
    console.error("[firecrawl] map failed:", (e as Error).message);
  }
  if (discovered.length >= limit) return discovered;

  // 2) Scrape the JS-rendered page after repeated scrolls. Luma profile pages
  // load hosted events incrementally, so the initial DOM often contains only one.
  try {
    const actions = Array.from({ length: 20 }, () => [
      { type: "scroll", direction: "down" },
      { type: "wait", milliseconds: 500 },
    ]).flat();
    const res = await fcCall<ScrapeResponse>("/scrape", {
      url: calendarUrl,
      formats: ["links"],
      onlyMainContent: false,
      waitFor: 1500,
      maxAge: 0,
      timeout: 120000,
      actions,
    });
    addDiscovered(linkUrls(pickBody(res).links));
  } catch (e) {
    console.error("[firecrawl] scrape-links fallback failed:", (e as Error).message);
  }
  return discovered;
}
