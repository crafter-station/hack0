import { readFileSync } from "node:fs";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import type { PublicLumaEvent } from "@/lib/ingest/luma-public";
import { lumaInputs, normalizeBatch } from "@/lib/ingest/normalize";
import { persistBatch } from "@/lib/ingest/persist";

/**
 * Backfills Luma history from Event Aggregator's database, which api.lu.ma's rate limit keeps the sync from reading.
 * Usage: bun run scripts/backfill-aggregator-events.ts <luma-events.json> [--write]
 * Each row is one event as a calendar listed it: { calendarId, calendarUrl, sourceType, ...PublicLumaEvent }.
 * Without --write it only reports what it would do. Safe to rerun: persistBatch is keyed.
 */
type Row = PublicLumaEvent & { calendarId: string | null; calendarUrl: string | null; sourceType: string };

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error("pass the luma-events.json path");
const write = flag === "--write";
const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];

const urlKey = (u: string) => u.toLowerCase().replace(/^https?:\/\/(www\.)?(lu\.ma|luma\.com)\//, "").replace(/\/+$/, "");
const db = getDb();
const all = await db.select({ id: sources.id, name: sources.name, url: sources.url, calendarId: sources.lumaCalendarId }).from(sources);
const byCalendar = new Map(all.flatMap((s) => (s.calendarId ? [[s.calendarId, s] as const] : [])));
const byUrl = new Map(all.map((s) => [urlKey(s.url), s] as const));

const groups = new Map<string, { source: (typeof all)[number]; events: PublicLumaEvent[] }>();
const unmatched = new Map<string, number>();
for (const r of rows) {
  // Profiles have their own source type; only calendars map by id.
  if (r.sourceType === "profile_scrape") continue;
  const source = (r.calendarId && byCalendar.get(r.calendarId)) || (r.calendarUrl && byUrl.get(urlKey(r.calendarUrl)));
  if (!source) {
    const key = r.calendarUrl ?? r.calendarId ?? "?";
    unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
    continue;
  }
  const g = groups.get(source.id) ?? { source, events: [] };
  g.events.push({ ...r, hostNames: r.hostNames ?? [] });
  groups.set(source.id, g);
}

let created = 0;
let updated = 0;
for (const { source, events } of groups.values()) {
  const batch = normalizeBatch(lumaInputs(events, { id: source.id, name: source.name, calendarId: source.calendarId }));
  if (write) {
    const r = await persistBatch(db, batch, source.id);
    created += r.created;
    updated += r.updated;
  }
  console.log(`${batch.length.toString().padStart(5)}  ${source.name ?? source.url}`);
}
const mapped = [...groups.values()].reduce((n, g) => n + g.events.length, 0);
console.log(`\n${groups.size} sources, ${mapped} sightings mapped; ${[...unmatched.values()].reduce((a, b) => a + b, 0)} in ${unmatched.size} calendars with no hack0 source`);
for (const [k, n] of unmatched) console.log(`  unmatched ${n}  ${k}`);
console.log(write ? `written: ${created} created, ${updated} updated` : "dry run: pass --write to persist");
process.exit(0);
