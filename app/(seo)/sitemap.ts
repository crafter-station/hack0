import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://hack0.dev";

	const [allEvents, allCommunities] = await Promise.all([
		db
			.select({
				shortCode: events.shortCode,
				updatedAt: events.updatedAt,
				eventImageUrl: events.eventImageUrl,
			})
			.from(events)
			.where(eq(events.isApproved, true)),
		db
			.select({
				slug: organizations.slug,
				updatedAt: organizations.updatedAt,
				logoUrl: organizations.logoUrl,
			})
			.from(organizations)
			.where(
				and(
					eq(organizations.isPublic, true),
					eq(organizations.isPersonalOrg, false),
				),
			),
	]);

	const eventUrls = allEvents
		.filter((event) => event.shortCode)
		.map((event) => ({
			url: `${baseUrl}/e/${event.shortCode}`,
			lastModified: event.updatedAt || new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
			images: event.eventImageUrl ? [event.eventImageUrl] : [],
		}));

	const communityUrls = allCommunities.map((org) => ({
		url: `${baseUrl}/c/${org.slug}`,
		lastModified: org.updatedAt || new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.7,
		images: org.logoUrl ? [org.logoUrl] : [],
	}));

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/events`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/c`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/roadmap`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.5,
		},
		...eventUrls,
		...communityUrls,
	];
}
