# Gift Cards

Feature completo de tarjetas de regalo personalizadas con IA.

## Componentes

| Componente | Descripción |
|------------|-------------|
| gift-landing-client.tsx | Página principal del feature |
| gift-card-display.tsx | Display de una gift card generada |
| gallery-card.tsx | Card para galería de gifts |
| gift-loading.tsx | Estado de carga con progreso |
| photo-upload.tsx | Upload de foto del usuario |
| upload-page-client.tsx | Página de upload |
| gift-banner.tsx | Banner promocional |
| gift-actions.tsx | Acciones (compartir, descargar) |
| card-reveal.tsx | Animación de revelación |
| gift-box-3d.tsx | Caja 3D animada |
| snowfall.tsx | Efecto de nieve |
| dark-color-scheme.tsx | Esquema de colores oscuro |

## Flujo

1. Usuario sube foto en `photo-upload`
2. Se dispara task `gift-card-generate`
3. `gift-loading` muestra progreso via metadata
4. Redirige a `gift-card-display` con resultado

## Rutas

- `/gift` - Landing page
- `/gift/upload` - Upload de foto
- `/gift/loading/[token]` - Estado de generación
- `/gift/card/[token]` - Card generada
- `/gift/gallery` - Galería pública

## Dependencias

- `trigger/gift-card-generate.ts` - Background job
- `lib/gift/` - Layouts y estilos
- `@/components/ui/` - Componentes base
