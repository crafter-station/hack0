# Organization Components

## Purpose
Componentes para gestión de comunidades/organizaciones en hack0.dev.

## Modules
- `badges/` - Generación y display de badges AI
- `campaigns/` - Gestión de campañas de badges
- `members/` - Showcase y gestión de miembros
- `settings/` - Configuración de organización
- `discovery/` - Listado público de organizaciones
- `creation/` - Formularios de creación
- `layout/` - Header, navegación, acciones
- `my-orgs/` - Dashboard de mis organizaciones

## Import Pattern
```tsx
import { BadgeDisplay } from "@/components/org/badges"
import { OrgHeader } from "@/components/org/layout"
```

## Anti-patterns
- NO importar archivos directamente, usar barrel exports
- NO mezclar lógica de rutas en componentes
- NO crear componentes que crucen múltiples módulos
