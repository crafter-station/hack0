# Campaigns Module

## Purpose
Gestión de campañas de badges (estacionales, eventos).

## Components
- CampaignForm - Crear/editar campañas (Admin)
- CampaignList - Listar campañas (Admin)
- CampaignFilterTabs - Filtrar por campaña (Public)

## Campaign Types
- `default` - Siempre activa
- `seasonal` - Por tiempo (Navidad, etc)
- `event` - Vinculada a evento

## Dependencies
- Reutiliza componentes de `badges/` para styling
- `@/lib/actions/campaigns` - Server actions
