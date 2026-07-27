<div align="center">

# hack0

**The public LATAM Agentic Builder Index** — a curated, always-fresh map of the hackathons, tech events, communities, labs, and builders across Latin America.

[![Live](https://img.shields.io/badge/live-hack0.dev-000000)](https://hack0.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-336791?logo=postgresql&logoColor=white)](https://neon.tech)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-16A34A)](CONTRIBUTING.md)

</div>

## What is hack0?

hack0.dev maps the LATAM builder ecosystem in one place — **events, hackathons, communities, labs, grants, and active builders** — auto-detected, curated, and kept fresh so nobody misses what's happening.

- 🌎 **Public event index** — LATAM-first, multi-country, filterable by type, format, country, and skill level.
- 🔎 **Auto-detection** — events are discovered automatically (Luma calendar sync + web scrapers like Devpost), not hand-entered.
- 🏙️ **Community & org directory** — communities, universities, labs, and companies with their events.
- 🗺️ **Interactive maps** — LATAM and Peru-by-department event coverage.
- 🏷️ **Programmatic SEO + dynamic OG images** — every event and facet page is shareable and indexable.
- 🛠️ **Admin curation** — an approval queue keeps the public index clean.

## Quick start

Requires [Bun](https://bun.sh). To boot the app you only need **Clerk** keys and a **Neon** database.

```bash
bun install
cp .env.example .env      # fill DATABASE_URL + Clerk keys (minimum to run)
bun run db:push           # create the schema
bun run dev               # http://localhost:3000
```

Load real events without the background worker:

```bash
bun run sync:luma --future-only   # import upcoming Luma events
bun run sync:devpost              # scrape Devpost hackathons (into the curation queue)
```

Full setup, required services, and Trigger-free import details: **[docs/setup-and-data-sources.md](docs/setup-and-data-sources.md)**.

## Tech stack

Next.js 16 (App Router, React 19) · Drizzle ORM + Neon Postgres · Clerk auth · Trigger.dev background jobs · Firecrawl scraping · shadcn/ui + Tailwind CSS v4 · nuqs · Resend.

## Project structure

```
app/       Next.js routes — landing, /events, /e/[code] detail, /c communities, /god admin
lib/       db schema, server actions, scraper pipeline, Luma integration
trigger/   background jobs (hourly Luma sync, daily/weekly scrapers)
docs/      setup, product direction & roadmap
```

New here? Start with **[docs/consolidation-plan.md](docs/consolidation-plan.md)** and **[docs/ROADMAP.md](docs/ROADMAP.md)** to see where the project is headed.

## Contributing

Contributions are welcome — from adding a new event source to polishing the UI. Read the **[Contributing Guidelines](CONTRIBUTING.md)**, then open a PR with one focused change per branch.

---

<div align="center">
Built for the LATAM builder community · <a href="https://hack0.dev">hack0.dev</a>
</div>
