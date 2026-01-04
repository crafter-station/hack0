# Manage Overview Components

Componentes para la tab Overview de la página de gestión de eventos.

## Componentes

| Archivo | Descripción |
|---------|-------------|
| overview-tab.tsx | Container principal que ensambla todos los componentes |
| event-hero-card.tsx | Hero card con imagen, status prominentes, y sanity checks |
| quick-actions.tsx | Botones de acción (Editar, Compartir, Invitar) |
| event-info-grid.tsx | Grid de detalles del evento + comunidad + enlaces |
| sponsors-list.tsx | Lista horizontal de sponsors con logos |

## Patrones

- Usa Card/CardHeader/CardContent de shadcn para estructura
- StatusBadge/ApprovalBadge de `../shared/` para badges consistentes
- Reutiliza EditEventDialog y ShareEventDialog existentes

## Dependencias

- `@/components/manage/shared/status-badge` - Badges de status
- `@/components/events/edit` - Diálogos de edición
- `@/components/manage/share-event-dialog` - Diálogo de compartir
- `@/lib/event-utils` - Utilidades de formateo de eventos

## Anti-patrones

- NO duplicar lógica de sanity checks (está en event-hero-card)
- NO usar estilos inline para badges de status
