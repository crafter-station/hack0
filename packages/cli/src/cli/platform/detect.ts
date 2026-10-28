// cligentic block: detect
//
// Environment detection helpers shared across platform blocks.
// Detects WSL, CI, headless environments, and binary availability.
//
// Usage:
//   import { isWsl, isCi, hasCommand } from "./platform/detect";

// --- Output mode detection (shared by json-mode + next-steps) ---

type OutputMode = "human" | "json";

export type EmitOptions = {
  json?: boolean;
  quiet?: boolean;
};

/**
 * Detects whether the CLI should emit structured JSON or human output.
 * Precedence: explicit --json flag > NO_JSON env > TTY detection > default human.
 */
export function detectMode(opts: EmitOptions = {}): OutputMode {
  if (opts.json === true) return "json";
  if (process.env.NO_JSON === "1") return "human";
  if (!process.stdout.isTTY) return "json";
  return "human";
}

/**
 * Detects whether colors should be used. Respects NO_COLOR and FORCE_COLOR.
 */
export function shouldColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout.isTTY);
}
