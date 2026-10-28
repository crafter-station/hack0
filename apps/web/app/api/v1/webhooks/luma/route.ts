import { sql } from "@/lib/db";
import { grant } from "@/lib/grant";
import { error, json } from "@/lib/http";
import { type LumaGuestEvent, verifyLuma } from "@/lib/luma";

export async function POST(req: Request) {
  const secret = process.env.LUMA_WEBHOOK_SECRET;
  if (!secret) return error(500, "config", "LUMA_WEBHOOK_SECRET is not set.");
  const raw = await req.text();
  if (!verifyLuma(raw, req.headers.get("webhook-signature"), secret)) return error(401, "auth.rejected", "Bad signature.");

  const event = JSON.parse(raw) as LumaGuestEvent;
  if (event.type !== "guest.registered") return json({ ignored: event.type });

  const deliveryId = req.headers.get("webhook-id");
  if (deliveryId) {
    const fresh = (await sql()`
      insert into webhook_events (id, type) values (${deliveryId}, ${event.type})
      on conflict do nothing returning id`) as unknown[];
    if (fresh.length === 0) return json({ duplicate: deliveryId });
  }

  const guest = event.data;
  if (guest.approval_status !== "approved") return json({ ignored: `approval ${guest.approval_status}` });
  const editions = (await sql()`select workshop_id from editions where event_id = ${guest.event.id}`) as { workshop_id: string }[];
  const workshop = editions[0]?.workshop_id;
  if (!workshop) return json({ ignored: `event ${guest.event.id} is not linked to a workshop` });

  const result = await grant(guest.user_email, workshop, "luma", guest.id);
  return json(result);
}
