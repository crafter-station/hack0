import { and, asc, gte, inArray, isNull, or } from "drizzle-orm";
import { type CalendarEvent, metroOf, slugify } from "@/lib/calendar";
import { getDb } from "@/lib/db/client";
import { canonicalEvents } from "@/lib/db/schema";

/** Spanish and Portuguese speaking countries of the Americas. */
const LATAM_COUNTRIES = [
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PE",
  "PR",
  "PY",
  "SV",
  "UY",
  "VE",
];
const LATAM_LANGUAGES = ["es", "pt"];

type Row = typeof canonicalEvents.$inferSelect;

/** Luma's `city_state` is "District, Region"; the region decides the metro hub. */
function splitCity(raw: string | null): { city: string | null; region: string | undefined } {
  if (!raw) return { city: null, region: undefined };
  const [city, region] = raw.split(",").map((p) => p.trim());
  return { city: city || null, region: region || undefined };
}

export function rowToEvent(row: Row): CalendarEvent {
  const { city, region } = splitCity(row.city);
  const code = row.url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/+$/, "");
  const online = row.isOnline === true;
  return {
    id: row.lumaEventId ?? row.id,
    slug: `${slugify(row.name)}-${slugify(code)}`.replace(/^-+/, ""),
    name: row.name,
    url: row.url,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt?.toISOString() ?? null,
    timezone: row.timezone ?? "America/Lima",
    city: city ? [city, row.countryCode].filter(Boolean).join(", ") : null,
    country: row.countryCode,
    metro: city ? metroOf(city, region) : null,
    address: row.venueAddress,
    online,
    coverUrl: row.coverUrl,
    location: row.latitude !== null && row.longitude !== null ? [row.latitude, row.longitude] : null,
    tags: row.tags,
  };
}

/** Catalog events that belong on hack0: held in LATAM, or online in Spanish or Portuguese. */
export async function latamEvents(opts: { after?: Date } = {}): Promise<CalendarEvent[]> {
  const latam = or(
    inArray(canonicalEvents.countryCode, LATAM_COUNTRIES),
    and(isNull(canonicalEvents.countryCode), inArray(canonicalEvents.languageCode, LATAM_LANGUAGES)),
  );
  const rows = await getDb()
    .select()
    .from(canonicalEvents)
    .where(opts.after ? and(latam, gte(canonicalEvents.startAt, opts.after)) : latam)
    .orderBy(asc(canonicalEvents.startAt));
  return rows.map(rowToEvent);
}
