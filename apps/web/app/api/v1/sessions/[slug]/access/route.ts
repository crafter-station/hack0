import { currentUser } from "@clerk/nextjs/server";
import { GALLERY } from "@/app/taste-hacking/gallery";
import { WORKSHOP } from "@/app/taste-hacking/workshop";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { error } from "@/lib/http";
import { gateSession } from "@/lib/session-access";

export const dynamic = "force-dynamic";

/** What a buyer may open on a piece's page: who they are and, for each of the piece's sessions that is uploaded, where its preview starts. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const gate = await gateSession(await currentUser(), async (email) => (await getEntitlementByEmail(email, WORKSHOP.id)).hasEntitlement);
  if (!gate.ok) return error(gate.status, gate.code, gate.message);
  const { slug } = await params;
  const entry = GALLERY.find((g) => g.slug === slug);
  if (!entry) return error(404, "piece.not-found", "No piece with that slug.");
  const rows = entry.sessionPoster
    ? ((await sql()`select slug, duration_s from sessions where workshop_id = ${WORKSHOP.id}`) as { slug: string; duration_s: number }[])
    : [];
  const seconds = new Map(rows.map((r) => [r.slug, r.duration_s]));
  const first = seconds.get(slug);
  const session = first !== undefined && entry.sessionPoster ? { poster: entry.sessionPoster, seconds: first } : null;
  const takes = (entry.takes ?? []).flatMap((t) => {
    const length = seconds.get(t.slug);
    return length === undefined ? [] : [{ ...t, seconds: length }];
  });
  return Response.json({ email: gate.email, session, takes }, { headers: { "cache-control": "private, no-store" } });
}
