// cligentic block: style
//
// Terminal styling primitives that respect NO_COLOR and non-TTY, plus the
// width helpers a table needs once its cells contain escape codes.
//
// Every function routes through shouldColor() from `detect`, so NO_COLOR, a
// pipe, and CI turn styling off in one place instead of at each call site.
// That matters more than it looks: styling applied per call site is styling
// that leaks into a piped stream the first time someone forgets the check.
//
// Usage:
//   import { bold, dim, red, visibleWidth, padVisible } from "./platform/style.js";
//
//   const header = bold("Theater");
//   const line = padVisible(header, 20) + padVisible(bold("Seats"), 8);
//
// The color set is 256-color rather than the basic 8. The basic red and green
// render as whatever the user's theme assigns them, which on a light terminal
// can be unreadable and on a themed dark one can be indistinguishable from
// each other. Fixed 256 indices look the same everywhere a 256-color terminal
// is present, which is nearly all of them.

import { shouldColor } from "./detect.js";

const wrap = (code: string, text: string): string => (shouldColor() ? `\x1b[${code}m${text}\x1b[0m` : text);

// Attributes.
export const bold = (t: string): string => wrap("1", t);
export const dim = (t: string): string => wrap("2", t);
export const italic = (t: string): string => wrap("3", t);
export const underline = (t: string): string => wrap("4", t);

// A fixed 256-color set. Semantic names, not color names, so a call site reads
// as intent and the palette can change without touching it.
export const danger = (t: string): string => wrap("38;5;203", t);
export const warn = (t: string): string => wrap("38;5;214", t);
export const ok = (t: string): string => wrap("38;5;114", t);
export const info = (t: string): string => wrap("38;5;110", t);
export const muted = (t: string): string => wrap("38;5;245", t);
export const strong = (t: string): string => wrap("38;5;255", t);
export const faint = (t: string): string => wrap("38;5;238", t);

/**
 * Visible length, ignoring ANSI escape sequences.
 *
 * `"\x1b[1mHi\x1b[0m".length` is 12 and its width on screen is 2. Any column
 * alignment that uses `.length` on styled text is wrong by the size of the
 * escapes, and the breakage is invisible in tests because test runners have no
 * TTY, so `shouldColor()` returns false and the escapes are never there.
 */
export function visibleWidth(text: string): number {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: measuring without ANSI is the point
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/** Right-pads to a visible width, so styled and plain cells align. */
export function padVisible(text: string, width: number): string {
  const missing = width - visibleWidth(text);
  return missing > 0 ? text + " ".repeat(missing) : text;
}

/** Left-pads to a visible width, for numeric columns. */
export function padStartVisible(text: string, width: number): string {
  const missing = width - visibleWidth(text);
  return missing > 0 ? " ".repeat(missing) + text : text;
}

/**
 * Truncates to a visible width, appending an ellipsis when it cuts.
 *
 * Styled text is returned unstyled when truncated, because cutting inside an
 * escape sequence produces a terminal stuck in that color for the rest of the
 * line. Losing the style on a truncated cell is the cheaper failure.
 */
export function truncateVisible(text: string, width: number): string {
  if (visibleWidth(text) <= width) return text;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: see visibleWidth
  const plain = text.replace(/\x1b\[[0-9;]*m/g, "");
  return width <= 1 ? plain.slice(0, width) : `${plain.slice(0, width - 1)}…`;
}
