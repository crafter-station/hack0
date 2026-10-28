// cligentic block: prompt-secret
//
// Read a secret from the terminal without echoing it.
//
// `readline.question` echoes every keystroke, so a password typed there stays
// visible in the terminal, in the scrollback, and in any recording or shared
// screenshot of the session. This puts the TTY in raw mode, handles the keys
// itself, and prints one dot per character.
//
// Returns null when there is no TTY, so the caller fails with a structured
// error instead of hanging on input that will never arrive. That is the
// behavior an agent needs: a piped or CI invocation should refuse, not block.
//
// No runtime dependency. `api-key-wizard` solves the same problem with
// @clack/prompts, which is the right call when you already have it; this is
// for a CLI that has no dependencies and does not want one for a prompt.
//
// Usage:
//   import { promptSecret } from "./agent/prompt-secret.js";
//
//   const password = await promptSecret("Password: ");
//   if (password === null) {
//     throw new AppError("NO_TTY", "Password required", {
//       hint: "run this in a terminal, or set MYCLI_PASSWORD",
//     });
//   }

import { stdin, stdout } from "node:process";

type PromptSecretOptions = {
  /** Character shown per keystroke. Empty string prints nothing. */
  mask?: string;
};

/**
 * Prompts for a secret on the TTY without echoing it.
 *
 * Resolves with the entered string, or null when stdin is not a TTY.
 * Rejects when the user presses Ctrl-C.
 */
export function promptSecret(label: string, options: PromptSecretOptions = {}): Promise<string | null> {
  const mask = options.mask ?? "•";

  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.resolve(null);
  }

  stdout.write(label);

  return new Promise<string>((resolve, reject) => {
    const chars: string[] = [];
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const cleanup = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    const finish = (done: () => void): void => {
      stdout.write("\n");
      cleanup();
      done();
    };

    /** Handles one keystroke; returns true once the prompt has settled. */
    const onKey = (ch: string): boolean => {
      const code = ch.charCodeAt(0);
      // Enter or Ctrl-D: done.
      if (ch === "\r" || ch === "\n" || code === 4) {
        finish(() => resolve(chars.join("")));
        return true;
      }
      // Ctrl-C: leave the TTY out of raw mode before bailing.
      if (code === 3) {
        finish(() => reject(new Error("cancelled")));
        return true;
      }
      // Backspace or delete.
      if (code === 8 || code === 127) {
        if (chars.pop() !== undefined && mask.length > 0) stdout.write("\b \b");
        return false;
      }
      // Ignore the remaining control codes: arrows, escapes.
      if (code >= 32) {
        chars.push(ch);
        if (mask.length > 0) stdout.write(mask);
      }
      return false;
    };

    const onData = (chunk: string): void => {
      for (const ch of chunk) {
        if (onKey(ch)) return;
      }
    };

    stdin.on("data", onData);
  });
}
