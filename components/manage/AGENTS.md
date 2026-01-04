# Event Management

Dashboard de gestión de eventos para organizadores.

## Estructura

```
components/manage/
├── overview/           # Componentes de la tab Overview (ver AGENTS.md)
├── shared/             # Componentes compartidos (status badges)
├── manage-content.tsx  # Router de tabs
├── manage-dashboard.tsx
├── invite-dialog.tsx
└── share-event-dialog.tsx
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| manage-content.tsx | Router de tabs - delega a componentes especializados |
| manage-dashboard.tsx | Dashboard rápido con acciones |
| invite-dialog.tsx | Dialog para invitar miembros |
| share-event-dialog.tsx | Dialog para compartir en redes |
| overview/ | Componentes de la tab Overview (estilo Luma) |
| shared/ | Badges de status reutilizables |

## Tabs de ManageContent

| Tab | Contenido |
|-----|-----------|
| overview | OverviewTab - Hero card, quick actions, detalles, sponsors |
| edit | OrgEventFormMinimal mode="edit" (misma UX que crear evento) |
| team | CohostSelector para co-organizadores |
| winners | Gestión de claims de ganadores |
| analytics | Import jobs y notification logs |

## Ruta

- `/e/[code]/manage` - Dashboard de gestión

## Dependencias

- `@/components/org/creation` - OrgEventFormMinimal para edición
- `@/components/events/edit` - CohostSelector, HostAssignment
- `@/lib/actions/claims` - Acciones de claims
- `@/lib/actions/events` - Acciones de eventos

## Permisos

Solo accesible por:
- Owner de la organización del evento
- Co-hosts aprobados
- Usuarios con rol "god"
