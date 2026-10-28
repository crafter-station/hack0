import { expect, test } from "bun:test";
import { join } from "node:path";

const CLI = join(import.meta.dir, "run.ts");

function run(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawnSync(["bun", CLI, ...args], { env: { ...process.env, HACK0_HOME: "/tmp/h0-test-home", HACK0_KEY: "", ...env } });
  return { code: proc.exitCode, stdout: proc.stdout.toString(), stderr: proc.stderr.toString() };
}

test("piped output is one JSON envelope", () => {
  const { code, stdout } = run(["schema"]);
  expect(code).toBe(0);
  const env = JSON.parse(stdout);
  expect(env.ok).toBe(true);
  expect(env.version).toBe("1");
});

test("unknown commands fail with a usage envelope and exit 2", () => {
  const { code, stdout } = run(["nope"]);
  expect(code).toBe(2);
  expect(JSON.parse(stdout).error.code).toBe("usage");
});

test("add reports an unreachable server as a network error", () => {
  const { code, stdout } = run(["add", "01-x"], { HACK0_API_URL: "http://127.0.0.1:9" });
  expect(code).toBe(6);
  expect(JSON.parse(stdout).error.code).toBe("network");
});

test("admin grant previews without --apply and needs no token", () => {
  const { code, stdout } = run(["admin", "grant", "A@B.com", "01-x"]);
  expect(code).toBe(0);
  expect(JSON.parse(stdout).result).toEqual({ email: "a@b.com", workshop: "01-x", note: null, applied: false });
});

test("piped machine output has no ANSI escapes", () => {
  const { stdout } = run(["schema"], { FORCE_COLOR: "1" });
  expect(stdout.includes("\u001b[")).toBe(false);
});
