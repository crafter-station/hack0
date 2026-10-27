import { sql } from "@/lib/db";
import { error, isAdmin, json } from "@/lib/http";

export async function POST(req: Request) {
  if (!isAdmin(req)) return error(401, "auth.rejected", "Admin token missing or wrong.");
  const b = (await req.json().catch(() => ({}))) as { eventId?: string; workshop?: string; label?: string };
  if (!b.eventId || !b.workshop) return error(400, "usage", "Send eventId and workshop.");
  await sql()`
    insert into editions (event_id, workshop_id, label) values (${b.eventId}, ${b.workshop}, ${b.label ?? null})
    on conflict (event_id) do update set workshop_id = excluded.workshop_id, label = excluded.label`;
  return json({ eventId: b.eventId, workshop: b.workshop });
}
