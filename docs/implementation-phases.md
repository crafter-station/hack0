# Implementation Phases — hack0 consolidation (community tools, in-place)

> Arquitectura/decisión: [`consolidation-plan.md`](./consolidation-plan.md). Este doc = la secuencia de ejecución (fases con gate + rollback), **todo en el repo hack0, por branches con PR**. **Estado:** en ejecución. **Fecha:** 2026-07-28.

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

### F0 — Entorno + baseline ✅
- El usuario setea el entorno local (lo solicitará aparte): `.env` con `DATABASE_URL` (Neon), Clerk, `AI_GATEWAY_API_KEY`, etc. (ver `services-guide.md`).
- `bun install` → `bun run dev`; baseline verde (`bun run check`, `bun run build` pasan; app levanta).
- **Gate:** hack0 corre local sin regresión.

### F1 — Contrato de ingestión + seguridad de escritura ✅
- Adaptadores entregan candidatos neutrales, validados antes de normalizar.
- Scripts y tasks son dry-run por defecto.
- Escrituras requieren entorno y autorización explícitos; producción requiere una
  segunda confirmación.
- **Resultado:** PR #153.

### F2 — Deduplicación + consistencia ✅
- Identidad por provider/external ID, URL canónica y nombre+fecha+ubicación.
- Casos ambiguos van a revisión; nunca se fusionan solo por nombre.
- Auditoría read-only del índice y supresiones manuales trazables.
- **Resultado:** PRs #154 y #155; auditoría pública con cero inconsistencias.

### F3 — Sync bidireccional Hack0 ↔ Luma 🔄
Objetivo simple: todo evento publicado por Hack0 puede aparecer en el calendario
Hack0 de Luma, y los cambios legítimos de Luma pueden volver a Hack0, sin crear
dos registros ni entrar en un ciclo.

1. **F3.1 Entrada segura:** verificar firma y antigüedad del webhook, validar el
   payload y deduplicar reintentos por `Webhook-Id`.
2. **F3.2 Identidad remota:** guardar qué registro Hack0 corresponde a qué
   evento/listado/calendario Luma.
3. **F3.3 Salida a Luma:** usar `Add Existing Luma Event` cuando ya existe un
   evento Luma; usar `Add External Event` apuntando a `hack0.dev/e/<code>` para
   eventos nativos o de otros proveedores. No se crea otra página de registro.
4. **F3.4 Retorno y anti-loop:** actualizar solo campos permitidos, ignorar el
   eco de una escritura propia y conservar la fuente/propietario original.
5. **Canary:** probar un evento de cada modalidad, revisar Hack0 y Luma y repetir
   para confirmar idempotencia.

- **Gate:** firma inválida/replay rechazados; cada evento tiene un solo vínculo
  remoto; una segunda ejecución no crea otro listado; cambios entrantes no
  reactivan duplicados ni producen un loop.
- **Rollback:** desactivar el webhook y la salida; los eventos Hack0 permanecen
  intactos.

### F4 — Fuentes, una por una
- Orden: Devpost → Calendar Router API → calendarios Luma opt-in de usuarios →
  Peruanos.dev → descubrimiento Luma LATAM → Exa/Firecrawl.
- Cada fuente sigue su propio PR, dry-run, revisión, canary y auditoría según
  [`event-ingestion-rollout.md`](./event-ingestion-rollout.md).
- **Gate:** la fuente aprobada es idempotente y aparece tanto en Hack0 como en
  el calendario Hack0 de Luma.

### F5 — Frescura continua + deploy controlado
- Agregar `trigger:deploy` y CI cuando F3 y al menos una fuente hayan pasado su
  canary.
- Verificar env de Trigger/Vercel y desplegar primero sin promover.
- Activar únicamente la fuente aprobada; las demás siguen deshabilitadas o
  read-only.
- **Gate:** ejecución visible en Trigger, índice fresco y auditoría posterior
  sin duplicados.
- **Rollback:** desactivar el schedule o volver a la versión anterior.

### F6 — Schema badges/design-kit (Drizzle/Neon, aditivo)
- Nuevas tablas: `badges`, `badge_templates`, `event_style_presets` — **community-scoped** (`organization_id` + `event_id`, permisos vía `community_members`).
- Migración Drizzle (`db:generate` → `db:migrate`).
- **Gate:** migración aplica limpio; tablas existentes intactas; `db:studio` muestra el schema nuevo.
- **Rollback:** migración down / drop de tablas nuevas.

### F7 — Portar generación + render de badges a Next.js
- Portar de luma-card: render de badge (canvas 1080×1600 + QR), editor, preview, **AI styling** (vía el AI gateway de hack0), subida de imágenes (UploadThing).
- Rutas: editor bajo `/e/[code]` (por evento) y en el hub `/c/[slug]`.
- **Gate:** un gestor genera un badge para un evento y lo descarga; AI styling responde; imagen sube a UploadThing.

### F8 — Import Luma frictionless + opt-in publish
- Extender `lib/luma/*`: flujo "pega un link de Luma → evento"; bulk import de un calendario de comunidad.
- Opt-in publish: los eventos importados de una comunidad se listan en el índice público (auto-approve si org `is_verified`).
- **Gate:** conectar Luma → import (link y bulk) → publish opt-in → aparece en `/events` público.

### F9 — Hub de comunidad `/c/<slug>`
- Integrar en `/c/[slug]`: eventos + configuración + badges/design-kit juntos (diseño hack0). Galería global → footer/navbar. Templates → dropdown destacado (a evaluar).
- Permisos por `community_members`.
- **Gate:** en `/c/theveller` el gestor administra eventos, config y genera el kit por evento desde un solo lugar.

### F10 — Expansión design-kit (posterior)
- Certificados, flyers imprimibles, tokenización, más formatos del "social media design kit".
- **Gate:** cada formato nuevo genera assets descargables por evento.

## Verificación global
Por fase, el "Gate" es el criterio de salida. E2E: índice se actualiza solo
(F5) · badge/kit generado bajo `/c/<slug>` (F7+F9) · import Luma frictionless
→ publish (F8) · sin regresión del índice público ni de auth Clerk.

## Nota
Sin cutover (hack0.dev ya desplegado). El entorno lo setea el usuario. Implementación por branches; nada se ejecuta hasta su OK por fase.
