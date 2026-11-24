import { badgeFonts, badgeResponse, badgeTheme, orgCopy, renderBadge } from "@/lib/badge";
import { findOrg } from "@/lib/ecosistema";

/** /badge/org/<slug>.svg?tema=claro|oscuro|compacto, the badge an org in the ecosystem directory embeds on its site. */
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!file.endsWith(".svg")) return new Response("Not found", { status: 404 });
  const org = await findOrg(file.slice(0, -4));
  if (!org) return new Response("Not found", { status: 404 });
  const theme = badgeTheme(new URL(request.url).searchParams.get("tema"));
  return badgeResponse(renderBadge(await badgeFonts(), orgCopy(org.name), theme));
}
