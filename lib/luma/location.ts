import { normalizeCountryCode } from "@/lib/event-utils";

type LumaGeoAddress = {
	city?: string | null;
	region?: string | null;
	country?: string | null;
	country_code?: string | null;
	address?: string | null;
	description?: string | null;
	full_address?: string | null;
	short_address?: string | null;
	city_state?: string | null;
	mode?: string | null;
	type?: string | null;
	latitude?: number | string | null;
	longitude?: number | string | null;
};

type LumaCoordinate = {
	latitude?: number | string | null;
	longitude?: number | string | null;
};

export type LumaLocationInput = {
	geoAddress?: LumaGeoAddress | null;
	geoAddressInfo?: LumaGeoAddress | null;
	coordinate?: LumaCoordinate | null;
	geoLatitude?: number | string | null;
	geoLongitude?: number | string | null;
	meetingUrl?: string | null;
	locationType?: string | null;
	countryFallback?: string | null;
};

export type LumaLocationResult = {
	format: "virtual" | "in-person" | "hybrid";
	country: string;
	department: string | null;
	city: string | null;
	venue: string | null;
	geoLatitude: string | null;
	geoLongitude: string | null;
};

const VIRTUAL_LOCATION_TYPES = new Set([
	"discord",
	"google_meet",
	"livestream",
	"meet",
	"online",
	"stream",
	"teams",
	"twitch",
	"virtual",
	"youtube",
	"zoom",
]);

const PHYSICAL_LOCATION_TYPES = new Set([
	"address",
	"manual",
	"offline",
	"physical",
	"shown",
	"venue",
]);

const PERU_PLACE_MATCHERS = [
	{
		city: "Lima",
		department: "Lima",
		patterns: [
			"barranco",
			"chorrillos",
			"jesus maria",
			"la molina",
			"lince",
			"lima",
			"magdalena",
			"miraflores",
			"pueblo libre",
			"san borja",
			"san isidro",
			"san miguel",
			"santiago de surco",
			"surco",
			"surquillo",
			"villa el salvador",
		],
	},
	{ city: "Callao", department: "Callao", patterns: ["callao"] },
	{ city: "Arequipa", department: "Arequipa", patterns: ["arequipa"] },
	{ city: "Cusco", department: "Cusco", patterns: ["cusco", "cuzco"] },
	{ city: "Trujillo", department: "La Libertad", patterns: ["trujillo"] },
	{ city: "Chiclayo", department: "Lambayeque", patterns: ["chiclayo"] },
	{ city: "Piura", department: "Piura", patterns: ["piura"] },
	{ city: "Huancayo", department: "Junín", patterns: ["huancayo"] },
	{ city: "Iquitos", department: "Loreto", patterns: ["iquitos"] },
	{ city: "Tacna", department: "Tacna", patterns: ["tacna"] },
];

function cleanText(value: string | null | undefined) {
	const text = value?.trim();
	return text ? text : null;
}

function normalizeToken(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function firstText(...values: Array<string | null | undefined>) {
	for (const value of values) {
		const text = cleanText(value);
		if (text) return text;
	}
	return null;
}

function coordinateValue(...values: Array<number | string | null | undefined>) {
	const value = values.find(
		(candidate) => candidate !== null && candidate !== undefined,
	);
	if (value === null || value === undefined) return null;
	return String(value);
}

function inferPeruPlace(...values: Array<string | null | undefined>) {
	const haystack = values
		.map((value) => (value ? normalizeToken(value) : ""))
		.filter(Boolean)
		.join(" ");

	if (!haystack) return null;

	for (const place of PERU_PLACE_MATCHERS) {
		if (place.patterns.some((pattern) => haystack.includes(pattern))) {
			return { city: place.city, department: place.department };
		}
	}

	return null;
}

function normalizeCity(
	value: string | null | undefined,
	fallback?: string | null,
) {
	const place = inferPeruPlace(value);
	return place?.city || cleanText(value) || fallback || null;
}

function normalizeDepartment(
	value: string | null | undefined,
	fallback?: string | null,
) {
	const place = inferPeruPlace(value);
	return place?.department || cleanText(value) || fallback || null;
}

function locationTypeFrom(
	input: LumaLocationInput,
	geo: LumaGeoAddress | null,
) {
	return normalizeToken(
		firstText(
			input.locationType,
			geo?.type,
			geo?.mode,
			input.geoAddressInfo?.mode,
		) || "",
	);
}

function resolveFormat(
	locationType: string,
	meetingUrl: string | null,
	hasPhysicalLocation: boolean,
): LumaLocationResult["format"] {
	const isVirtual =
		VIRTUAL_LOCATION_TYPES.has(locationType) || Boolean(meetingUrl);
	const isPhysical =
		hasPhysicalLocation || PHYSICAL_LOCATION_TYPES.has(locationType);

	if (isVirtual && isPhysical) return "hybrid";
	if (isVirtual) return "virtual";
	return "in-person";
}

export function resolveLumaEventLocation(
	input: LumaLocationInput,
): LumaLocationResult {
	const geo = input.geoAddress || input.geoAddressInfo || null;
	const venue = firstText(
		geo?.description,
		geo?.short_address,
		geo?.address,
		geo?.full_address,
	);
	const inferredPlace = inferPeruPlace(
		geo?.city,
		geo?.region,
		geo?.city_state,
		venue,
	);
	const city = normalizeCity(geo?.city, inferredPlace?.city);
	const department = normalizeDepartment(
		geo?.region,
		inferredPlace?.department,
	);
	const meetingUrl = cleanText(input.meetingUrl);
	const locationType = locationTypeFrom(input, geo);
	const hasPhysicalLocation = Boolean(venue || city || department);
	const country =
		normalizeCountryCode(geo?.country_code || geo?.country || null) ||
		input.countryFallback ||
		"PE";

	return {
		format: resolveFormat(locationType, meetingUrl, hasPhysicalLocation),
		country,
		department,
		city,
		venue,
		geoLatitude: coordinateValue(
			input.geoLatitude,
			geo?.latitude,
			input.coordinate?.latitude,
		),
		geoLongitude: coordinateValue(
			input.geoLongitude,
			geo?.longitude,
			input.coordinate?.longitude,
		),
	};
}
