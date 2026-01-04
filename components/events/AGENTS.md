# Events Components

## Purpose
Componentes para display, filtrado, edición y gestión de eventos en hack0.dev.

## Modules
- `views/` - Modos de visualización (tabla, cards, calendario, mapa, preview)
- `toolbar/` - Barra de herramientas, filtros y selector de vista
- `detail/` - Componentes de página de detalle de evento
- `edit/` - Formularios y diálogos de edición de eventos

## Import Pattern
```tsx
import { AllEventsTable, EventsCards } from "@/components/events/views"
import { EventsToolbar } from "@/components/events/toolbar"
import { AttendanceButton } from "@/components/events/detail"
import { EditEventDialog } from "@/components/events/edit"
```

## View Modes
- Table - Lista con filas expandibles
- Cards - Grid de tarjetas
- Calendar - Vista mensual con eventos
- Map - Mapa geográfico con D3.js
- Preview - Panel lateral con detalle

## Anti-patterns
- NO importar archivos directamente, usar barrel exports
- NO mezclar lógica de rutas en componentes
