import type { MetadataRoute } from "next";
import { communityIndex, hubIndex, sitemapEvents } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, cities, tags, communities] = await Promise.all([sitemapEvents(), hubIndex("ciudad"), hubIndex("tema"), communityIndex()]);
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/eventos`, changeFrequency: "daily", priority: 0.9 },
    ...cities.map((h) => ({ url: `${SITE}/ciudad/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE}/comunidades`, changeFrequency: "weekly", priority: 0.8 },
    ...communities.map((c) => ({ url: `${SITE}/comunidades/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tags.map((h) => ({ url: `${SITE}/tema/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...events.map((e) => ({ url: `${SITE}/eventos/${e.slug}`, lastModified: e.lastModified, priority: 0.8 })),
    { url: `${SITE}/brand`, priority: 0.3 },
  ];
}
