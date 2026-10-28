import type { EventProvider } from "./canonical-events";

type SupportedProvider = EventProvider;
type ProviderImportKind = "calendar" | "event" | "profile" | "organizer" | "group";

type ProviderImportTarget = {
  provider: SupportedProvider;
  kind: ProviderImportKind;
  providerSourceId: string;
  normalizedUrl: string;
  confidence: "certain" | "inferred";
  supportedKinds: ProviderImportKind[];
};

export function providerForUrl(raw: string): SupportedProvider | null {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "luma.com" || host === "lu.ma") return "luma";
    if (host === "eventbrite.com" || host.includes(".eventbrite.")) return "eventbrite";
    if (host === "meetup.com") return "meetup";
    return null;
  } catch {
    return null;
  }
}

export function providerEventId(provider: SupportedProvider, raw: string): string | null {
  try {
    const url = new URL(raw);
    if (provider === "eventbrite") {
      return url.pathname.match(/\/e\/[^/]*-(\d+)\/?$/i)?.[1] ?? url.searchParams.get("eid");
    }
    if (provider === "meetup") return url.pathname.match(/\/events\/(\d+)\/?$/)?.[1] ?? null;
    return url.pathname.match(/(?:^|\/)(evt-[A-Za-z0-9]+)(?:\/|$)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function providerSourceId(provider: SupportedProvider, raw: string): string {
  const eventId = providerEventId(provider, raw);
  if (eventId) return `${provider}:event:${eventId}`;
  const url = new URL(raw);
  url.search = "";
  url.hash = "";
  if (provider === "meetup") {
    const slug = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    if (slug) return `meetup:meetup.com/${slug}`;
  }
  return `${provider}:${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/+$/, "")}`;
}

const SUPPORTED_KINDS: Record<SupportedProvider, ProviderImportKind[]> = {
  eventbrite: ["event", "organizer"],
  meetup: ["event", "group"],
  luma: ["event", "calendar", "profile"],
};

function lumaKind(path: string): { kind: ProviderImportKind; confidence: ProviderImportTarget["confidence"] } {
  if (/^(user|u|profile)\//i.test(path)) return { kind: "profile", confidence: "certain" };
  return { kind: "calendar", confidence: path && !/^calendar\//i.test(path) ? "inferred" : "certain" };
}

function importKind(provider: SupportedProvider, eventId: string | null, url: URL) {
  if (eventId) return { kind: "event" as ProviderImportKind, confidence: "certain" as const };
  if (provider === "eventbrite") return { kind: "organizer" as ProviderImportKind, confidence: "certain" as const };
  if (provider === "meetup") return { kind: "group" as ProviderImportKind, confidence: "certain" as const };
  return lumaKind(url.pathname.replace(/^\/+|\/+$/g, ""));
}

export function detectProviderImportTarget(raw: string): ProviderImportTarget | null {
  const provider = providerForUrl(raw);
  if (!provider) return null;
  const url = new URL(raw);
  url.hash = "";
  const eventId = providerEventId(provider, url.toString());
  const { kind, confidence } = importKind(provider, eventId, url);

  url.search = "";
  if (provider === "meetup" && !eventId) {
    const slug = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    url.hostname = "www.meetup.com";
    url.pathname = slug ? `/${slug}` : "/";
  } else {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }
  return {
    provider,
    kind,
    providerSourceId: providerSourceId(provider, raw),
    normalizedUrl: url.toString(),
    confidence,
    supportedKinds: SUPPORTED_KINDS[provider],
  };
}
