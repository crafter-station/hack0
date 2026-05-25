# Admin Components

Componentes para el panel de administración (God Mode).

## Components

| Component | Description |
|-----------|-------------|
| pending-events-list.tsx | Lista de eventos pendientes de aprobación |
| pending-org-events.tsx | Eventos pendientes por organización |

## Patrones

- Componentes client-side con estado local para acciones
- Filtros por status de aprobación
- Collapsible rows para detalles expandidos
- Acciones de approve/reject con loading states

## Dependencias

- `@/lib/actions/pending-events` - Pending events actions
