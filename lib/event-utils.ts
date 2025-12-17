import { format, formatDistanceToNow, isAfter, isBefore, isSameDay } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";

export const PERU_TIMEZONE = "America/Lima";
import {
  EVENT_TYPE_LABELS,
  ORGANIZER_TYPE_LABELS,
  DOMAIN_LABELS,
  FORMATS,
  SKILL_LEVELS,
  STATUSES,
} from "@/lib/db/schema";

// =============================================================================
// STATUS
// =============================================================================

export type EventStatus = "ended" | "ongoing" | "open" | "upcoming";

export interface EventStatusInfo {
  status: EventStatus;
  label: string;
  dotClass: string;
}

export function getEventStatus(event: {
  startDate: Date | null;
  endDate: Date | null;
  registrationDeadline: Date | null;
}): EventStatusInfo {
  const now = new Date();
  const start = event.startDate ? new Date(event.startDate) : null;
  const end = event.endDate ? new Date(event.endDate) : null;
  const deadline = event.registrationDeadline
    ? new Date(event.registrationDeadline)
    : null;

  if (end && isBefore(end, now)) {
    return {
      status: "ended",
      label: "Terminado",
      dotClass: "bg-muted-foreground/50",
    };
  }
  if (start && isBefore(start, now) && end && isAfter(end, now)) {
    return {
      status: "ongoing",
      label: "En curso",
      dotClass: "bg-foreground",
    };
  }
  if (deadline && isAfter(deadline, now)) {
    return {
      status: "open",
      label: "Abierto",
      dotClass: "bg-foreground",
    };
  }
  return {
    status: "upcoming",
    label: "Próximamente",
    dotClass: "bg-muted-foreground",
  };
}

// =============================================================================
// LABELS
// =============================================================================

const FORMAT_LABELS: Record<typeof FORMATS[number], string> = {
  virtual: "Virtual",
  "in-person": "Presencial",
  hybrid: "Híbrido",
};

const SKILL_LEVEL_LABELS: Record<typeof SKILL_LEVELS[number], string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  all: "Todos los niveles",
};

const STATUS_LABELS: Record<typeof STATUSES[number], string> = {
  upcoming: "Próximamente",
  open: "Abierto",
  ongoing: "En curso",
  ended: "Terminado",
};

export function getFormatLabel(format: string | null, department?: string | null): string {
  if (format === "in-person" && department) {
    return department;
  }
  return FORMAT_LABELS[format || "virtual"] || "Virtual";
}

export function getSkillLevelLabel(level: string | null): string {
  return SKILL_LEVEL_LABELS[level || "all"] || "Todos los niveles";
}

export function getEventTypeLabel(eventType: string | null): string {
  if (!eventType) return "Hackathon";
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

export function getOrganizerTypeLabel(organizerType: string | null): string | null {
  if (!organizerType) return null;
  return ORGANIZER_TYPE_LABELS[organizerType] || organizerType;
}

export function getDomainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] || domain;
}

export function isEventJuniorFriendly(skillLevel: string | null): boolean {
  return skillLevel === "beginner" || skillLevel === "all";
}

// =============================================================================
// COUNTRY
// =============================================================================

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  DO: "República Dominicana",
  EC: "Ecuador",
  SV: "El Salvador",
  GT: "Guatemala",
  HN: "Honduras",
  MX: "México",
  NI: "Nicaragua",
  PA: "Panamá",
  PY: "Paraguay",
  PE: "Perú",
  PR: "Puerto Rico",
  UY: "Uruguay",
  VE: "Venezuela",
  GLOBAL: "Global",
};

export function getCountryName(code: string | null): string {
  if (!code || code === "GLOBAL") return "Global";
  return COUNTRY_NAMES[code] || code;
}

export function getCountryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode === "GLOBAL") return "🌎";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// =============================================================================
// DATE FORMATTING (with Peru timezone support)
// =============================================================================

function toPeruTime(date: Date | null): Date | null {
  if (!date) return null;
  return toZonedTime(new Date(date), PERU_TIMEZONE);
}

export function formatEventDate(date: Date | null, formatStr = "d MMM yyyy"): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

export function formatEventDateShort(date: Date | null): string | null {
  return formatEventDate(date, "d MMM");
}

export function formatEventTime(date: Date | null, formatStr = "h:mm a"): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

export function formatEventDateTime(date: Date | null, formatStr = "d MMM yyyy, h:mm a"): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

export function formatEventDateFull(date: Date | null, formatStr = "EEEE, d 'de' MMMM"): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

export function formatEventMonth(date: Date | null, formatStr = "MMM"): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

export function formatEventDay(date: Date | null): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, "d", { locale: es, timeZone: PERU_TIMEZONE });
}

/**
 * Smart date formatting - shows year only when needed:
 * - If the event is NOT in the current year
 * - Always shows year for past events in different years
 */
export function formatEventDateSmart(date: Date | null): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;

  const currentYear = new Date().getFullYear();
  const eventYear = peruDate.getFullYear();

  if (eventYear !== currentYear) {
    return formatTz(peruDate, "d MMM yyyy", { locale: es, timeZone: PERU_TIMEZONE });
  }
  return formatTz(peruDate, "d MMM", { locale: es, timeZone: PERU_TIMEZONE });
}

/**
 * Format a date range smartly:
 * - If both dates are in the same year and it's the current year: "20 sep – 22 sep"
 * - If dates span different years: "28 dic 2024 – 5 ene 2025"
 * - If both in same non-current year: "20 sep – 22 sep 2025"
 */
export function formatEventDateRange(
  startDate: Date | null,
  endDate: Date | null
): string | null {
  if (!startDate) return null;

  const start = toPeruTime(startDate);
  const end = endDate ? toPeruTime(endDate) : null;
  if (!start) return null;

  const currentYear = new Date().getFullYear();
  const startYear = start.getFullYear();

  if (!end) {
    return formatEventDateSmart(startDate);
  }

  if (isSameDay(start, end)) {
    return formatEventDateSmart(startDate);
  }

  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${formatTz(start, "d MMM yyyy", { locale: es, timeZone: PERU_TIMEZONE })} – ${formatTz(end, "d MMM yyyy", { locale: es, timeZone: PERU_TIMEZONE })}`;
  }

  if (startYear !== currentYear) {
    return `${formatTz(start, "d MMM", { locale: es, timeZone: PERU_TIMEZONE })} – ${formatTz(end, "d MMM yyyy", { locale: es, timeZone: PERU_TIMEZONE })}`;
  }

  return `${formatTz(start, "d MMM", { locale: es, timeZone: PERU_TIMEZONE })} – ${formatTz(end, "d MMM", { locale: es, timeZone: PERU_TIMEZONE })}`;
}

export function formatEventDateRangeWithDay(
  startDate: Date | null,
  endDate: Date | null
): string | null {
  if (!startDate) return null;

  const start = toPeruTime(startDate);
  const end = endDate ? toPeruTime(endDate) : null;
  if (!start) return null;

  if (!end || isSameDay(start, end)) {
    return formatEventDateFull(startDate);
  }

  return `${formatTz(start, "EEEE, d 'de' MMMM", { locale: es, timeZone: PERU_TIMEZONE })} – ${formatTz(end, "d 'de' MMMM", { locale: es, timeZone: PERU_TIMEZONE })}`;
}

export function formatRelativeDate(date: Date | null): string | null {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function isDateInFuture(date: Date | null): boolean {
  if (!date) return false;
  return isAfter(new Date(date), new Date());
}

export function getPeruDate(date: Date | null): Date | null {
  return toPeruTime(date);
}

export function formatEventDateKey(date: Date | null): string | null {
  if (!date) return null;
  const peruDate = toPeruTime(date);
  if (!peruDate) return null;
  return formatTz(peruDate, "yyyy-MM-dd", { timeZone: PERU_TIMEZONE });
}

export function formatCalendarMonth(date: Date, formatStr = "MMMM yyyy"): string {
  return formatTz(date, formatStr, { locale: es, timeZone: PERU_TIMEZONE });
}

// =============================================================================
// FILTER OPTIONS (for dropdowns)
// =============================================================================

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const SKILL_LEVEL_OPTIONS = Object.entries(SKILL_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// For now, only Peru and Global are shown in filters
// The schema still supports all LATAM countries for future expansion
export const COUNTRY_OPTIONS = [
  { value: "PE", label: "🇵🇪 Perú" },
  { value: "GLOBAL", label: "🌎 Global" },
];

// Peru departments/regions for filtering
export const DEPARTMENT_OPTIONS = [
  { value: "Lima", label: "Lima" },
  { value: "Arequipa", label: "Arequipa" },
  { value: "Cusco", label: "Cusco" },
  { value: "La Libertad", label: "La Libertad" },
  { value: "Lambayeque", label: "Lambayeque" },
  { value: "Piura", label: "Piura" },
  { value: "Junín", label: "Junín" },
  { value: "Puno", label: "Puno" },
  { value: "Huánuco", label: "Huánuco" },
  { value: "Ica", label: "Ica" },
  { value: "Ayacucho", label: "Ayacucho" },
  { value: "Ancash", label: "Ancash" },
  { value: "Loreto", label: "Loreto" },
  { value: "Cajamarca", label: "Cajamarca" },
  { value: "San Martín", label: "San Martín" },
  { value: "Tacna", label: "Tacna" },
  { value: "Ucayali", label: "Ucayali" },
  { value: "Amazonas", label: "Amazonas" },
  { value: "Apurímac", label: "Apurímac" },
  { value: "Huancavelica", label: "Huancavelica" },
  { value: "Madre de Dios", label: "Madre de Dios" },
  { value: "Moquegua", label: "Moquegua" },
  { value: "Pasco", label: "Pasco" },
  { value: "Tumbes", label: "Tumbes" },
  { value: "Callao", label: "Callao" },
];

// =============================================================================
// ORGANIZER TYPE OPTIONS
// =============================================================================

export const ORGANIZER_TYPE_OPTIONS = Object.entries(ORGANIZER_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// =============================================================================
// DOMAIN OPTIONS
// =============================================================================

export const DOMAIN_OPTIONS = Object.entries(DOMAIN_LABELS).map(
  ([value, label]) => ({ value, label })
);
