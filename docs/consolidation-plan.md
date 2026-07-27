# hack0 Consolidation Plan — bring community tools in, on hack0's own stack

> **Status:** Approved direction (2026-07-27). **Canonical plan doc.** Execution sequence: [`implementation-phases.md`](./implementation-phases.md).

## 1. Decision & why

**hack0 stays the base — repo, stack, and domain.** The consolidated product is built **in this repo** (Next.js 16 / Drizzle + Neon / Clerk / Vercel / Trigger.dev). We **bring the community tools from the `luma-card` project into hack0**, ported to hack0's stack — the inverse of an earlier idea to move hack0 onto luma-card.

**Why this way:**
- hack0 already has the frontend, the data model, the domain `hack0.dev`, and the whole public index (events, communities/orgs, scrapers, Luma sync, `/c/[slug]`). Keeping it avoids a rewrite.
- The only thing actually broken is **data freshness** (the Trigger.dev pipeline was never deployed — MAK-186). That's an in-place fix, not a reason to change stacks.
- The valuable part of `luma-card` is its **feature set** (Luma Badge generation + per-event design kit + frictionless Luma import), not its stack. We port the features, not the platform.

**Rejected alternative:** consolidating onto luma-card / Lovable Cloud (Supabase + TanStack Start + Cloudflare + pgmq/Deno edge functions). Evaluated in depth and **discarded** — it meant a platform rewrite and losing hack0's working base for no product gain. Kept here only as a decision record.

## 2. Product model (unchanged intent)

Two mutually-feeding faces, both now in hack0's Next.js app:
- **Public index (H1 — exposure/SEO):** auto-detect + list tech events (LATAM + global hackathons), programmatic SEO, data for social curation.
- **Logged-in community layer (H2 — monetization):** frictionless Luma import (paste a link), opt-in publish to the directory, and a per-event **design kit** (badges → certificates → flyers → tokenization) for community managers.

The community layer feeds the index; the index gives SEO/exposure; the design kit monetizes.

## 3. What we bring from luma-card → hack0 (ported to Next.js)

| Feature (luma-card) | Target in hack0 |
|---|---|
| Badge generation + render (1080×1600 canvas, QR) | New Next.js badge editor + render, under `/e/[code]` and the community hub `/c/[slug]` |
| AI badge styling / "badge chat" | Reuse hack0's existing AI gateway (`AI_GATEWAY_API_KEY`) |
| Templates + per-event style presets | New Drizzle/Neon tables, community-scoped |
| Frictionless Luma import (link → event) + bulk import | Extend hack0's existing Luma integration (`lib/luma/*`) |
| Per-event **design kit** (badges → certs → flyers → tokenize) | Community-manager surface under `/c/[slug]` (monetization) |

**Design authority = hack0** (it's the base). luma-card's badge UI is rebuilt in hack0's design system (`brand.md` "Active Cell"). No design port needed.

## 4. Architecture notes (on hack0's stack)

- **Stack unchanged:** Next.js 16 App Router, Drizzle + Neon, Clerk, Vercel, Trigger.dev. No Supabase / Cloudflare / TanStack / pgmq / Deno.
- **Freshness fix (the real blocker):** deploy the existing Trigger.dev tasks + a CI workflow (`trigger.dev deploy` on push to main), or use Vercel Cron hitting a route — so the **existing** scrapers + `luma-calendar-sync` run in prod. See `ROADMAP.md` §4.
- **Community-scoping:** badges/templates/style-presets link to org + event and are managed via hack0's existing `community_members` model.
- **Info architecture:** the community profile `/c/<slug>` (e.g. `/c/theveller`) is the integrated hub — events + configuration + badges/design-kit together. Global gallery → footer/navbar. Templates → featured dropdown (to evaluate).
- **Reuse, don't rebuild:** hack0 already has `organizations`, `events`, `event_hosts`, `community_members`, `luma_connections`, the scraper pipeline, the AI gateway, and UploadThing. The new work is mostly the badge/design-kit tables + UI + wiring, plus the freshness deploy.

## 5. Scope note
v1 focuses on: (a) freshness fix, (b) badge/design-kit feature ported and integrated under `/c/<slug>`, (c) frictionless Luma import + opt-in publish. Design-kit expansion (certificates/flyers/tokenization) is later. All work via branches + PRs. Environment setup is handled by the user.
