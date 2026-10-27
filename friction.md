# friction

- Phase 0: mixed. Defined model, Luma discovered at the boundary. Signature format read from help.luma.com/p/webhooks; guest payload fields (`user_email`, `approval_status`, `event.id`) from docs.luma.com/reference/webhook_guest_registered. Not yet tested against a real delivery.
- Yape converges on Luma: the buyer gets a 100% coupon and registers, and Luma fires `guest.registered` for that too. `admin grant` stays as the fallback for anything outside Luma.
- No blob store: bundles live in Postgres as jsonb. Skills and slides fit; video and big PDFs go as links. One system fewer to provision.
- Key is a license key, not a password: stored in the config file at 0600, `HACK0_KEY` env wins. Recovery rotates instead of re-sending, since only the hash is stored.
- Blocks adopted from spaceship-cli's cligentic copy: argv, atomic-write, banner, error-map, global-flags, xdg-paths, detect, style, prompt-secret. Rejected json-mode: its emit splits arrays into NDJSON, and the envelope is one object per command.
- Safety: the only consequential writes are admin (grant sends an email, publish replaces a version). Both preview by default and need `--apply`. Buyer commands write only local files they own; `add` refuses to overwrite a directory hack0 did not install unless `--force`.
- Bug caught in e2e: the ledger matched installs by id and agent only, so `add` in a second project treated the first project's install as its own and deleted it. Installs now match on root too.
- Bug caught in e2e: postgres.js double-encoded a JSON string bound to `::jsonb`, so bundles were stored as jsonb strings. Binding as `::text::jsonb` stores objects with both drivers.
- Bug caught in e2e: a `import.meta.main` guard in cli.ts ran `main` twice once bundled. The dev entry moved to `src/run.ts`.
- Not verified yet: a real Luma delivery, Neon over HTTP, a real Resend send, and `npx @crafter/hack0` from the registry.
