export type ShellTokenKind = "bin" | "pkg" | "sub" | "flag" | "placeholder" | "email" | "path" | "arg" | "space";
export type ShellToken = { kind: ShellTokenKind; text: string };

const RUNNERS = new Set(["npx", "bunx", "pnpx"]);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

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
    } else if (/^<.+>$/.test(text)) kind = "placeholder";
    else if (text.startsWith("-")) kind = "flag";
    else if (EMAIL.test(text)) kind = "email";
    else if (/^(~|\.{1,2})?\//.test(text) || /^[\w.-]+\/[\w./-]+$/.test(text)) kind = "path";
    else if (subs && /^[a-z][a-z-]*$/.test(text)) kind = "sub";
    if (kind !== "sub" && kind !== "bin" && kind !== "pkg" && kind !== "flag") subs = false;
    out.push({ kind, text });
  }
  return out;
}
