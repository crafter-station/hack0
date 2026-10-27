// cligentic block: detect
//
// Environment detection helpers shared across platform blocks.
// Detects WSL, CI, headless environments, and binary availability.
//
// Usage:
//   import { isWsl, isCi, hasCommand } from "./platform/detect";

import { existsSync, readFileSync } from "node:fs";
import { platform } from "node:os";

/**
 * Detects WSL (Windows Subsystem for Linux). Reads /proc/version once
 * and caches the result for the lifetime of the process.
 */
let wslCache: boolean | null = null;
export function isWsl(): boolean {
  if (wslCache !== null) return wslCache;
  if (platform() !== "linux") {
    wslCache = false;
    return false;
  }
  try {
    const version = readFileSync("/proc/version", "utf8").toLowerCase();
    wslCache = version.includes("microsoft") || version.includes("wsl");
  } catch {
    wslCache = false;
  }
  return wslCache;
}

/**
 * Detects CI environments. Checks standard CI env vars.
 */
export function isCi(): boolean {
  return Boolean(
    process.env.CI ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.BUILDKITE,
  );
}

/**
 * Detects headless Linux (no graphical display).
 * WSL is NOT headless because it can open browsers on the Windows host.
 */
export function isHeadlessLinux(): boolean {
  if (platform() !== "linux") return false;
  if (isWsl()) return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
}

/**
 * Checks if a command exists in PATH. Handles Windows .exe/.cmd/.bat
 * extensions automatically.
 */
export function hasCommand(cmd: string): boolean {
  const separator = platform() === "win32" ? ";" : ":";
  const paths = (process.env.PATH || "").split(separator);
  const exts = platform() === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const p of paths) {
    for (const ext of exts) {
      if (existsSync(`${p}/${cmd}${ext}`)) return true;
    }
  }
  return false;
}

// --- Output mode detection (shared by json-mode + next-steps) ---

export type OutputMode = "human" | "json";

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
