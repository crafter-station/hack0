# Database Layer

Schema Drizzle ORM y queries para Neon PostgreSQL.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| schema.ts | Definición completa del schema (~50KB) |
| index.ts | Conexión y exportación de `db` |
| seed.ts | Script de seeding (~36KB) |
| queries/ | Query helpers reutilizables |

## Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| events | Eventos (hackathons, workshops, etc.) |
| organizations | Comunidades/organizadores |
| userPreferences | Preferencias y rol de usuario |
| eventSponsors | Sponsors de eventos |
| eventHostOrganizations | Co-hosts de eventos |
| eventHosts | Hosts individuales de eventos (Luma/manual) |
| winnerClaims | Claims de ganadores |
| hostClaims | Claims de hosts de eventos |
| organizerClaims | Claims de organizadores |
| subscriptions | Suscripciones email |
| badgeCampaigns | Campañas de badges |
| badgeCampaignMembers | Miembros de campañas |
| communityMembers | Miembros de comunidad |
| importJobs | Jobs de importación |
| notificationLogs | Logs de notificaciones |
| submissionTemplates | Plantillas de formulario de entregas por evento |
| submissions | Proyectos enviados por participantes |
| submissionTeamMembers | Miembros de equipo por submission |
| judgeAssignments | Asignación de jueces a eventos |
| judgeScores | Puntajes individuales por criterio |

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
