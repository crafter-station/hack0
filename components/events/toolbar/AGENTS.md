# Toolbar Module

## Purpose
Barra de herramientas con búsqueda, filtros y selector de vista.

## Components
| Component | Description |
|-----------|-------------|
| EventsToolbar | Barra principal: search + filters + view selector |
| EventsFiltersPopover | Popover con filtros avanzados |
| EventsViewSelector | Dropdown para cambiar modo de vista |

## State Management
- Filtros via URL params con `nuqs`
- Vista preferida en cookies
- Search con debounce

## Filter Options
- Tipo de evento
- Tipo de organizador
- Dominio
- Formato (virtual/presencial/híbrido)
- Estado (próximo/abierto/terminado)
- País/Departamento
