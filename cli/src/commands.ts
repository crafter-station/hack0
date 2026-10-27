import { relative } from "node:path";
import { api } from "./api.js";
import { promptSecret } from "./cli/agent/prompt-secret.js";
import { bold, dim, muted, ok, padVisible, warn } from "./cli/platform/style.js";
import { apiUrl, clearKey, loadKey, readLedger, saveKey, writeLedger } from "./config.js";
import { type Agent, type Bundle, CONTRACT_VERSION, type ExitCode } from "./contract.js";
import { applyInstall, conflicts, planInstall, record } from "./install.js";
import { type Ctx, emitResult, fail } from "./output.js";
import { pack } from "./pack.js";
import { SKILL } from "./skill.js";
import { VERSION } from "./version.js";

export type Args = { _: string[]; [key: string]: unknown };

const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);

function requireAdmin(): string {
  const token = process.env.HACK0_ADMIN_TOKEN;
  if (!token) throw fail("auth.admin-missing", "HACK0_ADMIN_TOKEN is not set.");
  return token;
}

function agentFlag(args: Args): Agent {
  const value = str(args.agent) ?? "claude";
  if (value !== "claude" && value !== "agents") throw fail("usage", `--agent must be claude or agents, got ${value}.`);
  return value;
}

export async function login(ctx: Ctx, args: Args): Promise<ExitCode> {
  let key = str(args.key) ?? str(args._[0]) ?? process.env.HACK0_KEY;
  if (!key) key = (await promptSecret("License key: ")) ?? undefined;
  if (!key) throw fail("usage", "No key given.", "Pass it as hack0 login <key>, or set HACK0_KEY.");
  const me = await api.me(key);
  const file = saveKey(key, me.email);
  return emitResult(
    ctx,
    { email: me.email, workshops: me.workshops, savedTo: file },
    [{ command: "hack0 list", reason: "see what you can install" }],
    (r) => {
      process.stdout.write(`${ok("logged in")}  ${r.email}\n`);
      process.stdout.write(`${dim("workshops")}  ${r.workshops.join(", ") || muted("none yet")}\n`);
    },
  );
}

export async function status(ctx: Ctx): Promise<ExitCode> {
  const found = loadKey();
  if (!found) {
    return emitResult(ctx, { loggedIn: false }, [{ command: "hack0 login", reason: "store your license key" }], () =>
      process.stdout.write(`${warn("not logged in")}\n`),
    );
  }
  const me = await api.me(found.key);
  return emitResult(ctx, { loggedIn: true, source: found.source, ...me }, [], (r) => {
    process.stdout.write(`${ok("logged in")}  ${r.email} ${muted(`(key from ${r.source})`)}\n`);
    process.stdout.write(`${dim("workshops")}  ${r.workshops.join(", ") || muted("none yet")}\n`);
  });
}

export async function logout(ctx: Ctx): Promise<ExitCode> {
  const removed = clearKey();
  return emitResult(ctx, { removed }, [], (r) => process.stdout.write(r.removed ? `${ok("logged out")}\n` : `${muted("no stored key")}\n`));
}

export async function recover(ctx: Ctx, args: Args): Promise<ExitCode> {
  const email = str(args.email) ?? str(args._[0]);
  if (!email) throw fail("usage", "Pass the email you bought with: hack0 auth recover <email>.");
  await api.recover(email);
  return emitResult(ctx, { email, requested: true }, [], () =>
    process.stdout.write(`If ${email} bought a workshop, a new key is on its way. The old one stops working.\n`),
  );
}

export async function list(ctx: Ctx): Promise<ExitCode> {
  const { items } = await api.catalog(loadKey()?.key);
  const installed = new Map(readLedger().map((r) => [r.id, r.version]));
  const rows = items.map((item) => ({ ...item, installed: installed.get(item.id) ?? null }));
  const next = rows
    .filter((r) => (r.free || r.owned) && !r.installed)
    .map((r) => ({
      command: `hack0 add ${r.id}`,
      reason: `install ${r.title}`,
    }));
  return emitResult(ctx, { items: rows }, next, (r) => {
    const width = Math.max(...r.items.map((i) => i.id.length), 4) + 2;
    for (const item of r.items) {
      const access = item.free ? muted("free") : item.owned ? ok("owned") : warn("locked");
      const inst = item.installed ? dim(`installed ${item.installed}`) : "";
      process.stdout.write(`${padVisible(bold(item.id), width)}${padVisible(access, 8)}${item.title}  ${inst}\n`);
    }
  });
}

async function fetchBundle(id: string): Promise<Bundle> {
  return api.bundle(id, loadKey()?.key);
}

export async function add(ctx: Ctx, args: Args): Promise<ExitCode> {
  const id = str(args._[0]);
  if (!id) throw fail("usage", "Which package? hack0 add <id>. See hack0 list.");
  const agent = agentFlag(args);
  const global = Boolean(args.global);
  const bundle = await fetchBundle(id);
  const ledger = readLedger();
  const plan = planInstall(bundle, { agent, global, cwd: process.cwd() });
  // Each project keeps its own install; matching on root keeps an add here from touching another project.
  const previous = ledger.find((r) => r.id === id && r.agent === agent && r.root === plan.root);
  const blocked = conflicts(plan, previous?.paths ?? []);
  if (blocked.length > 0 && !args.force) {
    throw fail(
      "install.conflict",
      `These folders exist and hack0 did not create them: ${blocked.join(", ")}`,
      "Move them, or pass --force to replace them.",
    );
  }
  const result = {
    id: bundle.id,
    version: bundle.version,
    from: previous?.version ?? null,
    dirs: plan.dirs,
    files: plan.writes.length,
    links: bundle.links,
    dryRun: Boolean(args.dryRun),
  };
  if (!args.dryRun) {
    applyInstall(plan, previous?.paths ?? []);
    writeLedger([...ledger.filter((r) => r !== previous), record(bundle, plan, agent, global)]);
  }
  return emitResult(ctx, result, [], (r) => {
    const verb = r.dryRun ? "would install" : r.from ? "updated" : "installed";
    const version = r.from && r.from !== r.version ? `${r.from} → ${r.version}` : r.version;
    process.stdout.write(`${ok(verb)} ${bold(r.id)} ${version}  ${muted(`${r.files} files`)}\n`);
    for (const dir of r.dirs) process.stdout.write(`  ${dim(relative(process.cwd(), dir) || dir)}\n`);
    for (const link of r.links) process.stdout.write(`  ${link.title}: ${link.url}\n`);
  });
}

export async function update(ctx: Ctx, args: Args): Promise<ExitCode> {
  const only = str(args._[0]);
  const ledger = readLedger().filter((r) => !only || r.id === only);
  if (ledger.length === 0) throw fail("not-found", only ? `${only} is not installed.` : "Nothing installed yet.", "Run hack0 list.");
  const results: { id: string; from: string; to: string; changed: boolean }[] = [];
  let all = readLedger();
  for (const rec of ledger) {
    const bundle = await fetchBundle(rec.id);
    if (bundle.version !== rec.version && !args.dryRun) {
      const plan = planInstall(bundle, { agent: rec.agent, global: rec.global, cwd: rec.root });
      applyInstall(plan, rec.paths);
      all = [
        ...all.filter((r) => !(r.id === rec.id && r.agent === rec.agent && r.root === rec.root)),
        record(bundle, plan, rec.agent, rec.global),
      ];
    }
    results.push({ id: rec.id, from: rec.version, to: bundle.version, changed: bundle.version !== rec.version });
  }
  if (!args.dryRun) writeLedger(all);
  return emitResult(ctx, { updates: results, dryRun: Boolean(args.dryRun) }, [], (r) => {
    for (const u of r.updates) {
      process.stdout.write(
        u.changed
          ? `${ok(r.dryRun ? "would update" : "updated")} ${bold(u.id)} ${u.from} → ${u.to}\n`
          : `${muted("current")} ${u.id} ${u.from}\n`,
      );
    }
  });
}

export async function feedback(ctx: Ctx, args: Args): Promise<ExitCode> {
  const message = args._.join(" ").trim();
  if (!message) throw fail("usage", 'Say what happened: hack0 feedback "add failed on Windows".');
  const res = await api.feedback(message, { version: VERSION, platform: process.platform, node: process.version, api: apiUrl() });
  return emitResult(ctx, { id: res.id }, [], () => process.stdout.write(`${ok("sent")}  thanks, it reaches the hack0 team directly.\n`));
}

export async function grant(ctx: Ctx, args: Args): Promise<ExitCode> {
  const [email, workshop] = [str(args._[0]), str(args._[1])];
  if (!email || !workshop) throw fail("usage", "hack0 admin grant <email> <workshop> [--note text] --apply");
  const preview = { email: email.toLowerCase(), workshop, note: str(args.note) ?? null };
  if (!args.apply) {
    return emitResult(
      ctx,
      { ...preview, applied: false },
      [{ command: `hack0 admin grant ${email} ${workshop} --apply`, reason: "grant access and email the key" }],
      (r) => process.stdout.write(`${warn("preview")}  would grant ${bold(r.workshop)} to ${r.email} and email them. Add --apply.\n`),
    );
  }
  const res = await api.grant(requireAdmin(), preview.email, workshop, preview.note ?? undefined);
  return emitResult(ctx, { ...res, applied: true }, [], (r) =>
    process.stdout.write(`${ok("granted")}  ${r.workshop} → ${r.email}${r.newKey ? " (new key)" : ""}${r.emailed ? ", emailed" : ""}\n`),
  );
}

export async function publish(ctx: Ctx, args: Args): Promise<ExitCode> {
  const dir = str(args._[0]) ?? ".";
  const bundle = pack(dir);
  const summary = {
    id: bundle.id,
    version: bundle.version,
    free: bundle.free,
    files: bundle.files.length,
    bytes: Buffer.byteLength(JSON.stringify(bundle)),
  };
  if (!args.apply) {
    return emitResult(
      ctx,
      { ...summary, applied: false },
      [{ command: `hack0 admin publish ${dir} --apply`, reason: "make this the latest version for every buyer" }],
      (r) =>
        process.stdout.write(
          `${warn("preview")}  ${bold(r.id)} ${r.version}, ${r.files} files, ${(r.bytes / 1024).toFixed(0)} KB${r.free ? ", free" : ""}. Add --apply.\n`,
        ),
    );
  }
  await api.publish(requireAdmin(), bundle);
  return emitResult(ctx, { ...summary, applied: true }, [], (r) => process.stdout.write(`${ok("published")}  ${r.id} ${r.version}\n`));
}

export async function linkEdition(ctx: Ctx, args: Args): Promise<ExitCode> {
  const [eventId, workshop] = [str(args._[0]), str(args._[1])];
  if (!eventId || !workshop) throw fail("usage", "hack0 admin edition <luma-event-id> <workshop> [--label 2026-11]");
  const res = await api.linkEdition(requireAdmin(), eventId, workshop, str(args.label));
  return emitResult(ctx, res, [], (r) => process.stdout.write(`${ok("linked")}  Luma ${r.eventId} → ${r.workshop}\n`));
}

export const SCHEMA = {
  version: CONTRACT_VERSION,
  cli: VERSION,
  commands: [
    { command: "login [key]", alias: "auth login", writes: "config file (0600)", result: "{ email, workshops, savedTo }" },
    { command: "auth status", result: "{ loggedIn, source?, email?, workshops? }" },
    { command: "auth logout", writes: "config file", result: "{ removed }" },
    { command: "auth recover <email>", writes: "rotates the key server-side", result: "{ email, requested }" },
    { command: "list", alias: "workshops list", result: "{ items: [{ id, title, version, free, owned, installed }] }" },
    {
      command: "add <id> [--agent claude|agents] [--global] [--force] [--dry-run]",
      alias: "workshops add",
      writes: "skills and materials folders",
      result: "{ id, version, from, dirs, files, links, dryRun }",
    },
    {
      command: "update [id] [--dry-run]",
      alias: "workshops update",
      writes: "installed folders",
      result: "{ updates: [{ id, from, to, changed }], dryRun }",
    },
    { command: "feedback <message>", result: "{ id }" },
    {
      command: "admin grant <email> <workshop> [--note] [--apply]",
      trust: "admin, sends an email",
      result: "{ email, workshop, newKey, emailed, applied }",
    },
    {
      command: "admin publish <dir> [--apply]",
      trust: "admin, replaces the latest version",
      result: "{ id, version, free, files, bytes, applied }",
    },
    { command: "admin edition <event-id> <workshop> [--label]", trust: "admin", result: "{ eventId, workshop }" },
    { command: "skills get", result: "SKILL.md text" },
    { command: "schema", result: "this document" },
  ],
  exitCodes: { ok: 0, runtime: 1, usage: 2, auth: 3, notFound: 4, forbidden: 5, network: 6, conflict: 7 },
};

export async function schema(ctx: Ctx): Promise<ExitCode> {
  return emitResult(ctx, SCHEMA);
}

export async function skills(ctx: Ctx, args: Args): Promise<ExitCode> {
  const verb = str(args._[0]) ?? "list";
  if (verb === "list") {
    return emitResult(
      ctx,
      { skills: [{ name: "hack0", version: VERSION }] },
      [{ command: "hack0 skills get", reason: "read the guide" }],
      () => process.stdout.write(`hack0  ${muted("how an agent installs and updates workshop skills")}\n`),
    );
  }
  if (verb === "get") return emitResult(ctx, { name: "hack0", content: SKILL }, [], (r) => process.stdout.write(r.content));
  throw fail("usage", `Unknown: skills ${verb}. Use skills list or skills get.`);
}
