# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hack0.dev is a hackathon and tech event discovery platform focused on Peru. It aggregates hackathons, conferences, workshops, and other innovation events. The app has a Vercel/Linear/Clerk-inspired grayscale aesthetic with a focus on UX/DX.

## Commands

```bash
bun run dev          # Start Next.js dev server
bun run build        # Production build
bun run lint         # ESLint
bun run db:push      # Push schema directly (dev)
bun run db:studio    # Open Drizzle Studio
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
- **Background Jobs**: Trigger.dev v3

### Key Directories

- `app/` - Next.js App Router pages
  - `page.tsx` - Main event listing with filters, categories, and load more
  - `[slug]/page.tsx` - Event detail page with two-column layout
  - `(auth)/` - Clerk auth pages (sign-in, sign-up with catch-all routes)
  - `submit/` - Event submission form (grid layout)
  - `api/subscribe`, `api/verify`, `api/unsubscribe` - Email subscription endpoints
- `components/`
  - `events/` - Event-specific components (event-row-with-children, filter-bar, category-tabs)
  - `layout/` - Shared layout components (site-header, site-footer)
  - `ui/` - shadcn/ui components
- `lib/`
  - `db/schema.ts` - Drizzle schema with events, subscriptions, claims, sponsors, organizations tables
  - `actions/events.ts` - Server actions with smart ordering, child events, sponsors
  - `event-utils.ts` - Date formatting, status helpers, label functions
  - `event-categories.ts` - Category definitions (competitions, learning, community)
  - `email/` - Resend templates and notification logic
  - `scraper/` - Firecrawl-based scraper for Devpost
- `trigger/` - Trigger.dev background tasks (luma-import, org-scraper, drift-check)

### Data Model

**events** - Main event table:
- Event types: hackathon, conference, workshop, bootcamp, meetup, olympiad, accelerator, etc.
- Organizer types: university, government, company, community, NGO, etc.
- Formats: virtual, in-person, hybrid
- `parentEventId` - For multi-day events or conference tracks (child events)
- `prizeCurrency` - USD or PEN (soles)
- `skillLevel` - beginner/intermediate/advanced/all
- `isOrganizerVerified` - Verified organizer badge

**sponsors** - Event sponsors/partners with tier: platinum, gold, silver, bronze, partner, community

**organizerClaims** / **winnerClaims** - Verification requests with status: pending, approved, rejected

**subscriptions** - Email notification subscriptions with verification tokens

### Event Categories

- **Todos** - All events (shows prize column)
- **Competencias** - hackathon, olympiad, competition, robotics (shows prize)
- **Formación** - workshop, bootcamp, course, certification, summer_school (shows skill level)
- **Comunidad** - meetup, networking, conference, seminar (minimal columns)

### Event Ordering

1. **Ongoing** - by startDate ASC
2. **Open** (registration open) - by startDate ASC
3. **Upcoming** - by startDate ASC
4. **Ended** - by endDate DESC

Featured events appear first within each status group.

### Design System

- **Color palette**: Pure grayscale with color accents for status
  - Green (emerald-500): Active/ongoing events, verified badges, prizes
  - Blue (blue-500): Upcoming events, multi-day badge
  - Gray (muted): Ended events (dimmed)
  - Amber: Junior-friendly badge, featured/sponsored events
- **Event rows**: Banner images as subtle backgrounds with gradient overlay
- **Event detail page**: Two-column layout (content + sticky sidebar)

### Patterns

- Server components fetch data via server actions
- URL state managed with nuqs for shareable filter URLs
- Load more pagination with `useTransition`
- Clerk auth with redirect (not modal) using `(auth)` route group
- Parent/Child events for multi-day events or conference tracks

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `FIRECRAWL_API_KEY` - For scraping Devpost
- `RESEND_API_KEY` - For email notifications
- Clerk keys (`NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`)

---

## Trigger.dev v3 Quick Reference

**MUST use `@trigger.dev/sdk/v3`, NEVER `client.defineJob` (v2 deprecated)**

### Basic Task

```ts
import { metadata, task } from "@trigger.dev/sdk/v3";

export const myTask = task({
  id: "my-task",
  maxDuration: 120,
  run: async (payload: { data: string }) => {
    metadata.set("step", "processing");
    // task logic
    metadata.set("step", "completed");
    return { success: true };
  },
});
```

### Scheduled Task

```ts
import { metadata, schedules } from "@trigger.dev/sdk/v3";

export const weeklyTask = schedules.task({
  id: "weekly-task",
  cron: "0 4 * * 0", // Every Sunday at 4am UTC
  run: async () => {
    metadata.set("step", "running");
    // task logic
    return { processed: true };
  },
});
```

### Triggering from Backend

```ts
import { tasks } from "@trigger.dev/sdk/v3";
import type { myTask } from "@/trigger/my-task";

const handle = await tasks.trigger<typeof myTask>("my-task", { data: "value" });

// If using triggerAndWait, ALWAYS check result.ok
const result = await myTask.triggerAndWait({ data: "value" });
if (result.ok) {
  console.log(result.output);
} else {
  console.error(result.error);
}
```

### Key Points

- Use `metadata.set()` for progress tracking (visible in dashboard)
- `triggerAndWait()` returns `Result` object - check `result.ok` before accessing `result.output`
- Never wrap `triggerAndWait` in `Promise.all` (not supported)
- Config in `trigger.config.ts`: project ref, runtime, dirs, retries, maxDuration
