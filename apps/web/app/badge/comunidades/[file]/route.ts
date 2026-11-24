import { badgeFonts, badgeResponse, badgeTheme, communityCopy, renderBadge, shortDate } from "@/lib/badge";
import { communityEvents, communityIndex } from "@/lib/catalog";

/** /badge/comunidades/<slug>.svg?tema=claro|oscuro|compacto&dato=proximo, the badge a community embeds on its site. */
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!file.endsWith(".svg")) return new Response("Not found", { status: 404 });
  const slug = file.slice(0, -4);
  const community = (await communityIndex()).find((c) => c.slug === slug);
  if (!community) return new Response("Not found", { status: 404 });
  const query = new URL(request.url).searchParams;
  const next = query.get("dato") === "proximo" ? (await communityEvents(slug))?.upcoming[0] : null;
  const copy = communityCopy(community.name, community.count, next ? shortDate(next.startAt, next.timezone) : null);
  return badgeResponse(renderBadge(await badgeFonts(), copy, badgeTheme(query.get("tema"))));
}
