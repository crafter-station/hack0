export type ShellTokenKind = "bin" | "pkg" | "sub" | "flag" | "placeholder" | "email" | "path" | "arg" | "space";
export type ShellToken = { kind: ShellTokenKind; text: string };

const RUNNERS = new Set(["npx", "bunx", "pnpx"]);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** What a word is by its shape alone, wherever it sits in the command. */
function shapeOf(text: string): ShellTokenKind | null {
  if (/^<.+>$/.test(text)) return "placeholder";
  if (text.startsWith("-")) return "flag";
  if (EMAIL.test(text)) return "email";
  if (/^(~|\.{1,2})?\//.test(text) || /^[\w.-]+\/[\w./-]+$/.test(text)) return "path";
  return null;
}

/** Splits one shell command into tokens for display. Joining the token texts gives the command back. */
export function tokenizeShell(line: string): ShellToken[] {
  const out: ShellToken[] = [];
  let words = 0;
  let runner = false;
  // Subcommands are the bare words right after the binary (or the package a runner executes).
  let subs = false;
  for (const text of line.match(/<[^<>\n]+>|\s+|[^\s<]+|</g) ?? []) {
    if (/^\s+$/.test(text)) {
      out.push({ kind: "space", text });
      continue;
    }
    words += 1;
    let kind: ShellTokenKind = "arg";
    if (words === 1) {
      kind = "bin";
      runner = RUNNERS.has(text);
      subs = !runner;
    } else if (words === 2 && runner && !text.startsWith("-")) {
      kind = "pkg";
      subs = true;
    } else {
      kind = shapeOf(text) ?? (subs && /^[a-z][a-z-]*$/.test(text) ? "sub" : "arg");
    }
    if (kind !== "sub" && kind !== "bin" && kind !== "pkg" && kind !== "flag") subs = false;
    out.push({ kind, text });
  }
  return out;
}
