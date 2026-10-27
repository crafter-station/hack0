# Handoff (2026-10-27)

State: CLI and API built and tested end to end against a local Postgres. No remote, no deploy, nothing published.

## Verified

- `cli`: 12 tests, `web`: 3 tests, typecheck and Biome clean.
- E2E with a local API: signed Luma webhook (new buyer, duplicate delivery, bad signature), login, free and paid add, conflict refusal (exit 7), reinstall, update 0.1.0 to 0.2.0 with dry run, feedback, grant to an existing buyer, key recovery with rotation.
- Human TTY output and piped JSON checked. The bin runs under Node.

## Not verified

- A real Luma delivery (signature format and payload come from the docs, see `CONTRACT.md`).
- Neon over HTTP (local runs use the `postgres` client path in `web/lib/db.ts`).
- A real Resend send. Without `RESEND_API_KEY`, development prints keys to the server log.
- `npx @crafter/hack0` from the registry.

## To go live

1. Create the GitHub repo and push.
2. Create the Neon database and apply `web/schema.sql`.
3. Create the Vercel project with root `web/` and set the env vars from the README. `DEFAULT_API` in `cli/src/config.ts` is `https://hack0.dev`; change it if the API lives elsewhere.
4. Verify the Resend sending domain and set `HACK0_MAIL_FROM`.
5. Create the Luma webhook (`guest.registered`) pointing at `/api/v1/webhooks/luma`, then `hack0 admin edition <event-id> <workshop>`.
6. `hack0 admin publish workshops/hack0-toolkit --apply` and the same for each workshop.
7. Publish `@crafter/hack0` to npm.

## Known limits

- Bundles max out at 4 MB (Vercel request limit). Recordings and big PDFs go in `links`.
- `workshops/01-taste-hacking/slides` is a placeholder.
- A rebrand of hack0 is next. The CLI banner, mail sender, default API URL and copy will change.
