<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/brand/hack0-mark-dark.svg">
  <img alt="hack0" src="apps/web/public/brand/hack0-mark-light.svg" width="64">
</picture>

# hack0

The map of tech events in Latin America.

[![ci](https://img.shields.io/github/actions/workflow/status/crafter-station/hack0/ci.yml?branch=main&style=flat-square&labelColor=111110&color=ff3d00&label=ci)](https://github.com/crafter-station/hack0/actions/workflows/ci.yml)
[![site](https://img.shields.io/badge/hack0.dev-live-ff3d00?style=flat-square&labelColor=111110)](https://hack0.dev)
[![luma](https://img.shields.io/badge/luma-hack0-ff3d00?style=flat-square&labelColor=111110)](https://luma.com/hack0)

[hack0.dev](https://hack0.dev)

</div>

hack0 reads hackathons, meetups, workshops and conferences from Luma calendars, Meetup groups and Eventbrite organizers, merges the same event seen in several places into one, and publishes a page for every event, city and topic. Curators feature the best ones for a weekly agenda; apps and agents read the same catalog through a REST API and an MCP server.

## Develop

```sh
bun install
bun run dev                          # apps/web on localhost:3000
```

Set `DATABASE_URL` in `apps/web/.env.local` to use the Postgres catalog; without it the site reads the hack0 Luma calendar with `LUMA_API_KEY`.

```sh
cd apps/web
bun run db:migrate                   # apply the Drizzle migrations
bun run scripts/seed-sources.ts      # the starting set of calendars
```

## Checks

```sh
bun run test                         # unit + Postgres integration (TEST_DATABASE_URL)
bun run typecheck
bun run lint                         # Biome
bun run quality                      # crafter-lint
```

CI also builds the site against a seeded Postgres and requests every public route, which catches pages that only break in production.

## API and MCP

Create a token in [hack0.dev/admin](https://hack0.dev/admin), under API.

```sh
curl -H "Authorization: Bearer hack0_sk_..." \
  "https://hack0.dev/api/v1/events?status=upcoming&country=PE&limit=20"
```

| Endpoint | |
| --- | --- |
| `GET /api/v1/events` | Events, filtered by `status`, `country`, `provider`, `calendar`, `from`, `to`; paged with `cursor` |
| `GET /api/v1/events/:id` | One event with every source that lists it |
| `GET /api/v1/events/export` | The filtered catalog as CSV or JSON |
| `GET /api/v1/calendars` | Sources and their sync state |
| `POST /api/mcp` | MCP server: `list_events`, `get_event`, `list_calendars` |

Tokens allow 120 requests per minute and return `x-ratelimit-*` headers.

## Layout

```
apps/web/          hack0.dev: Next.js, Drizzle on Neon, Vercel Workflow and Cron, Clerk for /admin
packages/cli/      @crafter/hack0, the agent-first CLI for workshop installs
docs/              architecture and the workshop distribution contract
```

## More

- [docs/architecture.md](docs/architecture.md): how sources become pages, and what decides a listing
- [docs/contract.md](docs/contract.md): workshop distribution

Built by [Crafter Station](https://crafter.run).
