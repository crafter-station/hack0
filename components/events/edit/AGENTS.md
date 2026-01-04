# Edit Module

## Purpose
Formularios y diálogos para edición de eventos.

## Components
| Component | Description |
|-----------|-------------|
| EditEventForm | Form principal de edición |
| EditEventDialog | Dialog wrapper para el form |
| DateRangeInput | Inputs de fecha inicio/fin |
| LocationInput | Selector de ubicación |
| PrizeInput | Input de premio con moneda |
| FormatSelector | Selector virtual/presencial/híbrido |
| LinksInput | Inputs de URLs |
| CohostSelector | Multi-select de co-organizadores |
| HostAssignment | Asignación de hosts del evento |
| SponsorManager | Gestión de sponsors por tier |
| DeleteEventButton | Botón de eliminación con confirmación |

## Form Fields
- Nombre, descripción (markdown)
- Fechas con timezone (Lima)
- Ubicación (departamento, ciudad, venue)
- Formato, tipo, skill level
- Premio (monto, moneda, descripción)
- Links (website, registro, devpost)
- Imagen de banner
- Sponsors y co-hosts

## Dependencies
- `@/lib/actions/events` - Server actions
- Timezone: America/Lima
