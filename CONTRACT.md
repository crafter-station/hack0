# hack0 contract

Origin: mixed. The entitlement model, packages and CLI are defined here. Luma is discovered at the boundary (webhook `guest.registered`, signature `Webhook-Signature: t=<ts>,v1=<hex>` = HMAC-SHA256 of `{t}.{raw body}` with the `whsec_` secret, per help.luma.com/p/webhooks). Webhooks need Luma Plus.

## Entities

- buyer: `id`, `email` (unique, lowercase), `key_hash` (sha256 of the license key), `created_at`
- entitlement: `buyer_id`, `workshop_id`, `source` (`luma` | `grant`), `ref` (Luma guest id or operator note), `granted_at`. Unique on (`buyer_id`, `workshop_id`)
- edition: `event_id` (Luma event id), `workshop_id`, `label`
- package: `id`, `version`, `title`, `free`, `bundle` (jsonb: files and links), `published_at`. Latest version wins
- feedback: `id`, `message`, `context` (jsonb), `created_at`

## Operations

| Operation | Who | Irreversible |
|---|---|---|
| catalog read | anyone | no |
| package read (free) | anyone | no |
| package read (paid) | key with entitlement | no |
| me read | key | no |
| key recover | anyone with a buyer email; rotates the key and emails it | old key stops working |
| webhook guest.registered | Luma (signed) | creates buyer, entitlement, sends email |
| grant | admin token | sends an email |
| publish package | admin token | replaces latest version |
| link edition | admin token | no |
| feedback | anyone | no |

## License key

`h0_` + 32 base32 chars. Shown once, by email. Only the hash is stored. One key per buyer; a new workshop adds an entitlement to the same key.

## Package bundle

A workshop folder has `hack0.json`:

```json
{ "id": "01-taste-hacking", "title": "Taste hacking", "version": "0.1.0", "free": false,
  "skills": ["skills/taste-hacking"], "materials": ["slides", "cases", "sessions"],
  "links": [{ "title": "Recording", "url": "https://..." }] }
```

`publish` packs it into `{ files: [{ path, kind: "skill"|"material", encoding: "utf8"|"base64", content }], links }`. Bodies over 4 MB are refused (Vercel request limit); large media go in `links`.

## Install layout

- skills: `./.claude/skills/<name>/` by default; `--agent agents` writes `./.agents/skills/<name>/`; `--global` writes under the home directory instead
- materials: `./hack0/<id>/`
- ledger: `<config>/installs.json`, used by `update`
