# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hack0.dev is a hackathon and tech event discovery platform focused on Peru. It aggregates hackathons, conferences, workshops, and other innovation events. The app has a Vercel/Linear/Clerk-inspired grayscale aesthetic with a focus on UX/DX.

## Commands

```bash
# Development
bun run dev          # Start Next.js dev server
bun run build        # Production build
bun run lint         # ESLint

# Database (Drizzle + Neon PostgreSQL)
bun run db:generate  # Generate migrations from schema changes
bun run db:migrate   # Run migrations
bun run db:push      # Push schema directly (dev)
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed database with sample data

# Scraping
bun run scrape       # Scrape events from Devpost using Firecrawl
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router (React 19)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: Clerk (redirect mode, not modal)
- **Email**: Resend for notifications
- **UI**: shadcn/ui components with Tailwind CSS v4
- **URL State**: nuqs for type-safe search params

### Key Directories

- `app/` - Next.js App Router pages
  - `page.tsx` - Main event listing with filters, categories, and load more
  - `[slug]/page.tsx` - Event detail page with two-column layout
  - `(auth)/` - Clerk auth pages (sign-in, sign-up with catch-all routes)
  - `submit/` - Event submission form (grid layout)
  - `success/` - Submission success page
  - `subscribe/`, `unsubscribe/` - Email subscription feedback pages
  - `api/subscribe`, `api/verify`, `api/unsubscribe` - Email subscription endpoints
- `components/`
  - `hackathons/` - Event-specific components (event-row-with-children, filter-bar, category-tabs, load-more-button)
  - `layout/` - Shared layout components (site-header, site-footer)
  - `ui/` - shadcn/ui components
- `lib/`
  - `db/schema.ts` - Drizzle schema with events, subscriptions, claims, sponsors tables
  - `actions/hackathons.ts` - Server actions with smart ordering, child events, sponsors
  - `event-utils.ts` - Date formatting, status helpers, label functions
  - `event-categories.ts` - Category definitions (competitions, learning, community)
  - `email/` - Resend templates and notification logic
  - `scraper/` - Firecrawl-based scraper for Devpost
- `hooks/` - Custom React hooks
- `scripts/` - Database seed scripts for specific events

### Data Model

**events** - Main event table:
- Event types: hackathon, conference, workshop, bootcamp, meetup, olympiad, accelerator, etc.
- Organizer types: university, government, company, community, NGO, etc.
- Formats: virtual, in-person, hybrid
- `parentEventId` - For multi-day events or conference tracks (child events)
- `dayNumber` - Day/track number for child events
- `prizeCurrency` - USD or PEN (soles)
- `isJuniorFriendly` - Beginner-friendly events
- `isOrganizerVerified` - Verified organizer badge
- `bannerUrl` - Event banner image (shown as subtle background in rows)

**sponsors** - Event sponsors/partners:
- Links to event
- Name, logoUrl, websiteUrl
- Tier: platinum, gold, silver, bronze, partner, community
- orderIndex for custom ordering within tier

**organizerClaims** - Organizer verification requests:
- Links to event and Clerk user
- Proof URL and description
- Status: pending, approved, rejected

**winnerClaims** - Winner/podium claims (positions 1, 2, 3 only):
- Links to event and Clerk user
- Team name, project name, project URL
- Proof URL (required)
- Status: pending, approved, rejected

**subscriptions** - Email notification subscriptions:
- Email verification with tokens
- Unsubscribe tokens

### Parent/Child Events

Events can have parent-child relationships for:
- **Multi-day events** (e.g., JAKUMBRE with 3 days in different venues)
- **Conference tracks/ejes** (e.g., CONTECIH with Ciberseguridad, Videojuegos, IA tracks)

Child events:
- Have `parentEventId` pointing to parent
- Have `dayNumber` for ordering (1, 2, 3...)
- Are excluded from main listing (shown nested under parent)
- Appear in collapsible row on homepage
- Appear in "Programa (X días)" section on detail page

### Event Categories

Categories group event types for filtering:
- **Todos** - All events (shows prize column)
- **Competencias** - hackathon, olympiad, competition, robotics (shows prize)
- **Formación** - workshop, bootcamp, course, certification, summer_school (shows skill level)
- **Comunidad** - meetup, networking, conference, seminar (minimal columns)

Category tabs appear in the sticky header with icons.

### Event Ordering

Events are sorted by status priority, then date:
1. **Ongoing** (happening now) - by startDate ASC
2. **Open** (registration open) - by startDate ASC
3. **Upcoming** (hasn't started) - by startDate ASC
4. **Ended** - by endDate DESC (most recent first)

Featured events appear first within each status group.

### Currency Support

Prizes can be in USD or PEN (Peruvian soles):
- Display: "$" for USD, "S/" for PEN
- Prize pool totals convert PEN to USD at 3.5 exchange rate

### Date Formatting

Smart date formatting shows year only when needed:
- Current year: "20 sep"
- Different year: "20 sep 2025"
- Cross-year range: "28 dic 2024 – 5 ene 2025"
- Same day: "20 sep" (not "20 sep – 20 sep")

Use `formatEventDateSmart()` or `formatEventDateRange()` from `lib/event-utils.ts`.

### Design System

- **Color palette**: Pure grayscale with color accents for status
  - Green (emerald-500): Active/ongoing events, verified badges, prizes
  - Blue (blue-500): Upcoming events, multi-day badge
  - Gray (muted): Ended events (dimmed)
  - Amber: Junior-friendly badge, featured/sponsored events
- **Components**: shadcn/ui with custom variants
- **Event rows**: Banner images as subtle backgrounds with gradient overlay
- **Event detail page**: Two-column layout (content + sticky sidebar)
- **Banner fallback**: Diagonal stripe pattern when no bannerUrl

### Patterns

- Server components fetch data via server actions
- URL state managed with nuqs for shareable filter URLs
- Load more pagination with `useTransition`
- Clerk auth with redirect (not modal) using `(auth)` route group
- Shared layout via `SiteHeader` and `SiteFooter` components
- Organizer verification: Shows "✓" badge or "(sin verificar)"
- Winner section: Only appears on ended events
- Sponsors section: Grouped by tier with highlight for platinum/gold
- Child events: Collapsible in rows, card list in detail page

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `FIRECRAWL_API_KEY` - For scraping Devpost
- `RESEND_API_KEY` - For email notifications
- Clerk keys (`NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`)
