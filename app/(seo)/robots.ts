import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/admin/", "/sign-in", "/sign-up"],
			},
		],
		sitemap: "https://hack0.dev/sitemap.xml",
	};
}
