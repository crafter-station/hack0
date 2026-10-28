import { sql } from "@/lib/db";
import { buyerForKey } from "@/lib/grant";
import { bearer, json } from "@/lib/http";

export async function GET(req: Request) {
  const key = bearer(req);
  const buyer = key ? await buyerForKey(key) : null;
  const rows = (await sql()`
    select distinct on (id) id, version, title, free
    from packages order by id, published_at desc`) as { id: string; version: string; title: string; free: boolean }[];
  const owned = new Set(buyer?.workshops ?? []);
  return json({ items: rows.map((r) => ({ ...r, owned: r.free || owned.has(r.id) })) });
}
