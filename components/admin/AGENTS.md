# Admin Components

Componentes para el panel de administración (God Mode).

## Components

| Component | Description |
|-----------|-------------|
| claims-list.tsx | Lista de winner claims con acciones approve/reject |
| host-claims-list.tsx | Lista de host claims con acciones approve/reject |
| pending-events-list.tsx | Lista de eventos pendientes de aprobación |
| pending-org-events.tsx | Eventos pendientes por organización |

## Patrones

- Componentes client-side con estado local para acciones
- Filtros por status (pending/approved/rejected)
- Collapsible rows para detalles expandidos
- Acciones de approve/reject con loading states

## Dependencias

- `@/lib/actions/claims` - Winner claims actions
- `@/lib/actions/host-claims` - Host claims actions
- `@/lib/actions/pending-events` - Pending events actions
