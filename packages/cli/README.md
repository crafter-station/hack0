# @crafter/hack0

Install hack0 workshop skills and materials into your coding agent.

```sh
npx @crafter/hack0 login <key>        # license key from your purchase email
npx @crafter/hack0 list               # workshops and free packages, and what you own
npx @crafter/hack0 add <id>           # skills into ./.claude/skills, materials into ./hack0/<id>
npx @crafter/hack0 update             # bring installed packages to their latest version
```

Flags: `--agent claude|agents`, `--global`, `--dry-run`, `--force`, `--json`.

Lost the key: `npx @crafter/hack0 auth recover <email>`. Agents: `npx @crafter/hack0 skills get`. Every command and its JSON result: `npx @crafter/hack0 schema`.

Organizers use `hack0 admin grant | publish | edition` with `HACK0_ADMIN_TOKEN`. `HACK0_API_URL` points the CLI at another server.
