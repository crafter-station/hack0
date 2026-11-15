import { sql } from "@/lib/db";
import { error, isAdmin, json } from "@/lib/http";

const GZIP_MAGIC = [0x1f, 0x8b];

export async function POST(req: Request) {
  if (!isAdmin(req)) return error(401, "auth.rejected", "Admin token missing or wrong.");
  const b = (await req.json().catch(() => ({}))) as {
    workshop?: string;
    slug?: string;
    title?: string;
    duration?: number;
    castGzBase64?: string;
  };
  if (!b.workshop || !b.slug || !b.title || !Number.isFinite(b.duration) || !b.castGzBase64) {
    return error(400, "usage", "Send workshop, slug, title, duration (seconds) and castGzBase64.");
  }
  const gz = Buffer.from(b.castGzBase64, "base64");
  if (GZIP_MAGIC.some((byte, i) => gz[i] !== byte)) return error(400, "usage", "castGzBase64 is not gzip data.");
  await sql()`
    insert into sessions (workshop_id, slug, title, duration_s, cast_gz)
    values (${b.workshop}, ${b.slug}, ${b.title}, ${Math.round(b.duration as number)}, decode(${gz.toString("base64")}, 'base64'))
    on conflict (workshop_id, slug) do update set title = excluded.title, duration_s = excluded.duration_s, cast_gz = excluded.cast_gz, created_at = now()`;
  return json({ workshop: b.workshop, slug: b.slug, bytes: gz.length });
}
