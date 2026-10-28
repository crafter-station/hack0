import { sql } from "@/lib/db";
import { buyerForKey } from "@/lib/grant";
import { bearer, error, json } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = (await sql()`
    select id, version, title, free, bundle from packages
    where id = ${id} order by published_at desc limit 1`) as {
    id: string;
    version: string;
    title: string;
    free: boolean;
    bundle: { files: unknown[]; links: unknown[] };
  }[];
  const pkg = rows[0];
  if (!pkg) return error(404, "not-found", `No package called ${id}.`, "Run hack0 list.");
  if (!pkg.free) {
    const key = bearer(req);
    if (!key)
      return error(401, "auth.missing-key", `${pkg.title} needs a license key.`, "Run hack0 login with the key from your purchase email.");
    const buyer = await buyerForKey(key);
    if (!buyer) return error(401, "auth.rejected", "That key is not valid.", "Run hack0 auth recover <email> to get a new one.");
    if (!buyer.workshops.includes(pkg.id)) return error(403, "entitlement.missing", `This key has no access to ${pkg.title}.`);
  }
  return json({ id: pkg.id, version: pkg.version, title: pkg.title, free: pkg.free, files: pkg.bundle.files, links: pkg.bundle.links });
}
