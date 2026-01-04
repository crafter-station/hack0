# Members Module

## Purpose
Display público de miembros y gestión administrativa estilo Vercel.

## Components
| Component | Access | Description |
|-----------|--------|-------------|
| MemberShowcaseGrid | Public | Galería de badges por campaña |
| MemberShowcaseCard | Public | Card individual con badge |
| MembersManagement | Admin | Panel completo de gestión (Vercel-style) |
| InviteManager | Admin | Gestión de invite links |
| AcceptInviteButton | Public | Aceptar invitación |
| JoinOrgDialog | Public | Dialog de unirse |
| FollowButtonAnimated | Public | Botón follow animado |

## MembersManagement Features (Vercel-style)
- **Email invites**: Form con múltiples emails + selector de rol
- **Link invites**: Generación de links compartibles
- **Tabs**: "Miembros" | "Invitaciones"
- **Filtros**: Búsqueda, rol, ordenamiento
- **Selección múltiple**: Checkboxes + acciones en lote
- **Manage Access**: Cambio de rol por miembro

## Roles
owner > admin > member > follower

## Page Locations
- /c/[slug]/comunidad → Galería de badges (público)
- /c/[slug]/settings/members → Gestión de miembros (Admin-only)

## Server Actions (lib/actions/community-members.ts)
| Action | Description |
|--------|-------------|
| sendEmailInvite | Envía invitaciones por email |
| bulkRemoveMembers | Elimina múltiples miembros |
| bulkUpdateMemberRoles | Actualiza rol de múltiples miembros |
| createInviteLink | Genera link de invitación |
| updateMemberRole | Actualiza rol individual |
| removeMember | Elimina miembro individual |

## Email Template
- `lib/email/templates/community-invite.tsx` - Template de invitación

## Schema (community_invites)
| Column | Type | Description |
|--------|------|-------------|
| invite_type | enum('link', 'email') | Tipo de invitación |
| email | varchar(255) | Email del invitado (para tipo email) |
| role_granted | community_role | Rol que se otorgará |
| max_uses | integer | Máximo de usos (para links) |
| expires_at | timestamp | Fecha de expiración |
