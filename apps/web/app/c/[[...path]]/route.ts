import { communityIndex } from "@/lib/catalog";
import { SITE } from "@/lib/site";

/** Community pages from the previous app lived under /c/<slug>; send search engines to their current home. */
export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const [slug] = (await params).path ?? [];
  return Response.redirect(`${SITE}${await legacyCommunityPath(slug)}`, 308);
}

async function legacyCommunityPath(slug: string | undefined) {
  if (!slug || slug === "discover") return "/comunidades";
  // hack0 was a community of its own in the previous app; it is the site now.
  if (slug === "hack0") return "/";
  const match = (await communityIndex()).find((c) => c.slug === slug);
  return match ? `/comunidades/${match.slug}` : "/comunidades";
}
