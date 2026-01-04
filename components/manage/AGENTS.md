# Event Management

Dashboard de gestión de eventos para organizadores.

## Componentes

| Componente | Descripción |
|------------|-------------|
| manage-content.tsx | Contenido principal con tabs (27KB) |
| manage-dashboard.tsx | Dashboard rápido con acciones |
| invite-dialog.tsx | Dialog para invitar miembros |
| share-event-dialog.tsx | Dialog para compartir en redes |

## Tabs de ManageContent

| Tab | Contenido |
|-----|-----------|
| overview | Detalles del evento, sponsors, comunidad, sanity checks |
| edit | EditEventForm + DeleteEventButton (zona de peligro) |
| team | CohostSelector para co-organizadores |
| winners | Gestión de claims de ganadores |
| analytics | Import jobs y notification logs |

## Ruta

- `/e/[code]/manage` - Dashboard de gestión

## Dependencias

- `@/components/events/edit` - Formularios de edición
- `@/lib/actions/claims` - Acciones de claims
- `@/lib/actions/events` - Acciones de eventos

## Permisos

Solo accesible por:
- Owner de la organización del evento
- Co-hosts aprobados
- Usuarios con rol "god"
