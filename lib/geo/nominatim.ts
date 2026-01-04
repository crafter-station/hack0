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
	name?: string;
	display_name: string;
	class?: string;
	type?: string;
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

export interface FormattedLocation {
	name: string;
	address: string | null;
}

export function formatDisplayName(result: NominatimResult): FormattedLocation {
	const addressParts: string[] = [];

	if (result.address.road) {
		addressParts.push(result.address.road);
	}
	if (result.address.neighbourhood || result.address.suburb) {
		addressParts.push(
			result.address.neighbourhood || result.address.suburb || "",
		);
	}

	const city = extractCity(result.address);
	if (city) {
		addressParts.push(city);
	}

	const department = extractDepartment(result.address);
	if (department && department !== city) {
		addressParts.push(department);
	}

	const fullAddress = addressParts.filter(Boolean).join(", ");

	if (result.name) {
		return {
			name: result.name,
			address: fullAddress || null,
		};
	}

	if (result.address.road) {
		return {
			name: result.address.road,
			address: addressParts.slice(1).filter(Boolean).join(", ") || null,
		};
	}

	return {
		name: fullAddress || result.display_name,
		address: null,
	};
}
