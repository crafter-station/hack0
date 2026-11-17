/**
 * Upserts an ecosystem seed into organizations (as listed) and organization_logos.
 * The seed lives outside the repo: a folder of *.json records plus logos/<slug>.png files.
 * Run: bun scripts/import-ecosistema.ts <seed-dir> [--dry-run]
 */
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { organizationLogos, organizations } from "@/lib/db/schema";
import { measureLogo, toPng } from "@/lib/ecosistema-logo";

const url = z.url({ protocol: /^https?$/ }).nullable();

const Record = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  type: z.enum(["startup", "investor", "incubator", "university", "coworking"]),
  country: z.string().length(2),
  city: z.string().min(1).nullable(),
  website: url,
  /** A file in the seed folder, e.g. logos/acme.png. */
  logo: z
    .string()
    .regex(/^logos\/[a-z0-9-]+\.png$/)
    .nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  description: z.string().max(200).nullable(),
  hiringUrl: url,
  sourceUrl: z.url(),
  verifiedAt: z.iso.date().nullable(),
  /** Overrides the phrases that link the org to events; `[]` turns linking off. */
  eventTerms: z.array(z.string().min(3)).optional(),
  /** Slug of the brand this record is a branch of. */
  parent: z.string().optional(),
});

/** Spanish words that are also org names here; a name like these matches unrelated events. */
const COMMON = new Set(["lucha", "comunal", "enfoca", "impulsa", "semillero", "tecnológica", "andino", "equipo", "wichay"]);
const english = new Set(
  (await Bun.file("/usr/share/dict/words")
    .text()
    .catch(() => ""))
    .split("\n")
    .map((w) => w.toLowerCase()),
);

/** A one-word name that is also a dictionary word ("Scale", "Equip") would match any event using that word. */
function eventTerms(r: z.infer<typeof Record>) {
  if (r.eventTerms) return r.eventTerms;
  const word = r.name.trim().toLowerCase();
  if (!word.includes(" ") && (COMMON.has(word) || english.has(word))) return [];
  return [r.name];
}

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
if (!dir) throw new Error("usage: bun scripts/import-ecosistema.ts <seed-dir> [--dry-run]");
const seed = resolve(dir);

const files = (await readdir(seed)).filter((f) => f.endsWith(".json"));
const rows = (await Promise.all(files.map(async (f) => z.array(Record).parse(await Bun.file(join(seed, f)).json())))).flat();
const dupes = rows.map((r) => r.slug).filter((s, i, all) => all.indexOf(s) !== i);
if (dupes.length > 0) throw new Error(`duplicate slugs: ${[...new Set(dupes)].join(", ")}`);
const slugs = new Set(rows.map((r) => r.slug));
const orphans = rows.filter((r) => r.parent && !slugs.has(r.parent)).map((r) => r.slug);
if (orphans.length > 0) throw new Error(`parent not in seed: ${orphans.join(", ")}`);

type Logo = { png: Buffer; hash: string; tone: "light" | "dark" | null; aspect: number | null };
const logos = new Map<string, Logo>();
for (const r of rows) {
  if (!r.logo) continue;
  const png = await toPng(Buffer.from(await Bun.file(join(seed, r.logo)).arrayBuffer()));
  const measured = await measureLogo(png);
  logos.set(r.slug, {
    png,
    hash: createHash("sha256").update(png).digest("hex").slice(0, 12),
    tone: measured?.tone ?? null,
    aspect: measured?.aspect ?? null,
  });
}

console.log(`${rows.length} records and ${logos.size} logos from ${seed}`);
if (args.includes("--dry-run")) process.exit(0);

const values = rows.map((r) => {
  const logo = logos.get(r.slug);
  return {
    slug: r.slug,
    name: r.name,
    type: r.type,
    description: r.description,
    country: r.country.toUpperCase(),
    city: r.city,
    websiteUrl: r.website,
    logoUrl: logo ? `/org/${r.slug}/logo?v=${logo.hash}` : null,
    logoTone: logo?.tone ?? null,
    logoAspect: logo?.aspect ?? null,
    hiringUrl: r.hiringUrl,
    eventTerms: eventTerms(r),
    parentSlug: r.parent ?? null,
    lat: r.lat,
    lng: r.lng,
    sourceUrl: r.sourceUrl,
    verifiedAt: r.verifiedAt ? new Date(r.verifiedAt) : null,
    status: "listed" as const,
  };
});

const excluded = (col: string) => sql.raw(`excluded.${col}`);
const db = getDb();
const saved = await db
  .insert(organizations)
  .values(values)
  .onConflictDoUpdate({
    target: organizations.slug,
    set: {
      name: excluded("name"),
      type: excluded("type"),
      description: excluded("description"),
      country: excluded("country"),
      city: excluded("city"),
      websiteUrl: excluded("website_url"),
      logoUrl: excluded("logo_url"),
      logoTone: excluded("logo_tone"),
      logoAspect: excluded("logo_aspect"),
      hiringUrl: excluded("hiring_url"),
      eventTerms: excluded("event_terms"),
      parentSlug: excluded("parent_slug"),
      lat: excluded("lat"),
      lng: excluded("lng"),
      sourceUrl: excluded("source_url"),
      verifiedAt: excluded("verified_at"),
      updatedAt: sql`now()`,
    },
  })
  .returning({ id: organizations.id, slug: organizations.slug });

// One statement per logo keeps each request small on Neon's HTTP driver.
let stored = 0;
for (const o of saved) {
  const logo = logos.get(o.slug);
  if (!logo) continue;
  await db
    .insert(organizationLogos)
    .values({ organizationId: o.id, bytes: logo.png, hash: logo.hash })
    .onConflictDoUpdate({ target: organizationLogos.organizationId, set: { bytes: logo.png, hash: logo.hash, updatedAt: sql`now()` } });
  stored++;
}
const without = saved.filter((o) => !logos.has(o.slug)).map((o) => o.id);
if (without.length > 0) await db.delete(organizationLogos).where(inArray(organizationLogos.organizationId, without));

console.log(`upserted ${saved.length} organizations and ${stored} logos`);
process.exit(0);
