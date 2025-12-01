import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://hack0.dev";

	// Get all events for dynamic pages
	const allEvents = await db
		.select({
			slug: events.slug,
			updatedAt: events.updatedAt,
		})
		.from(events);

	const eventUrls = allEvents.map((event) => ({
		url: `${baseUrl}/${event.slug}`,
		lastModified: event.updatedAt || new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.8,
	}));

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/submit`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		...eventUrls,
	];
}
