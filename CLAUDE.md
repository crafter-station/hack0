# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hack0.dev is the public Peru Agentic Builder Index. It maps events, communities, hackathons, labs, grants, builders, demo projects, and useful AI workflows in Peru, with Luma imports as the primary event pipeline.

## Commands

```bash
bun run dev          # Start Next.js dev server
bun run build        # Production build
bun run check        # Biome check
bun run db:push      # Push schema directly (dev)
bun run db:migrate   # Apply Drizzle migrations
bun run db:studio    # Open Drizzle Studio
bun run sync:luma    # Backfill/sync the Luma calendar
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: Clerk (redirect mode, not modal)
- **Email**: Resend for notifications
- **UI**: shadcn/ui components with Tailwind CSS v4
- **URL State**: nuqs for type-safe search params
- **Background Jobs**: Trigger.dev v4

### Key Directories

- `app/` - Next.js App Router pages
  - `(landing)/page.tsx` - Peru Agentic Builder Index homepage
  - `events/` - Public event listing
  - `(app)/e/[code]/page.tsx` - Event detail page
  - `(app)/c/` - Community and organization directory
  - `(app)/onboarding/` - User onboarding
  - `(admin)/god/` - Admin curation and ecosystem graph
  - `(auth)/` - Clerk auth pages (sign-in, sign-up with catch-all routes)
  - `api/` - Event, organization, webhook, upload, and user APIs
- `components/`
  - `events/` - Event views, toolbar, detail, and edit components
  - `org/` - Organization discovery, creation, settings, members, and layout
  - `god-mode/` - Admin graph, navigation, and creation tools
  - `admin/scraper/` - Scraper curation UI
  - `layout/` - Shared layout components (site-header, site-footer)
  - `ui/` - shadcn/ui components
- `lib/`
  - `db/schema/` - Drizzle schema modules for events, organizations, users, imports, staff, community, and relations
  - `actions/events.ts` - Server actions with smart ordering, child events, sponsors
  - `actions/organizations.ts` - Organization directory and admin actions
  - `community-directory-query.ts` - Shared public directory filtering
  - `event-utils.ts` - Date formatting, status helpers, label functions
  - `event-categories.ts` - Category definitions (competitions, learning, community)
  - `scraper/` - Firecrawl-based scraper for Devpost
- `trigger/` - Trigger.dev background tasks for imports, webhooks, and drift checks

### Data Model

**events** - Main event table:
- Event types: hackathon, conference, workshop, bootcamp, meetup, olympiad, accelerator, etc.
- Organizer types: university, government, company, community, NGO, etc.
- Formats: virtual, in-person, hybrid
- `parentEventId` - For multi-day events or conference tracks (child events)
- `prizeCurrency` - USD or PEN (soles)
- `skillLevel` - beginner/intermediate/advanced/all
- `approvalStatus` and `isApproved` - Admin curation state

**organizations** - Communities, startups, investors, labs, companies, universities, and other ecosystem actors.

**eventHostOrganizations** / **eventHosts** - Event hosts imported from Luma or assigned manually.

**eventSponsors** - Event sponsor and partner links to organizations.

**users** / **emailVerifications** - Clerk-backed profiles and Luma email verification.

**importJobs** / **scrapeSources** / **scrapeRuns** - Import and scraper operations.

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

## Trigger.dev Quick Reference

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

---

## Intent Layer: AGENTS.md Documentation

### Qué es AGENTS.md

Archivos `AGENTS.md` proporcionan contexto específico de directorio para instancias de Claude. Contienen:
- Propósito del módulo
- Lista de componentes/archivos
- Patrones y convenciones
- Dependencias
- Anti-patrones (qué evitar)

### Reglas para Claude

**Al entrar a un directorio:**
1. Buscar `AGENTS.md` en el directorio actual
2. Leerlo ANTES de hacer cambios
3. Seguir los patrones documentados

**Al finalizar cambios significativos:**
1. Evaluar si los cambios ameritan actualizar `AGENTS.md`
2. Actualizar si:
   - Se agregó/eliminó un componente/archivo
   - Cambió la estructura del módulo
   - Se agregaron nuevas dependencias
   - Se descubrió un nuevo anti-patrón
3. Mantener el formato existente del archivo

### Directorios con AGENTS.md

```
components/
├── events/           # ✓ + views/, toolbar/, detail/, edit/
├── org/              # ✓ + members/, settings/, discovery/, creation/, layout/, my-orgs/
├── manage/           # ✓
└── god-mode/         # ✓

lib/
├── actions/          # ✓
├── db/               # ✓
└── scraper/          # ✓

trigger/              # ✓
```

### Formato de AGENTS.md

```markdown
# Nombre del Módulo

Propósito en una línea.

## Componentes/Archivos

| Nombre | Descripción |
|--------|-------------|
| file.ts | Qué hace |

## Patrones

- Patrón 1
- Patrón 2

## Dependencias

- `@/lib/xxx` - Para qué

## Anti-patrones (opcional)

- NO hacer X
- Evitar Y
```
