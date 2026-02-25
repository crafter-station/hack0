import { formatDistanceToNow, isAfter, isBefore, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { format as formatTz, toZonedTime } from "date-fns-tz";

export const PERU_TIMEZONE = "America/Lima";
export const DEFAULT_TIMEZONE = PERU_TIMEZONE;

import {
	DOMAIN_LABELS,
	EVENT_TYPE_LABELS,
	type FORMATS,
	ORGANIZER_TYPE_LABELS,
	type SKILL_LEVELS,
	type STATUSES,
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

const FORMAT_LABELS: Record<(typeof FORMATS)[number], string> = {
	virtual: "Virtual",
	"in-person": "Presencial",
	hybrid: "Híbrido",
};

const SKILL_LEVEL_LABELS: Record<(typeof SKILL_LEVELS)[number], string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
	all: "Todos los niveles",
};

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
	upcoming: "Próximamente",
	open: "Abierto",
	ongoing: "En curso",
	ended: "Terminado",
};

export function getFormatLabel(
	format: string | null,
	department?: string | null,
): string {
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

export function getOrganizerTypeLabel(
	organizerType: string | null,
): string | null {
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
// DATE FORMATTING (timezone-aware, defaults to event timezone or Peru)
// =============================================================================

function toEventTime(
	date: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): Date | null {
	if (!date) return null;
	return toZonedTime(new Date(date), tz);
}

export function formatEventDate(
	date: Date | null,
	formatStr = "d MMM yyyy",
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, formatStr, { locale: es, timeZone: tz });
}

export function formatEventDateShort(
	date: Date | null,
	tz?: string,
): string | null {
	return formatEventDate(date, "d MMM", tz);
}

export function formatEventTime(
	date: Date | null,
	formatStr = "h:mm a",
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, formatStr, { locale: es, timeZone: tz });
}

export function formatEventDateTime(
	date: Date | null,
	formatStr = "d MMM yyyy, h:mm a",
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, formatStr, { locale: es, timeZone: tz });
}

export function formatEventDateFull(
	date: Date | null,
	formatStr = "EEEE, d 'de' MMMM",
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, formatStr, { locale: es, timeZone: tz });
}

export function formatEventMonth(
	date: Date | null,
	formatStr = "MMM",
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, formatStr, { locale: es, timeZone: tz });
}

export function formatEventDay(
	date: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, "d", { locale: es, timeZone: tz });
}

export function formatEventDateSmart(
	date: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;

	const currentYear = new Date().getFullYear();
	const eventYear = zonedDate.getFullYear();

	if (eventYear !== currentYear) {
		return formatTz(zonedDate, "d MMM yyyy", { locale: es, timeZone: tz });
	}
	return formatTz(zonedDate, "d MMM", { locale: es, timeZone: tz });
}

export function formatEventDateRange(
	startDate: Date | null,
	endDate: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!startDate) return null;

	const start = toEventTime(startDate, tz);
	const end = endDate ? toEventTime(endDate, tz) : null;
	if (!start) return null;

	const currentYear = new Date().getFullYear();
	const startYear = start.getFullYear();

	if (!end) {
		return formatEventDateSmart(startDate, tz);
	}

	if (isSameDay(start, end)) {
		return formatEventDateSmart(startDate, tz);
	}

	const endYear = end.getFullYear();

	if (startYear !== endYear) {
		return `${formatTz(start, "d MMM yyyy", { locale: es, timeZone: tz })} – ${formatTz(end, "d MMM yyyy", { locale: es, timeZone: tz })}`;
	}

	if (startYear !== currentYear) {
		return `${formatTz(start, "d MMM", { locale: es, timeZone: tz })} – ${formatTz(end, "d MMM yyyy", { locale: es, timeZone: tz })}`;
	}

	return `${formatTz(start, "d MMM", { locale: es, timeZone: tz })} – ${formatTz(end, "d MMM", { locale: es, timeZone: tz })}`;
}

export function formatEventDateRangeWithDay(
	startDate: Date | null,
	endDate: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!startDate) return null;

	const start = toEventTime(startDate, tz);
	const end = endDate ? toEventTime(endDate, tz) : null;
	if (!start) return null;

	if (!end || isSameDay(start, end)) {
		return formatEventDateFull(startDate, undefined, tz);
	}

	return `${formatTz(start, "EEEE, d 'de' MMMM", { locale: es, timeZone: tz })} – ${formatTz(end, "d 'de' MMMM", { locale: es, timeZone: tz })}`;
}

export function formatRelativeDate(date: Date | null): string | null {
	if (!date) return null;
	return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function isDateInFuture(date: Date | null): boolean {
	if (!date) return false;
	return isAfter(new Date(date), new Date());
}

export function getEventDate(
	date: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): Date | null {
	return toEventTime(date, tz);
}

export function getPeruDate(date: Date | null): Date | null {
	return toEventTime(date, PERU_TIMEZONE);
}

export function formatEventDateKey(
	date: Date | null,
	tz: string = DEFAULT_TIMEZONE,
): string | null {
	if (!date) return null;
	const zonedDate = toEventTime(date, tz);
	if (!zonedDate) return null;
	return formatTz(zonedDate, "yyyy-MM-dd", { timeZone: tz });
}

export function formatCalendarMonth(
	date: Date,
	formatStr = "MMMM yyyy",
	tz: string = DEFAULT_TIMEZONE,
): string {
	return formatTz(date, formatStr, { locale: es, timeZone: tz });
}

export function getTimezoneAbbreviation(tz: string): string {
	const TIMEZONE_ABBRS: Record<string, string> = {
		"America/Lima": "PET",
		"America/Bogota": "COT",
		"America/Mexico_City": "CST",
		"America/Guatemala": "CST",
		"America/Argentina/Buenos_Aires": "ART",
		"America/Santiago": "CLT",
		"America/Sao_Paulo": "BRT",
		"America/Guayaquil": "ECT",
		"America/Caracas": "VET",
		"America/Panama": "EST",
		"America/Asuncion": "PYT",
		"America/Montevideo": "UYT",
		"America/La_Paz": "BOT",
		"America/Costa_Rica": "CST",
		"America/Managua": "CST",
		"America/Tegucigalpa": "CST",
		"America/El_Salvador": "CST",
		"America/Santo_Domingo": "AST",
		"America/Havana": "CST",
	};
	return TIMEZONE_ABBRS[tz] || tz.split("/").pop()?.replace(/_/g, " ") || tz;
}

// =============================================================================
// FILTER OPTIONS (for dropdowns)
// =============================================================================

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(
	([value, label]) => ({ value, label }),
);

export const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(
	([value, label]) => ({ value, label }),
);

export const SKILL_LEVEL_OPTIONS = Object.entries(SKILL_LEVEL_LABELS).map(
	([value, label]) => ({ value, label }),
);

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
	([value, label]) => ({ value, label }),
);

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES).map(
	([code, name]) => ({ value: code, label: `${getCountryFlag(code)} ${name}` }),
);

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
	([value, label]) => ({ value, label }),
);

// =============================================================================
// DOMAIN OPTIONS
// =============================================================================

export const DOMAIN_OPTIONS = Object.entries(DOMAIN_LABELS).map(
	([value, label]) => ({ value, label }),
);
