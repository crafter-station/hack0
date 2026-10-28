import { sql } from "./db";
import { hashKey, newKey } from "./keys";
import { sendAccessAdded, sendKey } from "./mail";

type GrantResult = { email: string; workshop: string; newKey: boolean; alreadyHad: boolean; emailed: boolean };

/**
 * One key per buyer. A first purchase creates the buyer and emails the key;
 * later purchases add an entitlement to the same key and send a short notice.
 */
export async function grant(emailRaw: string, workshop: string, source: "luma" | "grant", ref: string | null): Promise<GrantResult> {
  const email = emailRaw.trim().toLowerCase();
  const db = sql();
  const existing = (await db`select id from buyers where email = ${email}`) as { id: string }[];
  let buyerId = existing[0]?.id;
  let key: string | null = null;
  if (!buyerId) {
    key = newKey();
    const rows = (await db`insert into buyers (email, key_hash) values (${email}, ${hashKey(key)}) returning id`) as { id: string }[];
    buyerId = rows[0]?.id;
  }
  const inserted = (await db`
    insert into entitlements (buyer_id, workshop_id, source, ref)
    values (${buyerId}, ${workshop}, ${source}, ${ref})
    on conflict do nothing
    returning workshop_id`) as unknown[];
  const alreadyHad = inserted.length === 0;
  let emailed = false;
  if (key) emailed = await sendKey(email, key, workshop);
  else if (!alreadyHad) emailed = await sendAccessAdded(email, workshop);
  return { email, workshop, newKey: Boolean(key), alreadyHad, emailed };
}

export async function buyerForKey(key: string): Promise<{ id: string; email: string; workshops: string[] } | null> {
  const db = sql();
  const rows = (await db`
    select b.id, b.email, coalesce(array_agg(e.workshop_id) filter (where e.workshop_id is not null), '{}') as workshops
    from buyers b left join entitlements e on e.buyer_id = b.id
    where b.key_hash = ${hashKey(key)}
    group by b.id`) as { id: string; email: string; workshops: string[] }[];
  return rows[0] ?? null;
}

export async function rotateKey(emailRaw: string): Promise<boolean> {
  const email = emailRaw.trim().toLowerCase();
  const key = newKey();
  const rows = (await sql()`update buyers set key_hash = ${hashKey(key)} where email = ${email} returning id`) as unknown[];
  if (rows.length === 0) return false;
  return sendKey(email, key, null);
}
