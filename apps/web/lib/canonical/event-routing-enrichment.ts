import { franc } from "franc-min";
import type { CanonicalBaseEvent, EventEnrichment } from "./canonical-events";

const COUNTRY_HINTS: Array<[string, string[]]> = [
  ["AR", ["argentina", "buenos aires", "cordoba", "mendoza", "rosario", "salta"]],
  ["BO", ["bolivia", "la paz", "santa cruz de la sierra", "cochabamba"]],
  ["BR", ["brasil", "brazil", "sao paulo", "rio de janeiro", "porto alegre"]],
  ["CL", ["chile", "santiago de chile", "valparaiso"]],
  ["CO", ["colombia", "bogota", "medellin", "barranquilla", "cali", "cartagena"]],
  ["CR", ["costa rica", "san jose costa rica"]],
  ["CU", ["cuba", "la habana", "havana"]],
  ["DO", ["republica dominicana", "dominican republic", "santo domingo"]],
  ["EC", ["ecuador", "quito", "guayaquil"]],
  ["GT", ["guatemala", "ciudad de guatemala", "guatemala city"]],
  ["HN", ["honduras", "tegucigalpa", "san pedro sula"]],
  ["HT", ["haiti", "port au prince"]],
  ["MX", ["mexico", "ciudad de mexico", "mexico city", "guadalajara", "monterrey", "merida"]],
  ["NI", ["nicaragua", "managua"]],
  ["PA", ["panama", "ciudad de panama", "panama city"]],
  ["PE", ["peru", "lima", "arequipa", "cusco", "trujillo"]],
  ["PR", ["puerto rico", "san juan puerto rico"]],
  ["PY", ["paraguay", "asuncion"]],
  ["SV", ["el salvador", "san salvador"]],
  ["UY", ["uruguay", "montevideo"]],
  ["VE", ["venezuela", "caracas", "maracaibo"]],
];

const LANGUAGE_CODES: Record<string, string> = {
  eng: "en",
  por: "pt",
  spa: "es",
};

const LANGUAGE_NAMES: Record<string, string> = {
  english: "en",
  ingles: "en",
  en: "en",
  es: "es",
  espanol: "es",
  portuguese: "pt",
  portugues: "pt",
  pt: "pt",
  spanish: "es",
};

const SPANISH_MARKERS = new Set([
  "asi",
  "como",
  "con",
  "construir",
  "construye",
  "creando",
  "datos",
  "desarrollo",
  "desde",
  "evento",
  "hacia",
  "inteligencia",
  "para",
  "pasos",
  "primer",
  "primeros",
  "produccion",
  "proximo",
  "taller",
  "tecnologia",
  "virtual",
]);

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

export function inferRoutingCountryCode(...values: Array<string | null | undefined>): string | null {
  const text = normalizeText(values.filter(Boolean).join(" "));
  if (!text) return null;
  for (const [countryCode, hints] of COUNTRY_HINTS) {
    if (hints.some((hint) => containsPhrase(text, hint))) return countryCode;
  }
  return null;
}

function inferLanguageCode(name: string, description?: string | null): string | null {
  const text = normalizeText([name, description].filter(Boolean).join(" "));
  if (!text) return null;
  const words = text.split(" ");
  const spanishMarkers = words.filter((word) => SPANISH_MARKERS.has(word)).length;
  if (spanishMarkers >= 2) return "es";
  if (text.length < 40) return null;
  const detected = franc(text, {
    minLength: 20,
    only: Object.keys(LANGUAGE_CODES),
  });
  return LANGUAGE_CODES[detected] ?? null;
}

function onlineSignal(...values: Array<string | null | undefined>): boolean {
  const text = normalizeText(values.filter(Boolean).join(" "));
  return /\b(online|virtual|remoto|remota|remote|webinar|en linea)\b/.test(text);
}

function normalizedCountryCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function normalizedLanguageCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  const languageName = LANGUAGE_NAMES[normalizeText(normalized)];
  if (languageName) return languageName;
  return /^[a-z]{2,3}(?:-[a-z]{2})?$/.test(normalized) ? normalized : null;
}

type Signals = { sources: Record<string, string>; confidences: number[] };
type RoutingInput = {
  event: Pick<CanonicalBaseEvent, "name" | "description" | "city" | "enrichment">;
  calendarNames?: string[];
};

/** Country from the provider, else the first text that names one, most reliable first. */
function routeCountry(input: RoutingInput, existing: EventEnrichment, calendarText: string, signals: Signals): string | null {
  const provided = normalizedCountryCode(existing.countryCode);
  if (provided) {
    signals.sources.countryCode ??= "provider";
    return provided;
  }
  const candidates: [string, number, Array<string | null | undefined>][] = [
    ["event_location", 0.95, [input.event.city, existing.region, existing.venueName, existing.venueAddress]],
    ["event_title", 0.75, [input.event.name]],
    ["event_description", 0.5, [input.event.description]],
    ["calendar_name", 0.6, [calendarText]],
  ];
  for (const [source, confidence, texts] of candidates) {
    const code = inferRoutingCountryCode(...texts);
    if (!code) continue;
    signals.sources.countryCode = source;
    signals.confidences.push(confidence);
    return code;
  }
  return null;
}

function routeLanguage(input: RoutingInput, existing: EventEnrichment, signals: Signals): string | null {
  const provided = normalizedLanguageCode(existing.languageCode);
  if (provided) {
    signals.sources.languageCode ??= "provider";
    return provided;
  }
  const inferred = inferLanguageCode(input.event.name, input.event.description);
  if (inferred) {
    signals.sources.languageCode = "event_text";
    signals.confidences.push(0.8);
  }
  return inferred;
}

function routeOnline(input: RoutingInput, existing: EventEnrichment, signals: Signals): boolean | null {
  if (typeof existing.isOnline === "boolean") {
    signals.sources.isOnline ??= "provider";
    return existing.isOnline;
  }
  const { name, description, city } = input.event;
  if (onlineSignal(name, description, city, existing.format, existing.venueName)) {
    signals.sources.isOnline = "event_text";
    signals.confidences.push(0.85);
    return true;
  }
  if (signals.sources.countryCode === "event_location" || existing.venueAddress || city) {
    signals.sources.isOnline = "event_location";
    signals.confidences.push(0.85);
    return false;
  }
  return null;
}

function routeFormat(existing: EventEnrichment, isOnline: boolean | null, signals: Signals): string | null {
  const provided = existing.format?.trim();
  if (provided || isOnline === null) return provided || null;
  signals.sources.format = signals.sources.isOnline ?? (isOnline ? "event_text" : "event_location");
  return isOnline ? "online" : "in_person";
}

function combinedConfidence(provided: number | null | undefined, inferred: number[]): number | null {
  const lowest = inferred.length > 0 ? Math.min(...inferred) : null;
  if (provided === null || provided === undefined) return lowest;
  return lowest === null ? provided : Math.min(provided, lowest);
}

export function enrichEventForRouting(input: RoutingInput): EventEnrichment {
  const existing = input.event.enrichment ?? {};
  const signals: Signals = { sources: { ...(existing.sources ?? {}) }, confidences: [] };
  const calendarText = (input.calendarNames ?? []).join(" ");

  const countryCode = routeCountry(input, existing, calendarText, signals);
  let region = existing.region?.trim() || null;
  if (!region && /\b(latam|latin america|latinoamerica)\b/i.test(calendarText)) {
    region = "LATAM";
    signals.sources.region = "calendar_name";
    signals.confidences.push(0.55);
  }
  const languageCode = routeLanguage(input, existing, signals);
  const isOnline = routeOnline(input, existing, signals);
  const format = routeFormat(existing, isOnline, signals);
  const languages = [...new Set([...(existing.languages ?? []), ...(languageCode ? [languageCode] : [])])];

  return {
    ...existing,
    countryCode,
    region,
    languageCode,
    languages,
    isOnline,
    format,
    confidence: combinedConfidence(existing.confidence, signals.confidences),
    sources: signals.sources,
  };
}
