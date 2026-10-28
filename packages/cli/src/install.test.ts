import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Bundle } from "./contract.js";
import { applyInstall, conflicts, planInstall } from "./install.js";

const bundle = (files: Bundle["files"]): Bundle => ({ id: "01-x", title: "X", version: "1.0.0", free: false, files, links: [] });

describe("planInstall", () => {
  test("puts skills under .claude/skills and materials under hack0/<id>", () => {
    const cwd = mkdtempSync(join(tmpdir(), "h0-"));
    const plan = planInstall(
      bundle([
        { path: "skills/taste/SKILL.md", kind: "skill", encoding: "utf8", content: "a" },
        { path: "slides/deck.pdf", kind: "material", encoding: "base64", content: Buffer.from("pdf").toString("base64") },
      ]),
      { agent: "claude", global: false, cwd },
    );
    expect(plan.writes.map((w) => w.target)).toEqual([join(cwd, ".claude/skills/taste/SKILL.md"), join(cwd, "hack0/01-x/slides/deck.pdf")]);
    applyInstall(plan, []);
    expect(readFileSync(join(cwd, "hack0/01-x/slides/deck.pdf"), "utf8")).toBe("pdf");
  });

  test("uses .agents/skills for --agent agents", () => {
    const plan = planInstall(bundle([{ path: "skills/taste/SKILL.md", kind: "skill", encoding: "utf8", content: "a" }]), {
      agent: "agents",
      global: false,
      cwd: "/p",
    });
    expect(plan.dirs).toEqual(["/p/.agents/skills/taste"]);
  });

  test("refuses paths that escape the install folder", () => {
    for (const path of ["../../.ssh/authorized_keys", "/etc/passwd", "skills/../../x"]) {
      expect(() =>
        planInstall(bundle([{ path, kind: "material", encoding: "utf8", content: "" }]), { agent: "claude", global: false, cwd: "/p" }),
      ).toThrow();
    }
  });
});

describe("conflicts", () => {
  test("flags an existing folder hack0 did not create, and allows one it did", () => {
    const cwd = mkdtempSync(join(tmpdir(), "h0-"));
    mkdirSync(join(cwd, ".claude/skills/taste"), { recursive: true });
    writeFileSync(join(cwd, ".claude/skills/taste/mine.md"), "user file");
    const plan = planInstall(bundle([{ path: "skills/taste/SKILL.md", kind: "skill", encoding: "utf8", content: "a" }]), {
      agent: "claude",
      global: false,
      cwd,
    });
    expect(conflicts(plan, [])).toEqual([join(cwd, ".claude/skills/taste")]);
    expect(conflicts(plan, [join(cwd, ".claude/skills/taste")])).toEqual([]);
  });
});

describe("installs in two projects", () => {
  test("installing in a second project leaves the first one alone", () => {
    const a = mkdtempSync(join(tmpdir(), "h0-a-"));
    const b = mkdtempSync(join(tmpdir(), "h0-b-"));
    const files: Bundle["files"] = [{ path: "skills/taste/SKILL.md", kind: "skill", encoding: "utf8", content: "a" }];
    const planA = planInstall(bundle(files), { agent: "claude", global: false, cwd: a });
    applyInstall(planA, []);
    const planB = planInstall(bundle(files), { agent: "claude", global: false, cwd: b });
    // previous paths are only those recorded for project b, which is none
    applyInstall(planB, []);
    expect(readFileSync(join(a, ".claude/skills/taste/SKILL.md"), "utf8")).toBe("a");
  });
});
