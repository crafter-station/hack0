# hack0 — Services Guide (what each one is for & what to configure)

> **Current (2026-07-27):** this stack stays. hack0 remains on Next.js/Neon/Clerk/Vercel/Trigger.dev; we're adding community/badge features in place (see [`consolidation-plan.md`](./consolidation-plan.md)). Note: fixing data freshness means **deploying** the existing Trigger.dev tasks (`ROADMAP.md` §4 / phase F1).

> Companion to `docs/setup-and-data-sources.md` (which lists the vars and commands). This one explains **what each service does** and **which ones you actually need to boot the app and start coding**. Verified against how each env var is consumed in code (2026-07-23).

---

## TL;DR — minimum to run `bun run dev` and start coding

You only need **two things**:

| # | Var(s) | Why it's mandatory | Where to get it |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | The root `<ClerkProvider>` wraps the **entire app** (`app/layout.tsx:203`). Without a valid key pair, **no page renders** — not even the public landing. | [dashboard.clerk.com](https://dashboard.clerk.com) → create app → API Keys. Free tier is plenty. |
| 2 | `DATABASE_URL` | The `db` client is lazy (`lib/db/index.ts:12`), but nearly every page/route queries Postgres, so in practice you need it to see anything. | [neon.tech](https://neon.tech) → create project → copy the pooled connection string. Free tier. |

Then:
```bash
cp .env.example .env.local   # fill the 3 keys above
bun install
bun run db:push              # create tables in your Neon DB
bun run dev
```

**Everything else below is optional** — add a service only when you touch the workflow that needs it. Nothing else blocks boot.

> ⚠️ Note: there is **no `middleware.ts`** in the repo, so there's no `clerkMiddleware`. Auth is enforced ad-hoc via `auth()` calls inside server components/routes. This is fine for local dev.

---

## Full service map (by tier)

| Service / Var | What it does in hack0 | Tier | Consumed in | What breaks without it | Key source (free tier?) |
|---|---|---|---|---|---|
| **Neon** `DATABASE_URL` | Serverless Postgres — all app data (events, orgs, users, imports). | **0 — boot** | `lib/db/index.ts:12`, `drizzle.config.ts` | Pages that query DB (≈ all) error on first query. | neon.tech — ✅ free |
| **Clerk** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Authentication + user sessions; also the fallback encryption secret for Luma connections. | **0 — boot** | `app/layout.tsx:203` (provider), `auth()` across routes | Nothing renders (provider throws). | dashboard.clerk.com — ✅ free |
| **Vercel AI Gateway** `AI_GATEWAY_API_KEY` | LLM access used to **post-process / normalize scraped events** and the "haiku" discovery source (turn messy scrape data into clean event records). | **1 — feature** (scrapers) | `lib/scraper/post-processor.ts`, `lib/scraper/sources/haiku.ts` | Scraper post-processing / AI discovery fail. App + Luma sync unaffected. | vercel.com AI Gateway — ✅ free credits |
| **Firecrawl** `FIRECRAWL_API_KEY` | Web scraping / page extraction for event & organization discovery (Devpost detail, universities, org scraping). | **1 — feature** (scraping) | `lib/scraper/firecrawl.ts`, `lib/scraper/sources/*`, `trigger/*` | Any scraper/import that uses Firecrawl fails. | firecrawl.dev — ✅ free tier |
| **Trigger.dev** `TRIGGER_PROJECT_ID`, `TRIGGER_SECRET_KEY` | Background jobs & cron: hourly Luma sync, daily/weekly scrapers, webhook processing. `PROJECT_ID` is read by the Trigger CLI (`trigger.config.ts:14`, throws only there); `SECRET_KEY` used at runtime to enqueue jobs. | **1 — feature** (jobs) | `trigger.config.ts`, `lib/actions/import.ts`, `app/(app)/api/webhooks/luma/route.ts` | Background/scheduled jobs don't run. **`bun run dev` is unaffected** (the Next app doesn't import the config). Use the Trigger-free sync commands instead. | cloud.trigger.dev — ✅ free tier |
| **Luma** `LUMA_API_KEY` / `LUMA_API_KEYS` / `HACK0_LUMA_CALENDAR_API_KEY` | **Primary event source and outbound calendar.** Pulls events from owned Luma calendars; the dedicated Hack0 key publishes approved index events to the official calendar. | **1 — feature** (real data) | `lib/luma/calendar-sync.ts`, `trigger/luma-calendar-publisher.ts`, `trigger/luma-webhook-processor.ts` | The corresponding sync or publication task throws. `HACK0_LUMA_CALENDAR_API_KEY` must be scoped to the official Hack0 calendar. | Luma calendar → Developer/API settings. **Requires Luma Plus**, each key scoped to one calendar. |
| **Luma webhook** `LUMA_WEBHOOK_SECRET` / `LUMA_WEBHOOK_SECRETS` | Verifies that incoming Luma event changes are authentic and recent. | **1 — feature** (two-way sync) | `app/(app)/api/webhooks/luma/route.ts` | Webhook returns `503` and does not enqueue unverified data. | Luma calendar → Settings → Developer → Webhooks. One `whsec_...` secret per webhook/calendar. |
| **UploadThing** `UPLOADTHING_TOKEN` | Image/file uploads (event banners, avatars). | **1 — feature** (uploads) | `app/(app)/api/uploadthing/core.ts` | Uploads fail at upload time. | uploadthing.com — ✅ free tier |
| **Resend** `RESEND_API_KEY` | Transactional email: community invites, Luma email verification. | **1 — feature** (email) | `lib/email/resend.ts:8` (only `console.warn` if missing) | Email sends fail silently at send time; **no boot error**. | resend.com — ✅ free tier |
| **Exa** `EXA_API_KEY` | Optional scraper **discovery** source (finds candidate events via search). | **2 — optional** | `lib/scraper/sources/exa.ts:340` | That one discovery source is skipped. | exa.ai — paid/limited free |
| **Perplexity** `PERPLEXITY_API_KEY` | Optional scraper discovery source (search-based event finding). | **2 — optional** | `lib/scraper/sources/perplexity.ts`, `hackathon-com.ts` | That discovery source is skipped. | perplexity.ai API — paid |
| **PostHog** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics. | **2 — optional** | `app/providers/posthog.tsx:11` | No analytics; app works fine. | posthog.com — ✅ free tier |
| **Upstash Redis** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (guarded — no-op if absent). | **2 — optional** | `lib/rate-limit.ts:10` | No rate limiting; app works fine. | upstash.com — ✅ free tier |
| **Google Fonts** `GOOGLE_FONTS_API_KEY` | Font picker data for event/community theming. | **2 — optional** | `app/api/google-fonts` | Font list endpoint degraded. | console.cloud.google — ✅ free |
| `ADMIN_EMAILS` | Comma-list of god-mode admins. | **2 — optional** | `lib/god-mode.ts:3` (defaults to `railly@clerk.dev`) | You won't have admin access unless you add your email. Set it to **your** email to reach `/god`. | — (just your email) |
| `LUMA_CONNECTION_ENCRYPTION_KEY` | Encrypts stored Luma connection secrets. | **2 — optional** | `lib/luma/api-key.ts:47` | Falls back to `CLERK_SECRET_KEY`; only matters if both are missing. | — (any strong random string) |
| **fal.ai** `FAL_API_KEY` | AI image generation. | **☠️ dead** | *not referenced in code* | Nothing — the SDK is installed but unused. | skip |
| `HACK0_LUMA_CALENDAR_API_ID` | Legacy Luma calendar id. | **☠️ dead** | *not referenced (commented in `.env.example`)* | Nothing. | skip |

---

## What each service is, in one line

- **Neon** — serverless Postgres; the database behind everything.
- **Clerk** — sign-in, sessions, user identity. Non-negotiable because it wraps the whole app.
- **Vercel AI Gateway** — one API key to call LLMs; hack0 uses it to clean up and structure scraped event data.
- **Firecrawl** — turns arbitrary web pages into structured data; the muscle behind org/event scraping.
- **Trigger.dev** — the scheduler/worker: it's what *should* run the hourly Luma sync and daily scrapers in prod (currently not deployed — see `docs/ROADMAP.md §4`).
- **Luma** — the main real-world event feed; the calendar hack0 curates from.
- **UploadThing** — file/image upload backend.
- **Resend** — sends the transactional emails (invites, verification).
- **Exa / Perplexity** — optional "find me candidate events" search sources for the scraper.
- **PostHog / Upstash** — analytics and rate-limiting; nice-to-have, never required.
- **fal.ai** — image generation, but **not wired into anything** right now.

---

## Recommended configs by goal

**A. "I just want the UI running to code pages/components"**
→ Tier 0 only: `CLERK_*` + `DATABASE_URL`. Run `bun run db:push && bun run dev`. Your DB will be empty — seed with `bun run db:seed` if a seed exists, or add events via the UI.

**B. "I want real events in the list"**
→ Tier 0 + `LUMA_API_KEY` or comma-separated `LUMA_API_KEYS`. Then use the **Trigger-free** path (no Trigger.dev needed):
```bash
bun run sync:luma --dry-run --future-only --limit=5   # validate env first
bun run sync:luma --future-only --limit=100           # import real events (auto-approved)
```

**C. "I want to test the scrapers / discovery"**
→ B + `FIRECRAWL_API_KEY` + `AI_GATEWAY_API_KEY` (optionally `EXA_API_KEY` / `PERPLEXITY_API_KEY`):
```bash
bun run sync:devpost --dry-run --skip-post-process     # no AI credits used
bun run sync:devpost                                   # full; events land as "pending" for curation
```
Scraped events go to the curation queue (`approvalStatus: pending`) — approve them in `/god/events` (set `ADMIN_EMAILS` to your email first).

**D. "Full stack incl. background jobs / prod-like"**
→ C + `TRIGGER_PROJECT_ID` + `TRIGGER_SECRET_KEY` +
`LUMA_WEBHOOK_SECRET` (or `LUMA_WEBHOOK_SECRETS`) + `UPLOADTHING_TOKEN` +
`RESEND_API_KEY`. Run the worker with `bun run trigger:dev`.

---

## Gotchas & gaps (read before you get confused)

- **No `middleware.ts`** → no `clerkMiddleware`. Auth is per-`auth()`-call. Don't go hunting for it.
- **No env-validation module** (no `t3-env`/`env.ts`). `.env.example` + inline checks are the only source of truth — this guide fills the gap.
- **Vars used in code but missing from `.env.example`/setup doc** (all optional/defaulted): `NEXT_PUBLIC_POSTHOG_KEY/HOST`, `UPSTASH_REDIS_REST_URL/TOKEN`, `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_BASE_URL` (default `https://hack0.dev`), `SYSTEM_OWNER_USER_ID`.
- **Dead vars** — `FAL_API_KEY`, `HACK0_LUMA_CALENDAR_API_ID`: declared but unused; don't bother.
- **Why the deployed site shows stale events** is *not* a config issue on your side — the Trigger.dev pipeline isn't deployed in prod (no `trigger:deploy` + credits exhausted). Full context: `docs/ROADMAP.md §4`.

See also: `docs/setup-and-data-sources.md` (commands, Luma/Devpost source details) · `docs/ROADMAP.md` (product direction).
