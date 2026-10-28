import { readFileSync } from "node:fs";
import { detectProviderImportTarget } from "@/lib/canonical/event-providers";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { seedSources } from "@/lib/ingest/sources";

/**
 * Imports the source list exported from Event Aggregator's database.
 * Usage: bun run scripts/import-aggregator-sources.ts <sources.json>
 * Each row: { provider, kind, name, url, lumaCalendarId, latamShare }. Safe to rerun: existing sources are left as they are.
 */
type Row = { provider: string; kind: string; name: string | null; url: string; lumaCalendarId: string | null; latamShare: number | null };

const file = process.argv[2];
if (!file) throw new Error("pass the sources.json path");
const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];

const values = rows.flatMap((r) => {
  const target = detectProviderImportTarget(r.url);
  // Profiles and single Luma events have no fetcher yet.
  if (!target || target.kind === "profile" || (target.provider === "luma" && target.kind === "event")) return [];
  return [
    {
      provider: target.provider,
      kind: target.kind,
      providerSourceId: target.providerSourceId,
      url: target.normalizedUrl,
      name: r.name,
      // A source vouches for LATAM only when most events it listed with a known country were there.
      scope: r.latamShare !== null && r.latamShare > 0.5 ? ("latam" as const) : ("global" as const),
      lumaCalendarId: target.provider === "luma" ? (r.lumaCalendarId ?? r.url.match(/cal-[A-Za-z0-9]+/)?.[0] ?? null) : null,
    },
  ];
});

const db = getDb();
const seeded = await seedSources(db);
const imported = await db.insert(sources).values(values)// Any unique key: the same URL, or the same Luma calendar under another URL.
  .onConflictDoNothing().returning({ id: sources.id });
console.log(`seed: ${seeded.length} new · aggregator: ${imported.length} new of ${values.length} importable, ${rows.length - values.length} skipped`);
process.exit(0);
