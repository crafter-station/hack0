#!/usr/bin/env bun
/**
 * Scrapes public LATAM tech conference directories (JSON-LD Event nodes + structured links)
 * to discover new 2026-2027 flagship events missing from lib/flagship-2027.ts.
 *
 * Usage:
 *   bun scripts/scrape-latam-2027.ts
 *   bun scripts/scrape-latam-2027.ts --json
 */

import { FLAGSHIP_2027 } from "../lib/flagship-2027";

const SOURCES = [
  { name: "raise.inc", url: "https://raise.inc/events/calendar/ai" },
  { name: "techeventsmap.com", url: "https://techeventsmap.com/regions/latin-america/" },
  { name: "dev.events", url: "https://dev.events/SA" },
  { name: "seeyouat.dev", url: "https://seeyouat.dev/tech-conferences-south-america" },
];

const LATAM_HINT =
  /\b(argentina|bolivia|brasil|brazil|chile|colombia|costa rica|ecuador|el salvador|guatemala|honduras|mexico|méxico|nicaragua|panama|panamá|paraguay|peru|perú|puerto rico|uruguay|venezuela|buenos aires|são paulo|sao paulo|rio de janeiro|río de janeiro|lima|bogota|bogotá|medellin|medellín|mexico city|ciudad de méxico|santiago|montevideo|punta del este|san josé|porto alegre|latam|latin america)\b/i;

interface DiscoveredEvent {
  source: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  url: string;
}

function extractJsonLdEvents(html: string, source: string): DiscoveredEvent[] {
  const out: DiscoveredEvent[] = [];
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length > 0) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node["@graph"])) queue.push(...node["@graph"]);
        if (Array.isArray(node.itemListElement)) {
          for (const el of node.itemListElement) queue.push(el?.item ?? el);
        }
        const type = node["@type"];
        const isEvent = type === "Event" || (Array.isArray(type) && type.includes("Event"));
        if (!isEvent || !node.name || !node.startDate) continue;
        const startDate = String(node.startDate).slice(0, 10);
        if (!/^202[67]-/.test(startDate)) continue;
        const loc =
          typeof node.location === "string"
            ? node.location
            : [node.location?.name, node.location?.address?.addressLocality, node.location?.address?.addressCountry]
                .filter(Boolean)
                .join(", ");
        const blob = `${node.name} ${loc}`;
        if (!LATAM_HINT.test(blob)) continue;
        out.push({
          source,
          name: String(node.name).trim(),
          startDate,
          endDate: node.endDate ? String(node.endDate).slice(0, 10) : undefined,
          location: loc || "LATAM",
          url: String(node.url ?? "").trim(),
        });
      }
    } catch {
      // Ignore malformed JSON-LD blocks on external pages
    }
  }
  return out;
}

async function main() {
  const asJson = process.argv.includes("--json");
  const known = new Set(FLAGSHIP_2027.map((e) => e.name.toLowerCase()));
  const found: DiscoveredEvent[] = [];

  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { "user-agent": "hack0-bot/1.0 (+https://hack0.dev)" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      found.push(...extractJsonLdEvents(html, src.name));
    } catch (err) {
      if (!asJson) console.error(`[${src.name}] fetch failed:`, (err as Error).message);
    }
  }

  const seen = new Set<string>();
  const fresh = found.filter((e) => {
    const key = `${e.name.toLowerCase()}|${e.startDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !known.has(e.name.toLowerCase());
  });

  if (asJson) {
    console.log(JSON.stringify({ totalDiscovered: found.length, newCandidates: fresh }, null, 2));
    return;
  }

  console.log(`Discovered ${found.length} LATAM 2026-2027 JSON-LD events (${fresh.length} new vs flagship-2027.ts):`);
  for (const e of fresh) {
    console.log(`- [${e.startDate}] ${e.name} (${e.location}) -> ${e.url || "(no url)"} [via ${e.source}]`);
  }
}

main();
