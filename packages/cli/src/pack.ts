import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Bundle, BundleFile, Manifest } from "./contract.js";
import { fail } from "./output.js";

const MAX_BUNDLE_BYTES = 4 * 1024 * 1024;

const TEXT = /\.(md|txt|json|ts|tsx|js|jsx|css|html|svg|yml|yaml|toml|sh|csv)$/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (entry.startsWith(".")) return [];
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function readManifest(dir: string): Manifest {
  const file = join(dir, "hack0.json");
  if (!existsSync(file)) throw fail("usage", `No hack0.json in ${dir}.`, "Create one with id, title, version, free and skills.");
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
  for (const field of ["id", "title", "version"] as const) {
    if (typeof manifest[field] !== "string" || !manifest[field]) throw fail("usage", `hack0.json is missing "${field}".`);
  }
  if (!Array.isArray(manifest.skills)) throw fail("usage", 'hack0.json needs a "skills" array.');
  return manifest;
}

export function pack(dir: string): Bundle {
  const manifest = readManifest(dir);
  const files: BundleFile[] = [];
  const add = (folder: string, kind: BundleFile["kind"]) => {
    const base = join(dir, folder);
    if (!existsSync(base)) throw fail("usage", `hack0.json lists "${folder}" but it does not exist.`);
    for (const full of walk(base)) {
      const path = relative(dir, full);
      const text = TEXT.test(full);
      files.push({
        path,
        kind,
        encoding: text ? "utf8" : "base64",
        content: text ? readFileSync(full, "utf8") : readFileSync(full).toString("base64"),
      });
    }
  };
  for (const skill of manifest.skills) add(skill, "skill");
  for (const material of manifest.materials ?? []) add(material, "material");

  const bundle: Bundle = {
    id: manifest.id,
    title: manifest.title,
    version: manifest.version,
    free: Boolean(manifest.free),
    files,
    links: manifest.links ?? [],
  };
  const size = Buffer.byteLength(JSON.stringify(bundle));
  if (size > MAX_BUNDLE_BYTES) {
    throw fail(
      "publish.too-large",
      `The bundle is ${(size / 1024 / 1024).toFixed(1)} MB, over the 4 MB limit.`,
      "Move recordings and large PDFs to links in hack0.json.",
    );
  }
  return bundle;
}
