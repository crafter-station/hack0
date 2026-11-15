export type WorkshopPhase = { phase: "before"; days: number; label: string } | { phase: "live" | "after"; label: string };

const DAY_MS = 86_400_000;

/** Calendar date as a day count, read in the zone the workshop is announced in. */
function dayNumber(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day")) / DAY_MS;
}

/** Where `now` falls around the workshop, with a short label in Spanish. Days are calendar days, not 24 h blocks. */
export function workshopPhase(now: Date, startAt: string, endAt: string, timeZone = "America/Lima"): WorkshopPhase {
  const start = new Date(startAt);
  if (now >= new Date(endAt)) return { phase: "after", label: "ya terminó" };
  if (now >= start) return { phase: "live", label: "en vivo ahora" };
  const days = dayNumber(start, timeZone) - dayNumber(now, timeZone);
  const label = days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`;
  return { phase: "before", days, label };
}
