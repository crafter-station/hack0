import type { Event } from "@/lib/db/schema";

export const SOURCE_COLORS: Record<string, string> = {
	devpost: "bg-red-500/10 text-red-600",
	meetup: "bg-purple-500/10 text-purple-600",
	eventbrite: "bg-orange-500/10 text-orange-600",
	mlh: "bg-blue-500/10 text-blue-600",
	linkedin: "bg-sky-500/10 text-sky-600",
	perplexity: "bg-green-500/10 text-green-600",
	exa: "bg-indigo-500/10 text-indigo-600",
	haiku: "bg-amber-500/10 text-amber-600",
	universities: "bg-cyan-500/10 text-cyan-600",
	social: "bg-gray-500/10 text-gray-600",
	hackathon_com: "bg-violet-500/10 text-violet-600",
	websearch: "bg-teal-500/10 text-teal-600",
};

const REQUIRED_FIELDS: { key: keyof Event; label: string }[] = [
	{ key: "name", label: "nombre" },
	{ key: "startDate", label: "fecha inicio" },
	{ key: "endDate", label: "fecha fin" },
	{ key: "country", label: "país" },
	{ key: "city", label: "ciudad" },
	{ key: "eventType", label: "tipo" },
	{ key: "format", label: "formato" },
	{ key: "description", label: "desc" },
	{ key: "eventImageUrl", label: "imagen" },
	{ key: "websiteUrl", label: "URL" },
	{ key: "prizePool", label: "premio" },
];

export function getMissingFields(event: Event): string[] {
	return REQUIRED_FIELDS.filter((f) => {
		const val = event[f.key];
		return val === null || val === undefined || val === "" || val === 0;
	}).map((f) => f.label);
}
