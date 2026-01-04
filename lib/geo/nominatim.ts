export interface NominatimAddress {
	city?: string;
	town?: string;
	village?: string;
	municipality?: string;
	county?: string;
	state?: string;
	region?: string;
	country?: string;
	country_code?: string;
	road?: string;
	neighbourhood?: string;
	suburb?: string;
}

export interface NominatimResult {
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	display_name: string;
	address: NominatimAddress;
	boundingbox: [string, string, string, string];
}

export async function searchLocation(
	query: string,
	options?: {
		limit?: number;
		countrycodes?: string;
	},
): Promise<NominatimResult[]> {
	if (!query || query.trim().length < 3) {
		return [];
	}

	const params = new URLSearchParams({
		q: query.trim(),
		format: "json",
		addressdetails: "1",
		limit: String(options?.limit ?? 5),
	});

	if (options?.countrycodes) {
		params.set("countrycodes", options.countrycodes);
	}

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?${params.toString()}`,
		{
			headers: {
				"User-Agent": "hack0.dev",
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		console.error("Nominatim API error:", response.status);
		return [];
	}

	return response.json();
}

export function extractCity(address: NominatimAddress): string {
	return (
		address.city ||
		address.town ||
		address.village ||
		address.municipality ||
		address.county ||
		""
	);
}

export function extractDepartment(address: NominatimAddress): string {
	return address.state || address.region || "";
}

export function formatDisplayName(result: NominatimResult): string {
	const parts: string[] = [];

	if (result.address.road) {
		parts.push(result.address.road);
	}
	if (result.address.neighbourhood || result.address.suburb) {
		parts.push(result.address.neighbourhood || result.address.suburb || "");
	}

	const city = extractCity(result.address);
	if (city) {
		parts.push(city);
	}

	const department = extractDepartment(result.address);
	if (department) {
		parts.push(department);
	}

	if (parts.length === 0) {
		return result.display_name;
	}

	return parts.filter(Boolean).join(", ");
}
