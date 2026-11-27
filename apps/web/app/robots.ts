import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const AI_SEARCH_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
      ...AI_SEARCH_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/api/", "/admin"] })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
