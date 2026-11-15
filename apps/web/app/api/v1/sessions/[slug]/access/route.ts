import { currentUser } from "@clerk/nextjs/server";
import { GALLERY } from "@/app/taste-hacking/gallery";
import { WORKSHOP } from "@/app/taste-hacking/workshop";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { error } from "@/lib/http";
import { gateSession } from "@/lib/session-access";

export const dynamic = "force-dynamic";

/** What a buyer may open on a piece's page: who they are and, when the piece has an uploaded session, where its preview starts. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const gate = await gateSession(await currentUser(), async (email) => (await getEntitlementByEmail(email, WORKSHOP.id)).hasEntitlement);
  if (!gate.ok) return error(gate.status, gate.code, gate.message);
  const { slug } = await params;
  const entry = GALLERY.find((g) => g.slug === slug);
  if (!entry) return error(404, "piece.not-found", "No piece with that slug.");
  const rows = entry.sessionPoster
    ? ((await sql()`select duration_s from sessions where workshop_id = ${WORKSHOP.id} and slug = ${slug}`) as { duration_s: number }[])
    : [];
  const session = rows[0] && entry.sessionPoster ? { poster: entry.sessionPoster, seconds: rows[0].duration_s } : null;
  return Response.json({ email: gate.email, session }, { headers: { "cache-control": "private, no-store" } });
}
