# Trigger.dev Background Jobs

Tasks de Trigger.dev v3 para procesamiento asíncrono.

## Tasks

| Task | Propósito |
|------|-----------|
| community-badge-generate.ts | Genera badges personalizados con IA (Fal.ai) |
| gift-card-generate.ts | Genera tarjetas de regalo con IA |
| event-import.ts | Importa eventos de fuentes externas |
| luma-webhook-processor.ts | Procesa webhooks de Luma (eventos + hosts) |
| org-scraper.ts | Scraping de organizaciones |
| org-scraper-preview.ts | Preview de resultados de scraping |
| org-relationship-discovery.ts | Descubre relaciones entre organizaciones |
| test-badge-style.ts | Testing de estilos de badge |

## Patrones

- SIEMPRE usar `@trigger.dev/sdk/v3` (NUNCA v2)
- `metadata.set()` para tracking de progreso visible en dashboard
- `triggerAndWait()` retorna Result - verificar `result.ok`
- Config centralizada en `trigger.config.ts`
- `maxDuration` definido para cada task

## Ejemplo

```ts
import { metadata, task } from "@trigger.dev/sdk/v3";

export const myTask = task({
  id: "my-task",
  maxDuration: 120,
  run: async (payload) => {
    metadata.set("step", "processing");
    // lógica
    return { success: true };
  },
});
```

## Dependencias Externas

- Fal.ai - Generación de imágenes con IA
- Firecrawl - Web scraping
- Resend - Envío de emails

## Anti-patrones

- NUNCA usar `client.defineJob` (API v2 deprecada)
- NO envolver `triggerAndWait` en `Promise.all`
- Evitar tasks sin `maxDuration` definido
