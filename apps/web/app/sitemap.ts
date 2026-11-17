import type { MetadataRoute } from "next";
import { communityIndex, hubIndex, sitemapEvents } from "@/lib/catalog";
import { cityPlaces, countryPath, listedOrgs, ORG_TYPES } from "@/lib/ecosistema";
import { SITE } from "@/lib/site";
import { PIECES, pieceHref } from "./taste-hacking/pieces";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, cities, tags, communities, orgs] = await Promise.all([
    sitemapEvents(),
    hubIndex("ciudad"),
    hubIndex("tema"),
    communityIndex(),
    listedOrgs(),
  ]);
  const countries = [...new Set(orgs.map((o) => o.country))];
  const eco = countries.flatMap((code) => {
    const list = orgs.filter((o) => o.country === code);
    const base = countryPath(code);
    return [
      base,
      ...ORG_TYPES.filter((t) => list.some((o) => o.type === t.type)).map((t) => `${base}/${t.segment}`),
      ...cityPlaces(list).map((c) => `${base}/${c.slug}`),
    ];
  });
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/eventos`, changeFrequency: "daily", priority: 0.9 },
    ...cities.map((h) => ({ url: `${SITE}/ciudad/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE}/comunidades`, changeFrequency: "weekly", priority: 0.8 },
    ...communities.map((c) => ({ url: `${SITE}/comunidades/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tags.map((h) => ({ url: `${SITE}/tema/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...events.map((e) => ({ url: `${SITE}/eventos/${e.slug}`, lastModified: e.lastModified, priority: 0.8 })),
    { url: `${SITE}/ecosistema`, changeFrequency: "weekly", priority: 0.8 },
    ...eco.map((path) => ({ url: `${SITE}${path}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    // Branches defer to their brand's profile, so only brands and standalone orgs are submitted.
    ...orgs.filter((o) => !o.parentSlug).map((o) => ({ url: `${SITE}/org/${o.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/taste-hacking`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/taste-hacking/vocabulario`, changeFrequency: "weekly", priority: 0.8 },
    ...PIECES.map((p) => ({ url: `${SITE}${pieceHref(p)}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${SITE}/brand`, priority: 0.3 },
  ];
}
