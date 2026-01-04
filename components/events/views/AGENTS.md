# Views Module

## Purpose
Modos de visualización de eventos. Cada vista ofrece una perspectiva diferente.

## Components
| Component | Description |
|-----------|-------------|
| AllEventsTable | Vista tabla con filas y paginación |
| EventsCards | Grid de tarjetas con imágenes |
| EventsCalendar | Vista mensual con eventos spanning |
| EventsMapView | Mapa D3.js con marcadores geográficos |
| EventsPreviewView | Lista + panel de preview animado |
| EventRowWithChildren | Fila expandible con eventos hijos |
| LoadMoreButton | Botón de paginación |

## View Mode Selection
El modo se guarda en cookies via `events-view-selector` y se lee con
`getEventsViewPreference()` del servidor.

## Dependencies
- `framer-motion` - Animaciones (preview view)
- `d3` + `topojson-client` - Mapas
- `date-fns` - Calendario
