import { LATAM_CITIES, LATAM_COUNTRY_NAMES } from "@/lib/scraper/latam-filter";

export interface InferredLatamLocation {
	country: string;
	city: string | null;
}

function normalizeLocationText(value: string) {
	return ` ${value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim()} `;
}

function formatCityName(value: string) {
	const lowercaseWords = new Set(["de", "del", "la", "las", "los"]);
	return value
		.split(" ")
		.map((word, index) => {
			if (index > 0 && lowercaseWords.has(word)) return word;
			return `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`;
		})
		.join(" ");
}

const LATAM_PLACES = [
	...Object.entries(LATAM_CITIES).map(([name, country]) => ({
		name,
		country,
		city: formatCityName(name),
	})),
	...Object.entries(LATAM_COUNTRY_NAMES).map(([name, country]) => ({
		name,
		country,
		city: null,
	})),
].sort((left, right) => right.name.length - left.name.length);

export function inferLatamLocationFromText(
	...values: Array<string | null | undefined>
): InferredLatamLocation | null {
	const haystack = normalizeLocationText(values.filter(Boolean).join(" "));
	if (haystack.trim().length === 0) return null;

	for (const place of LATAM_PLACES) {
		if (haystack.includes(normalizeLocationText(place.name))) {
			return { country: place.country, city: place.city };
		}
	}

	return null;
}
