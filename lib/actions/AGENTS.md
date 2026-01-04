# Server Actions

Todas las server actions de la aplicación. Core de la lógica de negocio.

## Módulos

| Archivo | Propósito |
|---------|-----------|
| events.ts | CRUD de eventos, ordenamiento inteligente, filtrado |
| organizations.ts | Gestión de organizaciones |
| communities.ts | Operaciones de comunidad |
| campaigns.ts | Campañas de badges |
| badges.ts | Generación y gestión de badges |
| cohost-invites.ts | Invitaciones de co-host para eventos |
| community-members.ts | Gestión de miembros de comunidad |
| claims.ts | Claims de organizadores/ganadores |
| permissions.ts | Verificación de permisos de usuario |
| analytics.ts | Analytics de comunidad |
| attendance.ts | Asistencia a eventos |
| import.ts | Importación de eventos externos |
| ai-extract.ts | Extracción de datos con IA |
| god-mode.ts | Acciones de super-admin |
| pending-events.ts | Eventos pendientes de aprobación |
| event-organizers.ts | Gestión de organizadores |
| organization-relationships.ts | Relaciones entre organizaciones |
| users.ts | Gestión de usuarios |

## Patrones

- Todas las actions usan `"use server"`
- Retornan `{ success: boolean, error?: string, data?: T }`
- Verifican permisos con `auth()` de Clerk
- Usan transacciones para operaciones múltiples
- Validan inputs antes de procesar

## Dependencias

- `@/lib/db` - Conexión y schema
- `@clerk/nextjs/server` - Autenticación
- `drizzle-orm` - Query builder

## Anti-patrones

- NO exponer actions sin verificación de permisos
- NO hacer queries directas sin usar las actions existentes
- Evitar duplicar lógica de permisos
