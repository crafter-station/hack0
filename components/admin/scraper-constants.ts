import type { Event } from "@/lib/db/schema";

export const SOURCE_COLORS: Record<string, string> = {
	devpost: "bg-red-500/10 text-red-600",
	meetup: "bg-brand-forest/20 text-brand-green",
	eventbrite: "bg-orange-500/10 text-orange-600",
	mlh: "bg-brand-grid/10 text-brand-grid",
	linkedin: "bg-brand-grid/10 text-brand-grid",
	perplexity: "bg-brand-green/10 text-brand-green",
	exa: "bg-brand-forest/20 text-brand-grid",
	haiku: "bg-amber-500/10 text-amber-600",
	universities: "bg-brand-grid/10 text-brand-grid",
	social: "bg-brand-muted/10 text-brand-muted",
	hackathon_com: "bg-brand-forest/20 text-brand-green",
	websearch: "bg-brand-forest/20 text-brand-grid",
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
