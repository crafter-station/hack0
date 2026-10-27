import { sql } from "@/lib/db";
import { error, json } from "@/lib/http";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { message?: string; context?: unknown };
  const message = body.message?.trim().slice(0, 4000);
  if (!message) return error(400, "usage", "Send a message.");
  const rows = (await sql()`
    insert into feedback (message, context) values (${message}, ${JSON.stringify(body.context ?? {})}::text::jsonb)
    returning id`) as { id: string }[];
  return json({ id: rows[0]?.id });
}
