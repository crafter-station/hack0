import type { MetadataRoute } from "next";
import { hubIndex, sitemapEvents } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, cities, tags] = await Promise.all([sitemapEvents(), hubIndex("ciudad"), hubIndex("tema")]);
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/eventos`, changeFrequency: "daily", priority: 0.9 },
    ...cities.map((h) => ({ url: `${SITE}/ciudad/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tags.map((h) => ({ url: `${SITE}/tema/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...events.map((e) => ({ url: `${SITE}/eventos/${e.slug}`, lastModified: e.lastModified, priority: 0.8 })),
    { url: `${SITE}/brand`, priority: 0.3 },
  ];
}
