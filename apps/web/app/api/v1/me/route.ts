import { buyerForKey } from "@/lib/grant";
import { bearer, error, json } from "@/lib/http";

export async function GET(req: Request) {
  const key = bearer(req);
  if (!key) return error(401, "auth.missing-key", "No license key sent.");
  const buyer = await buyerForKey(key);
  if (!buyer) return error(401, "auth.rejected", "That key is not valid.", "Run hack0 auth recover <email> to get a new one.");
  return json({ email: buyer.email, workshops: buyer.workshops });
}
