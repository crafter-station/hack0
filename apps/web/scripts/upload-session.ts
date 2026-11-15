// bun scripts/upload-session.ts <workshop> <slug> <file.cast> "<title>"
// Gzips an asciicast and uploads it to the sessions table. Needs HACK0_ADMIN_TOKEN; HACK0_URL defaults to https://hack0.dev.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

/** Playback length in seconds: asciicast v3 events carry the interval since the previous event; idle gaps are capped. */
export function playbackSeconds(cast: string, idleLimit = 2): number {
  let total = 0;
  for (const line of cast.split("\n").slice(1)) {
    if (!line.startsWith("[")) continue;
    const delta = (JSON.parse(line) as [number])[0];
    total += Math.min(delta, idleLimit);
  }
  return total;
}

async function main() {
  const [workshop, slug, file, title] = process.argv.slice(2);
  const token = process.env.HACK0_ADMIN_TOKEN;
  if (!workshop || !slug || !file || !title) throw new Error('usage: upload-session.ts <workshop> <slug> <file.cast> "<title>"');
  if (!token) throw new Error("HACK0_ADMIN_TOKEN is not set");
  const cast = readFileSync(file, "utf8");
  const body = { workshop, slug, title, duration: playbackSeconds(cast), castGzBase64: gzipSync(cast).toString("base64") };
  const res = await fetch(`${process.env.HACK0_URL ?? "https://hack0.dev"}/api/v1/admin/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hack0-admin": token },
    body: JSON.stringify(body),
  });
  console.log(res.status, await res.text());
  if (!res.ok) process.exit(1);
}

if (import.meta.main) await main();
