// cligentic block: banner
//
// Gradient ASCII wordmark for your CLI. Shown on bare invoke or --help.
// Respects NO_COLOR and non-TTY environments.
//
// Usage:
//   import { printBanner } from "./foundation/banner";
//
//   printBanner({
//     name: "myapp",
//     tagline: "The CLI for shipping fast.",
//     version: "1.2.0",
//     gradient: ["#FF6B1A", "#DB2627"],
//   });

import { shouldColor } from "../platform/detect.js";

export type BannerOptions = {
  name: string;
  tagline?: string;
  version?: string;
  /** Two hex colors for the vertical gradient [top, bottom]. */
  gradient?: [string, string];
};

/**
 * Prints a branded banner to stderr. Falls back to plain text
 * when NO_COLOR is set or stdout is not a TTY.
 */
export function printBanner(opts: BannerOptions): void {
  const { name, tagline, version, gradient = ["#FFFFFF", "#8A8A8A"] } = opts;
  const color = shouldColor();

  if (!color) {
    const v = version ? ` v${version}` : "";
    process.stderr.write(`\n  ${name}${v}\n`);
    if (tagline) process.stderr.write(`  ${tagline}\n`);
    process.stderr.write("\n");
    return;
  }

  const lines = toAsciiBlock(name.toUpperCase());
  const from = hexToRgb(gradient[0]);
  const to = hexToRgb(gradient[1]);

  process.stderr.write("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines.length > 1 ? i / (lines.length - 1) : 0;
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    process.stderr.write(`  \x1b[38;2;${r};${g};${b}m${lines[i] ?? ""}\x1b[0m\n`);
  }

  const meta: string[] = [];
  if (version) meta.push(`v${version}`);
  if (tagline) meta.push(tagline);
  if (meta.length) {
    process.stderr.write(`  \x1b[2m${meta.join("  ·  ")}\x1b[0m\n`);
  }
  process.stderr.write("\n");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Minimal block-letter renderer. Each character is 5 lines tall.
 * Only uppercase A-Z, 0-9, space, and a few symbols. Unknown chars
 * become spaces. The user can replace this with a figlet font if
 * they want fancier output.
 */
const BLANK: readonly string[] = ["     ", "     ", "     ", "     ", "     "];

function toAsciiBlock(text: string): string[] {
  const out: string[] = ["", "", "", "", ""];
  for (let i = 0; i < text.length; i++) {
    const glyph = GLYPHS[text.charAt(i)] ?? BLANK;
    for (let row = 0; row < 5; row++) {
      out[row] = `${out[row] ?? ""}${glyph[row] ?? "     "} `;
    }
  }
  return out;
}

const GLYPHS: Record<string, string[]> = {
  A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  C: [" ████", "█    ", "█    ", "█    ", " ████"],
  D: ["████ ", "█   █", "█   █", "█   █", "████ "],
  E: ["█████", "█    ", "████ ", "█    ", "█████"],
  F: ["█████", "█    ", "████ ", "█    ", "█    "],
  G: [" ████", "█    ", "█  ██", "█   █", " ████"],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  J: ["█████", "    █", "    █", "█   █", " ███ "],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  L: ["█    ", "█    ", "█    ", "█    ", "█████"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  P: ["████ ", "█   █", "████ ", "█    ", "█    "],
  Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
  V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
  X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
  " ": ["     ", "     ", "     ", "     ", "     "],
  "0": [" ███ ", "█  ██", "█ █ █", "██  █", " ███ "],
  "1": [" ██  ", "  █  ", "  █  ", "  █  ", "█████"],
  "2": [" ███ ", "█   █", "  ██ ", " █   ", "█████"],
  "3": ["████ ", "    █", " ███ ", "    █", "████ "],
  "4": ["█   █", "█   █", "█████", "    █", "    █"],
  "5": ["█████", "█    ", "████ ", "    █", "████ "],
  "6": [" ███ ", "█    ", "████ ", "█   █", " ███ "],
  "7": ["█████", "    █", "   █ ", "  █  ", "  █  "],
  "8": [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
  "9": [" ███ ", "█   █", " ████", "    █", " ███ "],
};
