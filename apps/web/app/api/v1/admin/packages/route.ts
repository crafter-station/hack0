import { sql } from "@/lib/db";
import { error, isAdmin, json } from "@/lib/http";

export async function POST(req: Request) {
  if (!isAdmin(req)) return error(401, "auth.rejected", "Admin token missing or wrong.");
  const b = (await req.json().catch(() => ({}))) as {
    id?: string;
    version?: string;
    title?: string;
    free?: boolean;
    files?: unknown[];
    links?: unknown[];
  };
  if (!b.id || !b.version || !b.title || !Array.isArray(b.files)) return error(400, "usage", "Send id, version, title and files.");
  const bundle = JSON.stringify({ files: b.files, links: b.links ?? [] });
  await sql()`
    insert into packages (id, version, title, free, bundle)
    values (${b.id}, ${b.version}, ${b.title}, ${Boolean(b.free)}, ${bundle}::text::jsonb)
    on conflict (id, version) do update set title = excluded.title, free = excluded.free, bundle = excluded.bundle, published_at = now()`;
  return json({ id: b.id, version: b.version });
}
