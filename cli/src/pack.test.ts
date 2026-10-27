import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pack } from "./pack.js";

function workshop(manifest: object): string {
  const dir = mkdtempSync(join(tmpdir(), "h0-pack-"));
  writeFileSync(join(dir, "hack0.json"), JSON.stringify(manifest));
  mkdirSync(join(dir, "skills/taste"), { recursive: true });
  writeFileSync(join(dir, "skills/taste/SKILL.md"), "# taste");
  mkdirSync(join(dir, "slides"));
  writeFileSync(join(dir, "slides/deck.pdf"), Buffer.from([0, 1, 2]));
  return dir;
}

test("packs skills as utf8 and binaries as base64", () => {
  const bundle = pack(workshop({ id: "01-x", title: "X", version: "1.0.0", free: false, skills: ["skills/taste"], materials: ["slides"] }));
  expect(bundle.files).toEqual([
    { path: "skills/taste/SKILL.md", kind: "skill", encoding: "utf8", content: "# taste" },
    { path: "slides/deck.pdf", kind: "material", encoding: "base64", content: "AAEC" },
  ]);
});

test("refuses a manifest that lists a missing folder", () => {
  expect(() => pack(workshop({ id: "01-x", title: "X", version: "1.0.0", skills: ["skills/nope"] }))).toThrow();
});
