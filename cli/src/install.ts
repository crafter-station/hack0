import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, normalize, sep } from "node:path";
import type { Agent, Bundle, InstallRecord } from "./contract.js";
import { fail } from "./output.js";

export type InstallPlan = {
  root: string;
  writes: { target: string; encoding: "utf8" | "base64"; content: string }[];
  dirs: string[];
};

/** Bundle paths come from the server, so anything that escapes its folder is refused. */
function safeRelative(path: string): string {
  const clean = normalize(path);
  if (isAbsolute(clean) || clean.split(sep).includes("..")) {
    throw fail("bundle.unsafe-path", `The package contains an unsafe path: ${path}`);
  }
  return clean;
}

export function planInstall(bundle: Bundle, opts: { agent: Agent; global: boolean; cwd: string }): InstallPlan {
  const root = opts.global ? homedir() : opts.cwd;
  const skillsDir = join(root, opts.agent === "claude" ? ".claude" : ".agents", "skills");
  const materialsDir = join(root, "hack0", bundle.id);
  const writes: InstallPlan["writes"] = [];
  const dirs = new Set<string>();

  for (const file of bundle.files) {
    const rel = safeRelative(file.path);
    if (file.kind === "skill") {
      const parts = rel.split(sep);
      const inner = parts[0] === "skills" ? parts.slice(1) : parts;
      const name = inner[0];
      if (!name || inner.length < 2) throw fail("bundle.unsafe-path", `Skill file has no skill folder: ${file.path}`);
      dirs.add(join(skillsDir, name));
      writes.push({ target: join(skillsDir, ...inner), encoding: file.encoding, content: file.content });
    } else {
      dirs.add(materialsDir);
      writes.push({ target: join(materialsDir, rel), encoding: file.encoding, content: file.content });
    }
  }
  return { root, writes, dirs: [...dirs] };
}

/** Directories owned by a previous install of this package may be replaced; anything else needs --force. */
export function conflicts(plan: InstallPlan, owned: string[]): string[] {
  return plan.dirs.filter((dir) => existsSync(dir) && !owned.includes(dir));
}

export function applyInstall(plan: InstallPlan, previous: string[]): void {
  for (const dir of new Set([...previous, ...plan.dirs])) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
  for (const write of plan.writes) {
    mkdirSync(dirname(write.target), { recursive: true });
    writeFileSync(write.target, Buffer.from(write.content, write.encoding));
  }
}

export function record(bundle: Bundle, plan: InstallPlan, agent: Agent, global: boolean): InstallRecord {
  return {
    id: bundle.id,
    version: bundle.version,
    agent,
    global,
    root: plan.root,
    paths: plan.dirs,
    installedAt: new Date().toISOString(),
  };
}
