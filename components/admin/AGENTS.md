# Admin Components

Componentes para el panel de administración (God Mode).

## Components

| Component | Description |
|-----------|-------------|
| pending-events-list.tsx | Lista de eventos pendientes de aprobación |
| scraper/ | Inbox de curación para eventos importados/scrapeados |
| scraper-constants.ts | Constantes visuales compartidas del scraper inbox |

## Patrones

- Componentes client-side con estado local para acciones
- Filtros por status de aprobación
- Collapsible rows para detalles expandidos
- Acciones de approve/reject con loading states

## Dependencias

- `@/lib/actions/events` - Approval actions para eventos
- `@/lib/actions/scraper-curation` - Acciones de curación para imports scrapeados
