/**
 * Downloads every remote logo URL in a seed into <seed-dir>/logos/<slug>.png and points the record at the file.
 * New orgs can be added with `"logo": "https://..."`; this turns them into files the importer stores in the database.
 * ICO files go through macOS `sips`, which sharp can't read.
 * Run: bun scripts/fetch-logos.ts <seed-dir>
 */
import { mkdir, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { toPng } from "@/lib/ecosistema-logo";

type Row = { slug: string; logo: string | null };

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

async function fromIco(input: Buffer, slug: string) {
  const dir = join(tmpdir(), "hack0-logos");
  await mkdir(dir, { recursive: true });
  const [ico, png] = [join(dir, `${slug}.ico`), join(dir, `${slug}.png`)];
  await Bun.write(ico, input);
  if (Bun.spawnSync(["sips", "-s", "format", "png", ico, "--out", png]).exitCode !== 0) return null;
  return Buffer.from(await Bun.file(png).arrayBuffer());
}

async function download(row: Row & { logo: string }) {
  const res = await fetch(row.logo, { headers: { "user-agent": UA, accept: "image/*" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const input = Buffer.from(await res.arrayBuffer());
  if (input.length === 0) return null;
  const png = await toPng(input).catch(() => null);
  if (png) return png;
  const ico = await fromIco(input, row.slug);
  return ico ? toPng(ico) : null;
}

const dir = process.argv[2];
if (!dir) throw new Error("usage: bun scripts/fetch-logos.ts <seed-dir>");
const seed = resolve(dir);
await mkdir(join(seed, "logos"), { recursive: true });

const failed: string[] = [];
for (const name of (await readdir(seed)).filter((f) => f.endsWith(".json"))) {
  const path = join(seed, name);
  const rows = (await Bun.file(path).json()) as Row[];
  for (const row of rows) {
    if (!row.logo?.startsWith("http")) continue;
    const png = await download(row as Row & { logo: string }).catch((e: unknown) => {
      console.warn(`${row.slug}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    });
    if (!png) {
      failed.push(row.slug);
      continue;
    }
    await Bun.write(join(seed, "logos", `${row.slug}.png`), png);
    row.logo = `logos/${row.slug}.png`;
  }
  await Bun.write(path, `${JSON.stringify(rows, null, 2)}\n`);
}
console.log(failed.length ? `not downloaded: ${failed.join(", ")}` : "every remote logo is a file now");
process.exit(0);
