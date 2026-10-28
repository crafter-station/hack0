import type { CalendarEvent } from "@/lib/calendar";
import type { canonicalEvents } from "@/lib/db/schema";
import { splitCity } from "@/lib/page-keys";

type Row = typeof canonicalEvents.$inferSelect;

export function rowToEvent(row: Row): CalendarEvent {
  const { city } = splitCity(row.city);
  const online = row.isOnline === true;
  return {
    id: row.lumaEventId ?? row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt?.toISOString() ?? null,
    timezone: row.timezone ?? "America/Lima",
    city: city ? [city, row.countryCode].filter(Boolean).join(", ") : null,
    country: row.countryCode,
    metro: row.metro,
    address: row.venueAddress,
    online,
    coverUrl: row.coverUrl,
    location: row.latitude !== null && row.longitude !== null ? [row.latitude, row.longitude] : null,
    tags: row.tags,
  };
}
