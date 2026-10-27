import { rotateKey } from "@/lib/grant";
import { error, json } from "@/lib/http";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  if (!body.email) return error(400, "usage", "Send an email.");
  await rotateKey(body.email);
  // Same answer whether or not the email exists, so this cannot list buyers.
  return json({ sent: true });
}
