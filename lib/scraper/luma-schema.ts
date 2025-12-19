export const lumaEventSchema = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "The event title/name",
		},
		description: {
			type: "string",
			description: "The event description",
		},
		startDate: {
			type: "string",
			description: "Start date and time in ISO 8601 format",
		},
		endDate: {
			type: "string",
			description: "End date and time in ISO 8601 format",
		},
		location: {
			type: "object",
			properties: {
				venue: {
					type: "string",
					description: "Venue name (e.g., Universidad Tecnológica del Perú)",
				},
				address: {
					type: "string",
					description: "Full address",
				},
				city: {
					type: "string",
					description: "City name (e.g., Lima)",
				},
				country: {
					type: "string",
					description: "Country name or code",
				},
				isVirtual: {
					type: "boolean",
					description: "Whether the event is virtual/online",
				},
			},
		},
		imageUrl: {
			type: "string",
			description: "Event banner/cover image URL",
		},
		organizerName: {
			type: "string",
			description: "Name of the main organizer or host",
		},
		registrationUrl: {
			type: "string",
			description: "URL for event registration",
		},
		price: {
			type: "string",
			description: "Ticket price (e.g., 'Free', '$10 USD')",
		},
		eventType: {
			type: "string",
			description:
				"Type of event: meetup, hackathon, conference, workshop, etc.",
		},
	},
	required: ["name", "startDate"],
};

export interface LumaExtractedData {
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	location?: {
		venue?: string;
		address?: string;
		city?: string;
		country?: string;
		isVirtual?: boolean;
	};
	imageUrl?: string;
	organizerName?: string;
	registrationUrl?: string;
	price?: string;
	eventType?: string;
}

export function isLumaUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return (
			parsed.hostname === "lu.ma" ||
			parsed.hostname === "www.lu.ma" ||
			parsed.hostname === "luma.com" ||
			parsed.hostname === "www.luma.com"
		);
	} catch {
		return false;
	}
}

export function normalizeLumaUrl(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.hostname === "lu.ma" || parsed.hostname === "www.lu.ma") {
			parsed.hostname = "luma.com";
		}
		parsed.searchParams.delete("locale");
		return parsed.toString();
	} catch {
		return url;
	}
}

export function inferEventType(name: string, description?: string): string {
	const text = `${name} ${description || ""}`.toLowerCase();

	if (text.includes("hackathon") || text.includes("hackatón"))
		return "hackathon";
	if (
		text.includes("meetup") ||
		text.includes("meet up") ||
		text.includes("meet-up")
	)
		return "meetup";
	if (text.includes("workshop") || text.includes("taller")) return "workshop";
	if (
		text.includes("conference") ||
		text.includes("conferencia") ||
		text.includes("congreso")
	)
		return "conference";
	if (text.includes("bootcamp") || text.includes("boot camp"))
		return "bootcamp";
	if (text.includes("networking")) return "networking";
	if (text.includes("webinar") || text.includes("seminario")) return "seminar";
	if (text.includes("curso") || text.includes("course")) return "course";

	return "meetup";
}

export function inferCountryFromCity(city?: string): string {
	if (!city) return "PE";

	const cityLower = city.toLowerCase();

	const peruCities = [
		"lima",
		"arequipa",
		"cusco",
		"trujillo",
		"chiclayo",
		"piura",
		"ica",
		"tacna",
		"huancayo",
	];
	if (peruCities.some((c) => cityLower.includes(c))) return "PE";

	const mexicoCities = [
		"ciudad de méxico",
		"cdmx",
		"guadalajara",
		"monterrey",
		"puebla",
		"tijuana",
	];
	if (mexicoCities.some((c) => cityLower.includes(c))) return "MX";

	const colombiaCities = [
		"bogotá",
		"medellín",
		"cali",
		"barranquilla",
		"cartagena",
	];
	if (colombiaCities.some((c) => cityLower.includes(c))) return "CO";

	const argentinaCities = ["buenos aires", "córdoba", "rosario", "mendoza"];
	if (argentinaCities.some((c) => cityLower.includes(c))) return "AR";

	const chileCities = ["santiago", "valparaíso", "concepción"];
	if (chileCities.some((c) => cityLower.includes(c))) return "CL";

	const brazilCities = [
		"são paulo",
		"rio de janeiro",
		"brasília",
		"salvador",
		"fortaleza",
	];
	if (brazilCities.some((c) => cityLower.includes(c))) return "BR";

	return "PE";
}
