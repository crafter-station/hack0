# Event Scraper

Pipeline de scraping para importar eventos y organizaciones de fuentes externas.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| firecrawl.ts | Integración con Firecrawl API (14KB) |
| luma-schema.ts | Schema Zod para eventos de Lu.ma |
| org-schema.ts | Schema Zod para organizaciones |
| relationship-schema.ts | Inferencia de relaciones entre orgs |

## Flujo de Scraping

1. Se recibe URL de evento/organización
2. Firecrawl extrae contenido de la página
3. IA (Claude) estructura datos según schema
4. Schema Zod valida la respuesta
5. Se crea/actualiza registro en DB

## Fuentes Soportadas

- Lu.ma - Eventos
- Devpost - Hackathons
- Páginas web genéricas

## Dependencias

- `FIRECRAWL_API_KEY` - API key de Firecrawl
- `trigger/org-scraper.ts` - Background job de scraping
- `trigger/event-import.ts` - Importación de eventos

## Schemas

Los schemas Zod definen:
- Campos requeridos vs opcionales
- Validaciones de formato
- Valores por defecto
- Transformaciones de datos

## Anti-patrones

- NO hacer scraping sin rate limiting
- Evitar scraping de páginas sin autorización
- NO guardar datos sin validar con schema
