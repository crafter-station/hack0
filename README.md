# hack0

Mapping the LATAM tech ecosystem. [hack0.dev](https://hack0.dev) lists hackathons, conferences, workshops and meetups, with a static page per event, city and topic.

## Layout

```
apps/web/        hack0.dev (Next.js on Vercel)
packages/cli/    @crafter/hack0, the agent-first CLI for workshop installs
docs/            architecture and the workshop distribution contract
```

## Develop

```bash
bun install
bun run dev          # apps/web on localhost:3000
bun run test         # every workspace
bun run typecheck
bun run lint         # Biome
bun run quality      # crafter-lint
```

`apps/web` reads the hack0 Luma calendar and needs `LUMA_API_KEY` in `apps/web/.env.local`.

## CLI

```bash
npx @crafter/hack0 list
npx @crafter/hack0 add hack0-toolkit
```

Built by [Crafter Station](https://github.com/crafter-station).
