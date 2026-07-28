# hack0 Setup and Data Sources

> **Current (2026-07-27):** this stack stays (Next.js/Neon/Clerk/Vercel/Trigger.dev). Community/badge features are being added in place — see [`consolidation-plan.md`](./consolidation-plan.md) and `ROADMAP.md` §7.

This project is a Next.js app for discovering LATAM hackathons, builder events,
communities, and organizations.

## Stack

- Runtime/package manager: Bun
- App framework: Next.js 16, React 19, TypeScript
- Styling/UI: Tailwind CSS 4, Radix UI, shadcn-style components, lucide-react
- Database: Neon PostgreSQL
- ORM/migrations: Drizzle ORM and Drizzle Kit
- Auth: Clerk
- Background jobs: Trigger.dev v4
- Scraping/data ingestion: native `fetch`, Cheerio, Firecrawl, Exa, Perplexity
- AI processing: Vercel AI SDK/OpenAI-compatible gateway
- Email: Resend
- Uploads/images: UploadThing, fal.ai, Next image config
- Formatting/linting: Biome

## Local Setup

1. Install Bun: https://bun.sh/docs/installation
2. Install dependencies:

```bash
bun install
```

3. Create a local env file:

```bash
cp .env.example .env.local
```

4. Fill the required variables:

```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
AI_GATEWAY_API_KEY=...
```

5. Push or run database migrations:

```bash
bun run db:push
```

6. Start the app:

```bash
bun run dev
```

## Optional Services

Use only the services needed for the workflow being tested.

- `TRIGGER_PROJECT_ID` and `TRIGGER_SECRET_KEY`: scheduled/background jobs.
- `FIRECRAWL_API_KEY`: Firecrawl-backed organization/event extraction.
- `PERPLEXITY_API_KEY`: Perplexity discovery source.
- `EXA_API_KEY`: Exa discovery source.
- `RESEND_API_KEY`: transactional email.
- `UPLOADTHING_TOKEN`: uploads.
- `FAL_API_KEY`: fal.ai image tasks.
- `LUMA_API_KEY`: Luma calendar sync for one calendar.
- `LUMA_API_KEYS`: comma-separated Luma calendar API keys for multiple calendars.
- `LUMA_CONNECTION_ENCRYPTION_KEY`: encrypted Luma connection storage.

## Luma Calendar Source

The current Luma sync uses the official public Luma API:

- Base URL: `https://public-api.luma.com`
- Auth header: `x-luma-api-key`
- Calendar metadata: `GET /v1/calendars/get`
- Calendar events: `GET /v1/calendars/events/list`
- Event details: `GET /v1/events/get?event_id=...`

Luma API keys are scoped to one calendar and require Luma Plus. Create each key
from the calendar's developer/API key settings and store it only in `.env.local`
or your deployment secret store. Use `LUMA_API_KEY` for one calendar or
`LUMA_API_KEYS` for multiple comma-separated calendar keys.

Run without Trigger:

```bash
bun run sync:luma --dry-run
bun run sync:luma --future-only --limit=100
bun run sync:luma --limit=500
```

Behavior:

- Events from the configured Luma calendar are inserted or updated directly.
- With `LUMA_API_KEYS`, the same limit is applied per calendar key.
- Imported Luma events are approved automatically because the calendar is owned.
- `--future-only` imports only upcoming/future events.
- Without `--future-only`, past and future events are included.
- `--dry-run` reports create/update decisions without writing to the database.

Reference docs:

- https://docs.luma.com/reference/getting-started-with-your-api
- https://docs.luma.com/reference/get_v1-calendars-get
- https://public-api.luma.com/openapi.json

## Devpost Hackathon Source

Devpost does not publish a stable official hackathon listing API for external
aggregators. The scraper uses Devpost's public JSON listing endpoint:

```text
https://devpost.com/api/hackathons
```

It fetches all pages reported by `meta.total_count` for every configured sweep,
deduplicates by Devpost slug/URL, enriches each event page with native `fetch`
and Cheerio, then post-processes and normalizes records before insert.

Run without Trigger:

```bash
bun run sync:devpost --dry-run
bun run sync:devpost
```

Useful debugging mode:

```bash
bun run sync:devpost --dry-run --skip-post-process
```

Behavior:

- Devpost records go to the curation queue with `approvalStatus: pending`.
- The scraper fetches LATAM search sweeps, global open/upcoming sweeps, deadline
  sweeps, in-person sweeps, and relevant theme sweeps.
- There is no internal fixed page cap. Each sweep reads all pages Devpost reports
  through `meta.total_count`.
- Detail enrichment does not use Firecrawl credits; it uses native HTML fetch.
- Post-processing is still recommended because global Devpost results can include
  non-LATAM or non-hackathon events.

## Trigger-Free Import Path

Use these commands when Trigger.dev is unavailable or credits are exhausted.
They are read-only by default:

```bash
bun run sync:luma --future-only --limit=100
bun run sync:devpost
```

The report shows what would be inserted without changing the database. Writes
require all of the following:

1. Pass `--write` to the sync command.
2. Set `HACK0_DATABASE_ENV` to `development`, `staging`, or `production`.
3. Set `HACK0_ALLOW_WRITES=true`.
4. For production, also set `HACK0_ALLOW_PRODUCTION_WRITES=true`.

Do not keep the production confirmation enabled in local env files. Enable it
only for an explicitly approved production operation, then remove it.

Expected outcomes in write mode:

- Luma source: approved events from the Hack0 calendar.
- Devpost source: pending events for manual curation.
- Deduplication checks provider IDs, canonical URLs, and name/date/location.
- Possible matches are held for review instead of being inserted.
- Slug collisions receive a deterministic suffix; a shared slug alone is not
  considered proof that two events are the same.

Trigger scraper tasks also default to dry-run. Their orchestrators remain
read-only until the production deployment phase explicitly enables validated
sources.

The complete per-source validation and release gate is documented in
[`event-ingestion-rollout.md`](./event-ingestion-rollout.md).

## Validation

Run checks after changes:

```bash
bun run check
bun run build
```

For database-connected scripts, validate env first:

```bash
bun run test:ingestion
bun run sync:luma --future-only --limit=5
bun run sync:devpost --skip-post-process
```

## Notes

- Context7 is not available in this Codex session, so the implementation was
  checked against Luma's official docs/OpenAPI and the live Devpost public
  endpoint behavior.
- Keep API keys out of git. Only commit `.env.example`, never `.env.local`.
