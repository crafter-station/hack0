# Database Layer

Schema Drizzle ORM y queries para Neon PostgreSQL.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| schema/ | Schema modular por dominio |
| index.ts | Conexión y exportación de `db` |
| seed.ts | Script de seeding (~36KB) |
| queries/ | Query helpers reutilizables |

## Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| events | Eventos (hackathons, workshops, etc.) |
| organizations | Comunidades/organizadores |
| users | Perfiles Clerk y preferencias públicas |
| emailVerifications | Verificación de email para Luma |
| eventSponsors | Sponsors de eventos |
| eventHostOrganizations | Co-hosts de eventos |
| eventHosts | Hosts individuales de eventos (Luma/manual) |
| eventOrganizers | Organizadores individuales de eventos |
| communityMembers | Miembros de comunidad |
| communityInvites | Invitaciones de comunidad |
| communityRoleRequests | Solicitudes de rol en comunidad |
| importJobs | Jobs de importación |
| scrapeSources | Fuentes de scraping |
| scrapeRuns | Ejecuciones de scraping |
| organizationRelationships | Relaciones del ecosistema |

## Convenciones

- IDs son UUID (`uuid().primaryKey().defaultRandom()`)
- Timestamps: `createdAt`, `updatedAt` con defaults
- Soft deletes NO usados - se eliminan registros
- Enums definidos con `pgEnum()`
- Relaciones definidas con `relations()`

## Comandos

```bash
bun run db:push    # Push schema a DB
bun run db:studio  # Abrir Drizzle Studio
```

## Anti-patrones

- NO modificar schema sin verificar migraciones
- NO hacer queries raw sin usar Drizzle
- Evitar N+1 queries - usar `with` para relaciones
