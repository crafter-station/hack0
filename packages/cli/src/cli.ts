import { parseArgv } from "./cli/foundation/argv.js";
import { printBanner } from "./cli/foundation/banner.js";
import { detectMode } from "./cli/platform/detect.js";
import { dim, muted } from "./cli/platform/style.js";
import * as cmd from "./commands.js";
import { EXIT, type ExitCode } from "./contract.js";
import { type Ctx, emitError, fail } from "./output.js";
import { VERSION } from "./version.js";

const HELP = `${dim("USAGE")}
  hack0 <command> [args] [flags]

${dim("START HERE")}
  hack0 list                  workshops and free packages, and what you own
  hack0 add <id>              install a package's skills into ./.claude/skills
  hack0 login <key>           store the license key from your purchase email
  hack0 update                bring every installed package to its latest version

${dim("ACCOUNT")}
  hack0 auth status           who you are and what you own
  hack0 auth logout           forget the stored key
  hack0 auth recover <email>  lost the key? get a new one by email

${dim("MORE")}
  hack0 feedback <message>    tell us what broke or what is missing
  hack0 skills get            the guide for agents, matching this version
  hack0 schema                every command and its JSON result

${dim("FLAGS")}
  --agent claude|agents       install into .claude/skills (default) or .agents/skills
  --global                    install under your home folder instead of here
  --dry-run                   show what add or update would change
  --force                     replace folders hack0 did not create
  --json                      one JSON envelope on stdout (automatic when piped)

${muted("organizers: hack0 admin grant | publish | edition, with HACK0_ADMIN_TOKEN")}
`;

type Handler = (ctx: Ctx, args: cmd.Args) => Promise<ExitCode>;

const ROUTES: Record<string, Handler> = {
  login: cmd.login,
  "auth login": cmd.login,
  "auth status": cmd.status,
  "auth logout": cmd.logout,
  "auth recover": cmd.recover,
  list: cmd.list,
  "workshops list": cmd.list,
  add: cmd.add,
  "workshops add": cmd.add,
  update: cmd.update,
  "workshops update": cmd.update,
  feedback: cmd.feedback,
  "admin grant": cmd.grant,
  "admin publish": cmd.publish,
  "admin edition": cmd.linkEdition,
  skills: cmd.skills,
  schema: cmd.schema,
};

function route(positional: string[]): { name: string; handler: Handler; rest: string[] } | null {
  const two = positional.slice(0, 2).join(" ");
  if (ROUTES[two]) return { name: two, handler: ROUTES[two], rest: positional.slice(2) };
  const one = positional[0];
  if (one && ROUTES[one]) return { name: one, handler: ROUTES[one], rest: positional.slice(1) };
  return null;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<ExitCode> {
  const args = parseArgv(argv) as cmd.Args;
  const flags = { json: Boolean(args.json), quiet: Boolean(args.quiet) };

  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return EXIT.ok;
  }

  const found = route(args._);
  if (args.help || !found) {
    if (args._.length > 0 && !found) {
      return emitError({ command: args._.join(" "), flags }, fail("usage", `Unknown command: ${args._.join(" ")}.`, "Run hack0 --help."));
    }
    if (detectMode(flags) === "human") printBanner({ name: "hack0", tagline: "workshop skills for your agent", version: VERSION });
    process.stdout.write(HELP);
    return EXIT.ok;
  }

  const ctx: Ctx = { command: found.name, flags };
  try {
    return await found.handler(ctx, { ...args, _: found.rest });
  } catch (error) {
    return emitError(ctx, error);
  }
}
