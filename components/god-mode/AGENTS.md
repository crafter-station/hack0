# God Mode

Interfaz de super-administrador para gestión global del ecosistema.

## Componentes

| Componente | Descripción |
|------------|-------------|
| ecosystem-graph.tsx | Visualización D3 de relaciones entre orgs |
| ecosystem-graph-container.tsx | Container con controles |
| ecosystem-graph-sidebar.tsx | Sidebar con detalles de nodo |
| god-mode-event-form.tsx | Formulario de creación de eventos |
| god-mode-nav.tsx | Navegación del panel god |
| god-mode-banner.tsx | Banner indicador de god mode |
| organizations-table.tsx | Tabla de todas las organizaciones |

## Rutas

| Ruta | Propósito |
|------|-----------|
| /god | Dashboard principal |
| /god/events | Gestión de eventos |
| /god/events/new | Crear evento |
| /god/organizations | Gestión de orgs |
| /god/pending | Aprobaciones pendientes |
| /god/graph | Visualización de ecosistema |
| /god/wins | Gestión de claims |

## Acceso

Solo usuarios con `role: "god"` en `userPreferences`.

Verificación en:
- `lib/god-mode.ts` - Helper `isGodMode()`
- `lib/actions/permissions.ts` - Verificación de permisos

## Dependencias

- `@/lib/actions/god-mode` - Acciones de admin
- `@/lib/actions/pending-events` - Eventos pendientes
- D3.js - Visualización de grafos
