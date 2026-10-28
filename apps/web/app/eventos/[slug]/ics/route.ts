import { findEvent } from "@/lib/catalog";
import { icsFor } from "@/lib/event-view";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { page } = await findEvent(slug);
  if (!page) return new Response("Not found", { status: 404 });
  return new Response(icsFor(page.event), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug.slice(0, 60)}.ics"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
