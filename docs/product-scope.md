# Product Scope

> **Consolidation notice (2026-07-27):** **hack0 stays the base** — repo and stack (Next.js/Neon/Clerk/Vercel/Trigger.dev) unchanged. We're **adding the community/badge layer** (H2: Luma Badge + per-event design kit + frictionless Luma import) in place, under `/c/<slug>`. (An earlier idea to move onto luma-card/Lovable Cloud was evaluated and discarded.) See [`docs/consolidation-plan.md`](./consolidation-plan.md) and `ROADMAP.md` §7.

> Updated 2026-07-23: north star confirmed as **LATAM-first**. The earlier "Peru reset" framing is superseded — Peru is the beachhead/featured view, not the total scope. See `docs/ROADMAP.md` for the consolidated direction.

hack0 is the **LATAM Agentic Builder Index**. The active product is a public, searchable map of events, communities, hackathons, university labs, grants, active builders, demo projects, and useful AI workflows across Latin America. It launches from Peru (the initial coverage beachhead) and expands country by country; coverage per country is real and DB-driven (`getLatamCountryCoverage`, `lib/latam-country-coverage.ts`).

## Active Now

- Public event index backed by Luma imports.
- Public organization and community directory.
- Admin curation for imported events and organizations.
- Luma calendar sync and webhook ingestion.
- God mode review tools for pending records.

## Out Of Scope Now

These modules are removed from the public product until they have real usage, owned data, and a clear operating workflow:

- AI gift cards.
- Community badges.
- Achievements.
- Attendance claims.
- Host self-claims.
- Hackathon submissions and judging.
- Campaign pages.
- Community analytics.
- Member management beyond owner/admin maintenance.

## Product Rules

- Prefer one reliable public directory over many half-finished private dashboards.
- Every visible module must have real production data or an immediate operating owner.
- If a table has no production rows and no near-term workflow, delete it.
- If a UI asks a user to perform an action we cannot fulfill end to end, remove the UI.
- While the app has no active users, do not preserve backwards compatibility for removed modules. Flatten migrations to the current schema instead of carrying cleanup history.
- Admin tools can stay rough when they directly support ingestion, cleanup, or publishing.

## Current Migration Path

1. Remove inactive public surfaces from navigation and event detail pages.
2. Drop empty tables and schema branches that belong to removed modules.
3. Consolidate ingestion around one source event pipeline.
4. Turn TypeScript errors back into build failures.
5. Make the public LATAM Agentic Builder Index the primary homepage and SEO surface (Peru as the featured/default coverage view).
