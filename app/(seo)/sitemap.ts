import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://hack0.dev";

	const allEvents = await db
		.select({
			slug: events.slug,
			updatedAt: events.updatedAt,
			eventImageUrl: events.eventImageUrl,
			organizationSlug: organizations.slug,
		})
		.from(events)
		.leftJoin(organizations, eq(events.organizationId, organizations.id));

	const eventUrls = allEvents.map((event) => ({
		url: event.organizationSlug
			? `${baseUrl}/c/${event.organizationSlug}/events/${event.slug}`
			: `${baseUrl}/${event.slug}`,
		lastModified: event.updatedAt || new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.8,
		images: event.eventImageUrl ? [event.eventImageUrl] : [],
	}));

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		...eventUrls,
	];
}
