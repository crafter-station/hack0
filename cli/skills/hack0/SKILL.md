---
name: hack0
description: "Install, update and check hack0 workshop skills and materials with the hack0 CLI. Use when the user bought a hack0 workshop, pastes a hack0 license key (h0_...), asks to install a workshop's skills, wants the free hack0 toolkit, or asks whether their workshop material is up to date."
---

# hack0

`hack0` installs the skills and materials from hack0 workshops into the current project. Output is one JSON envelope on stdout whenever stdout is piped, so parse `result`, `error.code` and `nextSteps`.

## Common flows

Free toolkit, no account:

```bash
hack0 list
hack0 add hack0-toolkit
```

A paid workshop, with the key from the purchase email:

```bash
hack0 login h0_XXXXXXXX        # or export HACK0_KEY
hack0 add 01-taste-hacking
```

Keep everything current:

```bash
hack0 update --dry-run
hack0 update
```

## Where files land

- skills go to `./.claude/skills/<name>/`, or `./.agents/skills/<name>/` with `--agent agents`
- materials (slides, cases, sessions) go to `./hack0/<id>/`
- `--global` puts both under the home folder

`add` refuses to overwrite a folder it did not create (`install.conflict`, exit 7). Ask the user before retrying with `--force`.

## Errors worth handling

| code | exit | what to do |
|---|---|---|
| `auth.missing-key` | 3 | ask for the key from the purchase email, then `hack0 login` |
| `auth.rejected` | 3 | the key is wrong or was rotated; `hack0 auth recover <email>` |
| `entitlement.missing` | 5 | this key did not buy that workshop |
| `not-found` | 4 | check the id with `hack0 list` |
| `network` | 6 | retryable |

Never print the license key back to the user or into files other than the hack0 config.

If something breaks, send it: `hack0 feedback "<what happened>"`.

Run `hack0 schema` for every command and its result shape.
