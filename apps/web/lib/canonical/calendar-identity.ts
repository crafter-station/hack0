const LUMA_ID = /^cal-[A-Za-z0-9]+$/i;

export function normalizeCalendarAlias(value: string): string {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed.toLowerCase();
  const url = new URL(trimmed);
  url.protocol = "https:";
  url.hostname = "luma.com";
  url.port = "";
  url.search = "";
  url.hash = "";
  const manage = url.pathname.match(/^\/calendar\/manage\/(cal-[A-Za-z0-9]+)\/?$/i);
  if (manage) url.pathname = `/calendar/${manage[1]}`;
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().toLowerCase();
}

export function lumaCalendarIdFromValues(values: {
  calendarId?: string | null;
  url?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
}): string | null {
  const metadataId = values.sourceMetadata?.lumaCalendarId;
  if (typeof metadataId === "string" && LUMA_ID.test(metadataId)) return metadataId;
  const publicId = values.calendarId?.match(/^(?:scr-)?(cal-[A-Za-z0-9]+)$/i)?.[1];
  if (publicId) return publicId;
  if (values.url) {
    const urlId = values.url.match(/\/calendar\/(?:manage\/)?(cal-[A-Za-z0-9]+)(?:[/?#]|$)/i)?.[1];
    if (urlId) return urlId;
  }
  return null;
}

type CalendarSourceKind = "api" | "calendar" | "profile" | "event";

export function calendarSourcePriority(source: {
  source?: "api" | "scrape" | null;
  sourceKind?: CalendarSourceKind | null;
  syncStatus?: string | null;
}): number {
  if (source.source === "api" || source.sourceKind === "api") return 3;
  if (source.syncStatus === "completed" || source.syncStatus === "partial") return 2;
  return 1;
}

export function chooseCanonicalCalendar<
  T extends {
    source?: "api" | "scrape" | null;
    sourceKind?: CalendarSourceKind | null;
    syncStatus?: string | null;
    createdAt?: string | null;
  },
>(calendars: T[]): T | null {
  return (
    [...calendars].sort(
      (a, b) => calendarSourcePriority(b) - calendarSourcePriority(a) || Date.parse(a.createdAt ?? "") - Date.parse(b.createdAt ?? ""),
    )[0] ?? null
  );
}
