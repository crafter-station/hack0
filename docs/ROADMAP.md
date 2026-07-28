# hack0 — Direction, Intent & Roadmap

> Single source of truth for **what hack0 is, where it's going, and how it looks**.
> Reconciles three sources that had drifted: Linear milestones (MakerPunks → project "Hack0"), the hardcoded roadmap page (`app/(landing)/roadmap/page.tsx`), and `docs/product-scope.md`.
> Last updated: 2026-07-23.

---

## 1. Intent — what hack0 IS

hack0 is the **LATAM Agentic Builder Index**: a public, curated, searchable map of the Latin American tech ecosystem — events, communities, hackathons, university labs, grants, active builders, demo projects, and useful AI workflows.

- **North star:** LATAM-first, multi-country. Peru is the **beachhead / featured view**, not the total scope. Coverage per country is real and DB-driven (`getLatamCountryCoverage`).
- **Core value:** one reliable public directory beats many half-finished dashboards. Every visible module must have real data or an owner (`docs/product-scope.md` product rules).
- **Primary pipeline:** Luma imports (auto-approved) + web scrapers (curated). Public pages are `force-dynamic` — they render live DB state.

## 2. Two horizons

The project carries two product visions. Keeping them explicit resolves the Linear-vs-code drift.

| Horizon | What | Status |
|---|---|---|
| **H1 — Public Index (NOW)** | Curated directory of events/communities/orgs, Luma-fed, admin/god-mode curation. This is what ships. | **Active** |
| **H2 — Management Platform (PAUSED, not cancelled)** | POAP certificates, badge/asset SDK, claim-your-event, organizer back office, payments, white-label merch. | **Backlog** — revisit once H1 has traction + active organizers |

The H2 modules were pruned from the codebase during the lean-index refactor (`docs/product-scope.md` "Out of Scope Now"). In Linear they live in **Backlog**, not Cancelled — see MAK-191 / MAK-189 / MAK-188 (moved 2026-07-23) and the M2 issues.

## 3. Roadmap status (reconciled)

Source of truth for phase state is this table. The hardcoded `app/(landing)/roadmap/page.tsx` and Linear milestones should be kept in sync with it.

| Phase (roadmap page) | Linear milestone | State | Notes |
|---|---|---|---|
| **Fase 1 — Fundamentos** | M0 — Fundación | ✅ Done | Event calendar, communities/orgs, free publishing, detail pages, filters. (Some M0-built modules — badges MAK-202, submissions MAK-204, host-claiming MAK-203 — were later pruned; now H2.) |
| **Fase 2 — Comunidades + Multi-país** | M1 — Activación (reframed) | 🔄 ~70% | Done: community profiles, Luma integration, co-hosts, multi-country + timezones, country filter + flags. **Pending: organizer dashboard, basic event analytics.** |
| — (freshness) | **M1 blocker** | 🔴 Blocked | **Data freshness is the real M1 today** — see §4. MAK-186 is blocker #1. M1 target reset to 2026-08-31. |
| **Fase 3 — Descubrimiento** | (unmapped) | 📋 Planned | Email notifications, interest recommendations, interactive geo map, syncable personal calendar, public API. |
| **Fase 4 — Ecosistema** | (unmapped) | 📋 Planned | Community directory, speaker/mentor profiles, participation history, community connections, ecosystem reports. |
| Management platform | M2 — Escala LATAM | ⏸️ Backlog (H2) | Back office, payments, merch marketplace, global/i18n. Paused. |

## 4. Top blocker — deployed web shows stale events

> **Update 2026-07-27:** fixed **in place** on hack0's own stack (Phase F1 in [`implementation-phases.md`](./implementation-phases.md)) — deploy the existing Trigger.dev tasks + CI (or Vercel Cron). The earlier idea of replacing this with Supabase/Lovable Cloud was discarded (see §7). The checklist below is the live plan.

Diagnosed 2026-07-23 (see MAK-186 comment for full detail):

- **Not a caching problem.** Public pages are `export const dynamic = "force-dynamic"` → they read the DB live. Stale web = **stale DB**.
- **Root cause:** the Trigger.dev pipeline (hourly Luma cron `trigger/luma-calendar-sync.ts` + daily/weekly scrapers) **does not run in prod**. There is no `trigger:deploy` script and no CI workflow to deploy it; Trigger.dev v3 crons only fire in the cloud after a deploy. Plus credits were exhausted (MAK-186).
- **Secondary cause:** scraped events enter as `pending` (`isApproved:false`, `lib/scraper/normalizer.ts`) and stay invisible until curated in `/god/events`. (Luma sync auto-approves.)

**Fix checklist** (incremental rollout):
1. Complete the shared validation, write-safety, deduplication, and consistency foundations.
2. Add secure two-way Hack0-Luma synchronization so every published Hack0 event is represented in the Hack0 calendar without creating duplicate registrations.
3. Add and validate one source at a time using the gate in [`event-ingestion-rollout.md`](./event-ingestion-rollout.md).
4. Deploy Trigger.dev versions without promotion, inspect manual runs, then activate only the approved source schedule.
5. Verify production env parity before any promoted run: `DATABASE_URL` (Trigger prod == Vercel Neon), `LUMA_API_KEY`/`LUMA_API_KEYS`, `TRIGGER_PROJECT_ID`, `FIRECRAWL_API_KEY`.
6. Operate the curation queue (`/god/events`) or auto-approve only explicitly trusted sources.

## 5. Design — SSOT is `brand.md` (v0.2)

The visual system is **mature and documented** — do not redesign; extend from it.

- **Concept:** the "Active Cell" — the `0` in `hack0` is a squared, broken block-zero with an acid-green active segment. Personality: technical, fast-to-parse, builder-native, "useful before pretty," LATAM-aware without flags/clichés. NOT generic SaaS / cyberpunk / racing.
- **Color:** base `hack0-black #050605` + `hack0-paper #F3F1E8`; signature green theme-shifted for contrast (light `#087A4C` / dark `#35C982`); support forest `#073D29`, grid green (maps/data), muted `#A1A1AA`, amber `#FFB020` (featured/sponsored/prize). Rule: green is high-signal, intentional — not neon everywhere. All tokens live in `app/globals.css` (`@theme inline`, Tailwind v4, no separate config).
- **Type:** Geist Sans (UI), Geist Mono (event IDs, slugs, timestamps, technical metadata). Wordmark always lowercase `hack0`, final char numeric block-zero.
- **Layout:** `--radius: 0rem` — sharp square corners everywhere. Dense, scannable, utilitarian tables; event rows use banner images as gradient-overlay backgrounds; event detail = two-column (content + sticky sidebar). Light = warm paper (reading/tables), dark = near-black builder control surface (hero/social).
- **Open design decisions:** `brand.hack0.dev` portal (in-app vs standalone), PNG exports, apple-touch-icon.

## 6. Keeping this doc honest

- This file is the reconciled source. When phase state changes, update **this table first**, then mirror into `app/(landing)/roadmap/page.tsx` and Linear.
- The hardcoded roadmap page can silently drift — treat it as a rendering of §3, not a second source of truth.

## 7. Consolidation decision (2026-07-27) — keep hack0's stack, bring community tools in

**Decision:** **hack0 stays the base** — repo, stack (Next.js 16 / Neon / Clerk / Vercel / Trigger.dev), and domain `hack0.dev`. We **bring the `luma-card` community tools into hack0**, ported to this stack: Luma Badge generation + per-event **design kit** (badges → certificates → flyers → tokenization) + frictionless Luma import, integrated under the community hub `/c/<slug>`.

**Why:** hack0 already has the frontend, data model, public index, scrapers, Luma sync and communities. The only truly broken thing is data freshness (§4), which is an **in-place** fix (deploy Trigger.dev + CI). luma-card's value is its *feature set*, not its stack — so we port the features, not the platform.

**Rejected alternative:** consolidating onto luma-card / Lovable Cloud (Supabase + TanStack Start + Cloudflare + pgmq/Deno). Evaluated in depth and **discarded** — a platform rewrite with no product gain and losing hack0's working base. Kept only as a decision record.

**Product = two mutually-feeding faces (unchanged):** public index (H1, exposure/SEO) + logged-in community layer (H2, monetization) — both in hack0's Next.js app.

Full plan + phased execution: **[`consolidation-plan.md`](./consolidation-plan.md)** · **[`implementation-phases.md`](./implementation-phases.md)**.
