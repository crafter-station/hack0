# Contributing

## Setup

```bash
bun install
cp .env.example .env
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `TRIGGER_SECRET_KEY` | Yes | Personal key from [cloud.trigger.dev](https://cloud.trigger.dev) |
| `RESEND_API_KEY` | No | For email notifications |
| `FIRECRAWL_API_KEY` | No | For scraping Devpost |
| `UPLOADTHING_TOKEN` | No | For image uploads |
| `GOOGLE_FONTS_API_KEY` | No | For font selector |
| `AI_GATEWAY_API_KEY` | No | For AI features |
| `LUMA_API_KEY` | No | For Luma calendar integration |
| `ADMIN_EMAILS` | No | Comma-separated admin emails |

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Production build

bun run check        # Check linting + formatting
bun run lint         # Lint code
bun run lint:fix     # Lint and fix
bun run format       # Format code

bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed sample data
```

## Guidelines

- Keep PRs focused and small
- Run `bun run check` and `bun run build` before submitting
- Use conventional commit messages when possible
- Don't commit `.env` or credentials
