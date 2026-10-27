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

export type ParsedArgs = { _: string[]; [key: string]: unknown };

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
  let i = 0;
  let stopped = false;

  while (i < argv.length) {
    const arg = argv[i];

    if (stopped || arg === undefined) {
      if (arg !== undefined) result._.push(arg);
      i++;
      continue;
    }

    if (arg === "--") {
      stopped = true;
      i++;
      continue;
    }

    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = kebabToCamel(arg.slice(2, eqIdx));
        result[key] = arg.slice(eqIdx + 1);
      } else {
        const key = kebabToCamel(arg.slice(2));
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          result[key] = next;
          i++;
        } else {
          result[key] = true;
        }
      }
      i++;
      continue;
    }

    if (arg.startsWith("-") && arg.length > 1) {
      for (let j = 1; j < arg.length; j++) {
        result[arg[j] as string] = true;
      }
      i++;
      continue;
    }

    result._.push(arg);
    i++;
  }

  return result;
}
