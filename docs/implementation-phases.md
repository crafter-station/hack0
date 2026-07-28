# Implementation Phases — hack0 consolidation (community tools, in-place)

> Arquitectura/decisión: [`consolidation-plan.md`](./consolidation-plan.md). Este doc = la secuencia de ejecución (fases con gate + rollback), **todo en el repo hack0, por branches con PR**. **Estado:** aprobado; implementación de features aún no iniciada. **Fecha:** 2026-07-27.

> La estabilización e incorporación gradual de fuentes de eventos se ejecuta
> primero según [`event-ingestion-rollout.md`](./event-ingestion-rollout.md).
> Ninguna fuente se agenda en producción hasta pasar su gate individual.

## Principios
- **Stack de hack0 sin cambios** (Next.js/Neon/Clerk/Vercel/Trigger.dev). Reusar lo existente antes de crear.
- **Branches + PR por fase**, cada una con su gate de verificación; merge solo con gate verde.
- **No romper el índice público actual** en cada paso.
- **Aditivo primero:** nuevas tablas Drizzle nullable/aisladas; migraciones reversibles.
- **Diseño = hack0** (la UI de luma-card se reconstruye con el sistema de diseño de hack0).

## Fases

### F0 — Entorno + baseline
- El usuario setea el entorno local (lo solicitará aparte): `.env` con `DATABASE_URL` (Neon), Clerk, `AI_GATEWAY_API_KEY`, etc. (ver `services-guide.md`).
- `bun install` → `bun run dev`; baseline verde (`bun run check`, `bun run build` pasan; app levanta).
- **Gate:** hack0 corre local sin regresión.

### F1 — Frescura del índice (blocker original, in-place)
- Desplegar Trigger.dev: agregar script `trigger:deploy` en `package.json` + workflow CI que corra `trigger.dev deploy` en push a main. Alternativa: Vercel Cron → route handler que dispare `sync:luma`/scrapers.
- Verificar env de prod (Vercel): `DATABASE_URL`, `LUMA_API_KEY`, `TRIGGER_*`, `FIRECRAWL_API_KEY`; registrar/validar el webhook de Luma.
- Operar la cola de curación (`/god/events`) o auto-aprobar fuentes confiables.
- **Gate:** el `luma-calendar-sync` horario + scrapers corren en prod; la web muestra eventos frescos; `import` visible en el dashboard de Trigger.
- **Rollback:** deshabilitar el cron/deploy.

### F2 — Schema badges/design-kit (Drizzle/Neon, aditivo)
- Nuevas tablas: `badges`, `badge_templates`, `event_style_presets` — **community-scoped** (`organization_id` + `event_id`, permisos vía `community_members`).
- Migración Drizzle (`db:generate` → `db:migrate`).
- **Gate:** migración aplica limpio; tablas existentes intactas; `db:studio` muestra el schema nuevo.
- **Rollback:** migración down / drop de tablas nuevas.

### F3 — Portar generación + render de badges a Next.js
- Portar de luma-card: render de badge (canvas 1080×1600 + QR), editor, preview, **AI styling** (vía el AI gateway de hack0), subida de imágenes (UploadThing).
- Rutas: editor bajo `/e/[code]` (por evento) y en el hub `/c/[slug]`.
- **Gate:** un gestor genera un badge para un evento y lo descarga; AI styling responde; imagen sube a UploadThing.

### F4 — Import Luma frictionless + opt-in publish
- Extender `lib/luma/*`: flujo "pega un link de Luma → evento"; bulk import de un calendario de comunidad.
- Opt-in publish: los eventos importados de una comunidad se listan en el índice público (auto-approve si org `is_verified`).
- **Gate:** conectar Luma → import (link y bulk) → publish opt-in → aparece en `/events` público.

### F5 — Hub de comunidad `/c/<slug>`
- Integrar en `/c/[slug]`: eventos + configuración + badges/design-kit juntos (diseño hack0). Galería global → footer/navbar. Templates → dropdown destacado (a evaluar).
- Permisos por `community_members`.
- **Gate:** en `/c/theveller` el gestor administra eventos, config y genera el kit por evento desde un solo lugar.

### F6 — Expansión design-kit (posterior)
- Certificados, flyers imprimibles, tokenización, más formatos del "social media design kit".
- **Gate:** cada formato nuevo genera assets descargables por evento.

## Verificación global
Por fase, el "Gate" es el criterio de salida. E2E: índice se actualiza solo (F1) · badge/kit generado bajo `/c/<slug>` (F3+F5) · import Luma frictionless → publish (F4) · sin regresión del índice público ni de auth Clerk.

## Nota
Sin cutover (hack0.dev ya desplegado). El entorno lo setea el usuario. Implementación por branches; nada se ejecuta hasta su OK por fase.
