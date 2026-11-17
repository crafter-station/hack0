import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { organizationLogos, organizations } from "@/lib/db/schema";

type Context = { params: Promise<{ slug: string }> };

/** An org's logo from the database. URLs carry `?v=<hash>`, so a cached copy never goes stale. */
export async function GET(_req: Request, { params }: Context) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) return new Response(null, { status: 404 });
  const [row] = await getDb()
    .select({ bytes: organizationLogos.bytes, hash: organizationLogos.hash })
    .from(organizationLogos)
    .innerJoin(organizations, eq(organizations.id, organizationLogos.organizationId))
    .where(and(eq(organizations.slug, slug), eq(organizations.status, "listed")))
    .limit(1);
  if (!row) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      etag: `"${row.hash}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
