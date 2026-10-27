import { grant } from "@/lib/grant";
import { error, isAdmin, json } from "@/lib/http";

export async function POST(req: Request) {
  if (!isAdmin(req)) return error(401, "auth.rejected", "Admin token missing or wrong.");
  const body = (await req.json().catch(() => ({}))) as { email?: string; workshop?: string; note?: string };
  if (!body.email || !body.workshop) return error(400, "usage", "Send email and workshop.");
  return json(await grant(body.email, body.workshop, "grant", body.note ?? null));
}
