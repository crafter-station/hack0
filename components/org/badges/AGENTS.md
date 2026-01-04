# Badges Module

## Purpose
Generación AI de badges, display y configuración de estilos.

## Components
| Component | Access | Description |
|-----------|--------|-------------|
| BadgeDetailView | Public | Vista con Atropos 3D (navegación interna) |
| BadgeViralView | Public | Vista viral con CTA "Genera el tuyo" |
| BadgeDisplay | Public | Renderiza badge completo |
| BadgeGenerator | Public | Flow de upload + generación |
| BadgeLoading | Public | Loading para /c/ routes |
| BadgeLoadingViral | Public | Loading para /b/ viral routes |
| BadgeSection | Public | Sección colapsable de badges por campaña |
| GenerateBadgeCTA | Public | CTA para generar badge |
| BadgeSettingsForm | Admin | Config de badges |
| BadgePreviewPanel | Admin | Preview con efecto 3D |
| StylePresetSelector | Admin | Selector de presets |
| BrandColorPicker | Admin | Picker de color |
| StylePromptsEditor | Admin | Editor de prompts AI |

## Data Flow
Upload foto → UploadThing → Trigger.dev task → AI generation → Display

## Dependencies
- `@/lib/badge/style-presets` - Definiciones de estilos
- `@/hooks/use-badge-style-tester` - Hook de preview
- `atropos/react` - Efecto 3D
