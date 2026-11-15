import { currentUser } from "@clerk/nextjs/server";
import { WORKSHOP } from "@/app/taste-hacking/workshop";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { error } from "@/lib/http";
import { gateSession } from "@/lib/session-access";

export const dynamic = "force-dynamic";

/** A recorded session as a gzipped asciicast, for buyers of the workshop only. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const gate = await gateSession(await currentUser(), async (email) => (await getEntitlementByEmail(email, WORKSHOP.id)).hasEntitlement);
  if (!gate.ok) return error(gate.status, gate.code, gate.message);
  const { slug } = await params;
  const rows = (await sql()`
    select encode(cast_gz, 'base64') as b64 from sessions
    where workshop_id = ${WORKSHOP.id} and slug = ${slug}`) as { b64: string }[];
  const row = rows[0];
  if (!row) return error(404, "session.not-found", "No session with that slug.");
  return new Response(Buffer.from(row.b64, "base64"), {
    headers: {
      "content-type": "application/x-asciicast",
      "content-encoding": "gzip",
      "cache-control": "private, no-store",
    },
  });
}
