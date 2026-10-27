# hack0

Distribution for hack0 workshops. Buyers install a workshop's skills and materials into their coding agent with one command.

```bash
npx @crafter/hack0 list
npx @crafter/hack0 add hack0-toolkit          # free
npx @crafter/hack0 login h0_...               # key from the purchase email
npx @crafter/hack0 add 01-taste-hacking
```

## Layout

- `cli/`: `@crafter/hack0`, the agent-first CLI (bin `hack0`). Ships its own agent guide in `cli/skills/hack0`.
- `web/`: Next.js API on Vercel. Neon holds buyers, entitlements, editions and package bundles. Resend sends keys.
- `workshops/`: one folder per package with a `hack0.json`. `hack0 admin publish <dir> --apply` uploads it.
- `CONTRACT.md`: entities, operations and the install layout. `friction.md`: decisions and what was rejected.

## How a sale becomes an install

1. Link the Luma event once: `hack0 admin edition <luma-event-id> 01-taste-hacking --label 2026-11 --apply`.
2. Someone buys on Luma. Yape buyers get a 100% coupon and register on Luma too.
3. Luma sends `guest.registered`. The API verifies the signature, creates the buyer (or adds the workshop to their existing key) and emails the key.
4. The buyer runs `hack0 login` and `hack0 add`.

Anything outside Luma: `hack0 admin grant <email> <workshop> --apply`.

## Environment (web)

| Variable | What |
|---|---|
| `DATABASE_URL` | Neon connection string. A localhost URL uses a plain Postgres client for development |
| `HACK0_ADMIN_TOKEN` | Shared secret for `hack0 admin` commands |
| `LUMA_WEBHOOK_SECRET` | The `whsec_` secret Luma shows when you create the webhook |
| `RESEND_API_KEY` | Without it, development prints keys to the server log |
| `HACK0_MAIL_FROM` | Sender, default `hack0 <workshops@hack0.dev>` |

Apply `web/schema.sql` to the database once.

## Development

```bash
cd cli && bun install && bun test && bun run build && bun link
cd web && bun install && bun test && DATABASE_URL=... bun dev
HACK0_API_URL=http://localhost:3000 hack0 list
```
