// cligentic block: argv
//
// Minimal POSIX argv parser for zero-framework CLIs.
// No dependencies. Handles --flag, --flag value, --flag=value, -f, positional args.
//
// Usage:
//   import { parseArgv } from "./foundation/argv";
//
//   const args = parseArgv();
//   // myapp --dry-run --output=file.json input.txt
//   // => { _: ["input.txt"], dryRun: true, output: "file.json" }

type ParsedArgs = { _: string[]; [key: string]: unknown };

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Parses process.argv.slice(2) by default, or the provided argv array.
 *
 * Rules:
 *   --flag          → flag: true
 *   --flag value    → flag: "value" (when next token doesn't start with -)
 *   --flag=value    → flag: "value"
 *   -f              → f: true
 *   -fv             → f: true, v: true (combined short flags)
 *   --              → stop flag parsing; rest goes into _
 *   kebab-case keys → camelCase (--dry-run → dryRun)
 */
export function parseArgv(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const result: ParsedArgs = { _: [] };
  const stop = argv.indexOf("--");
  const flags = stop === -1 ? argv : argv.slice(0, stop);
  for (let i = 0; i < flags.length; i++) {
    i += readToken(flags, i, result);
  }
  if (stop !== -1) result._.push(...argv.slice(stop + 1));
  return result;
}

/** Applies the token at `i` to `result`; returns how many extra tokens it consumed. */
function readToken(argv: string[], i: number, result: ParsedArgs): number {
  const arg = argv[i] as string;
  if (arg.startsWith("--")) return readLongFlag(arg, argv[i + 1], result);
  if (arg.startsWith("-") && arg.length > 1) {
    for (const ch of arg.slice(1)) result[ch] = true;
    return 0;
  }
  result._.push(arg);
  return 0;
}

function readLongFlag(arg: string, next: string | undefined, result: ParsedArgs): number {
  const eqIdx = arg.indexOf("=");
  if (eqIdx !== -1) {
    result[kebabToCamel(arg.slice(2, eqIdx))] = arg.slice(eqIdx + 1);
    return 0;
  }
  const key = kebabToCamel(arg.slice(2));
  if (next !== undefined && !next.startsWith("-")) {
    result[key] = next;
    return 1;
  }
  result[key] = true;
  return 0;
}
