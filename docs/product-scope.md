# Product Scope

hack0 is being reset around the Peru Agentic Builder Index. The active product is a public, searchable map of events, communities, hackathons, university labs, grants, active builders, demo projects, and useful AI workflows in Peru.

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
- Admin tools can stay rough when they directly support ingestion, cleanup, or publishing.

## Current Migration Path

1. Remove inactive public surfaces from navigation and event detail pages.
2. Drop empty tables and schema branches that belong to removed modules.
3. Consolidate ingestion around one source event pipeline.
4. Turn TypeScript errors back into build failures.
5. Make the public Peru Agentic Builder Index the primary homepage and SEO surface.
