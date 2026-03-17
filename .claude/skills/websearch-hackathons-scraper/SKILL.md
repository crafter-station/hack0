---
name: websearch-hackathons-scraper
description: Scraper de hackathones LATAM que usa WebSearch de Claude Code directamente — sin API key externa. Ejecuta 40-50 queries curadas (geografía, temática, empresas tech reconocidas) y carga los resultados a la DB con dedup. Usar cuando el usuario quiera correr el websearch scraper, agregar nuevos hackathones con WebSearch, o buscar hackathones de empresas como Vercel, Microsoft, OpenAI, Google, AWS, etc. También usar para crear o actualizar lib/scraper/sources/websearch.ts.
---

# websearch-scraper

Usa el tool `WebSearch` de Claude Code para descubrir hackathones LATAM. Cada query busca por características (geografía, tema, tipo de organizador) — nunca por nombre de evento específico. Los resultados pasan por el pipeline estándar (normalizer → deduplicator → DB insert).

## Cuándo usarlo

- El usuario pide "corre el websearch scraper"
- El usuario quiere buscar hackathones de empresas específicas (Vercel, Microsoft, etc.)
- Se quiere poblar la DB con hackathones descubiertos via web search
- Se quiere crear/actualizar `lib/scraper/sources/websearch.ts`

## Workflow

### Paso 1: Leer queries

Lee `references/queries.md` para obtener la lista de queries. Son ~58 queries organizadas en 5 categorías:
- **Geográficas LATAM** (15): cobertura por país/región
- **Ciudades LATAM** (13): hubs tech de alta densidad
- **Temáticas** (10): AI, fintech, clima, salud, web3, civic
- **Empresas tech** (11): Microsoft, OpenAI, Google, AWS, Meta, Hugging Face, Anthropic, GitHub, Nvidia, IBM, blockchain
- **Globales abiertas a LATAM** (5): hackathones online sin restricción geográfica

### Paso 2: Ejecutar WebSearch por batch

Procesa en batches de 5 queries a la vez. Por cada resultado de búsqueda, aplica el filtro de 3 capas antes de incluirlo:

---

### FILTRO CAPA 1: Verificación de URL (descartar inmediatamente si aplica alguna regla)

**Dominios de medios/noticias — SIEMPRE descartar:**
```
primicias.ec, elcomercio.com, larepublica.pe, elperuano.pe, andina.pe,
noticiasneo.com, semana.com, forbes.com.mx, expansion.mx, elfinanciero.com.mx,
folha.uol.com.br, globo.com, terra.com.br, infobae.com, clarin.com,
trustfortheamericas.org, copernicuslac.eu, cecan.cl,
perplexity.ai, bing.com, google.com/search
```
> Regla general: si el dominio es claramente un medio de comunicación, periódico, revista o buscador, descarta el resultado aunque el título suene a hackathon.

**Patrones de ruta que indican artículo (no página de evento):**
- Contiene `/news/`, `/noticias/`, `/articles/`, `/blog/`, `/prensa/`, `/sala-de-prensa/`
- Contiene segmentos de fecha como `/2025/03/`, `/2026/02/13/`
- Contiene `/ciencia-tecnologia/`, `/innovacion/articulo/`, `/emprendimiento/`
- La URL es la homepage genérica de una plataforma sin path de evento específico (ej: `ethglobal.com` solo, `devpost.com` solo)

**Requiere que la URL sea la página real del evento:**
- Plataformas conocidas con path de evento: `devpost.com/hackathon-name`, `lu.ma/evento`, `dorahacks.io/hackathon/name`, `eventbrite.com/e/...`
- Dominio del organizador: universidad, empresa, o fundación con path que sugiere evento (`/hackathon`, `/challenge`, `/reto`, `/convocatoria`)
- **NUNCA usar una URL de artículo periodístico como `sourceUrl`** — si el único resultado es una cobertura de prensa, descarta el evento completo

---

### FILTRO CAPA 2: Verificación de snippet (señales de evento futuro activo)

**Señales POSITIVAS — incluir si el snippet contiene al menos una:**
- Palabras de inscripción: "inscripción abierta", "registro abierto", "inscrições abertas", "open registration", "apply now", "participa", "regístrate"
- Palabras de convocatoria futura: "convocatoria", "próximo", "upcoming", "2026", "2025"
- Premio o incentivo: "premio", "prize", "$", "ganadores serán", "cash prize"
- Formato de competencia: "equipos de", "teams of", "48 horas", "72 hours", "building", "desarrollar una solución"

**Señales NEGATIVAS — descartar si el snippet contiene alguna:**
- Pasado: "concluyó", "finalizó", "concluded", "sparked", "showcased", "winners were", "ganadores del", "se llevó a cabo", "realizó con éxito"
- Recap/cobertura: "crónica", "así fue", "resultados del", "entrega de premios", "ceremony"
- No-evento: "job posting", "vacante", "we're hiring", "curso online", "bootcamp de", "webinar"
- Plataforma genérica sin evento específico: el snippet describe la plataforma en general, no un hackathon concreto

---

### FILTRO CAPA 3: Clasificación como hackathon genuino

Un resultado pasa esta capa si cumple al menos uno:
- El nombre contiene: hackathon, hackaton, hackatón, datathon, buildathon, appathon, devathon, ideathon, innovathon, code jam, maratona de programação, desafío de código
- El snippet describe explícitamente que participantes **construyen** algo en tiempo limitado (horas, días) y hay evaluación/jurado

**Descartar aunque diga "hackathon" en el título:**
- Conferencias sobre hackathones (ej: "panel de hackathon en congreso X")
- Cursos que usan "hackathon" de forma metafórica
- ETH* genéricos (`ethglobal.com`, `ethbogota.com` sin fecha/evento específico) — solo incluir si hay un evento anunciado con fecha concreta

---

### Criterios de aceptación por scopeHint

**`scopeHint: "latam"`** — incluir si cumple al menos uno:
- Se realiza presencialmente en un país de América Latina (MX, BR, CO, PE, AR, CL, EC, BO, PY, UY, VE, CR, PA, GT, SV, HN, NI, DO, CU, HT, JM, TT, BB, PR, GY, SR, BZ)
- Es online/virtual y dirigido explícitamente a participantes latinoamericanos
- Organizado por una entidad con base en LATAM (universidad, empresa, gobierno LATAM)
- El evento es 100% en inglés pero ocurre en un país LATAM → sigue siendo LATAM

**`scopeHint: "global"`** — hackathones 100% online sin restricción geográfica, de empresas/instituciones reconocidas. Incluir si cumple TODOS:
- Sin restricción geográfica que excluya LATAM (LATAM puede participar libremente)
- Organizado por una empresa o institución con reconocimiento real en el ecosistema tech o en su industria — no necesariamente "famosa", pero sí con presencia verificable: producto activo, comunidad, open source adoptado, o mandato institucional reconocido (agencia de la ONU, banco de desarrollo, fundación de protocolo, etc.). La pregunta clave: ¿un desarrollador latinoamericano reconocería esta empresa/institución como legítima en su campo?
- Tiene página oficial verificable con fecha y formato hackathon claro
- Registro gratuito (sin costo de inscripción para participantes)
- NO incluir si el organizador es una empresa genérica sin presencia pública verificable, aunque se autoproclame "global"

**Criterios universales (aplican a latam y global):**
- El evento es un hackathon donde los participantes **construyen y shipean** algo — puede durar desde 24h hasta varias semanas (buildathon, hackathon de un mes, etc.)
- Audiencia: cualquier persona que quiera construir — estudiantes, profesionales, independientes. No filtrar por nivel.
- **Registro gratuito** — descartar hackathones con costo de inscripción
- Evento futuro con inscripción abierta o por abrir (no pasados, no sin fecha)

**ETH* y conferencias con hackathon embebido:**
- ETHBogota, ETHMexico, ETHArgentina etc. son principalmente conferencias — **solo incluir si el hackathon tiene su propia página/registro separado** con fechas y formato de construcción claros
- Si solo hay una mención de "hackathon" dentro de una página de conferencia general → no incluir
- Si el hackathon tiene registro independiente → incluir SOLO ese hackathon (no la conferencia)

### Paso 3: Estructurar como RawHackathon

Para cada hackathon que pasa los 3 filtros, extrae todos los campos posibles del snippet y la URL. La calidad del dato depende de cuánto se complete aquí — el post-processor no visita la URL del evento.

```typescript
{
  // --- Requeridos ---
  name: string,                  // Nombre exacto del hackathon (del título, no de la URL)
  sourceUrl: string,             // URL de la PÁGINA DEL EVENTO (nunca artículo de prensa)
  sourceType: "websearch",

  // --- Fechas ---
  startDate?: string,            // ISO 8601 (YYYY-MM-DD) — solo si está en snippet, no inventar
  endDate?: string,
  registrationDeadline?: string, // Fecha límite de inscripción si aparece en snippet

  // --- Descripción ---
  description?: string,          // Del snippet, máx 400 chars — describe el formato de competencia

  // --- Ubicación ---
  country?: string,              // ISO 2 letras (MX, BR, CO, PE...) — inferir de snippet/URL/dominio
  city?: string,
  modality?: "online" | "in_person" | "hybrid",

  // --- Premios ---
  prizePool?: string,            // String libre: "$10,000 USD", "S/ 20,000", "€5,000"
  prizes?: Array<{               // Si hay desglose por lugar en el snippet
    place: string,               // "1er lugar", "2nd place", "Ganador"
    amount: string,              // "$5,000"
    description: string,         // "AWS credits + mentorship"
  }>,

  // --- Organización ---
  organizers?: Array<{
    name: string,                // Nombre de la organización
    url?: string,                // URL del organizador (si aparece en snippet)
  }>,
  sponsors?: Array<{
    name: string,                // Nombre del sponsor
    tier?: string,               // "platinum", "gold", "silver", "community"
  }>,

  // --- Participación ---
  teamSizeMin?: number,          // Mínimo de integrantes por equipo
  teamSizeMax?: number,          // Máximo de integrantes por equipo
  eligibility?: string,         // Quién puede participar (estudiantes, profesionales, etc.)

  // --- Clasificación ---
  themes?: string[],             // Temas: ["AI", "fintech", "salud", "web3", "clima"]
  technologies?: string[],       // Tecnologías: ["Python", "React", "Solidity"]
  tracks?: string[],             // Tracks si el hackathon tiene varios

  // --- Links ---
  websiteUrl?: string,           // Igual a sourceUrl si es la página principal del evento
  registrationUrl?: string,      // URL directa de registro si difiere del website

  // --- Media ---
  imageUrl?: string,             // URL de imagen/banner del evento si aparece en el resultado

  // --- Scope ---
  scopeHint?: "latam" | "global",
}
```

**Reglas para `scopeHint`:**
- `"latam"` → queries geográficas (A, A2) y temáticas (B)
- `"global"` → queries de empresas tech (C) y globales (D)

**Reglas para inferir `eventType` — el normalizer usa el nombre+descripción, sé preciso:**
- Si el nombre contiene hackathon/datathon/buildathon → el normalizer lo clasificará como `"hackathon"` automáticamente
- Si es una competencia de programación sin ese vocabulario → describir como "competencia" en el description para que el normalizer lo clasifique como `"competition"`
- ETH* y similares que son conferencias con hackathon secundario → NO incluir a menos que el snippet describa claramente un hackathon con fecha y registro
- **NUNCA** incluir si el evento es fundamentalmente un fellowship, curso, bootcamp o conferencia

---

### Paso 4: Deduplicar en memoria

Antes de insertar, deduplica el array:
- Descarta duplicados por URL exacta (normalizada sin trailing slash, sin query params)
- Descarta duplicados por nombre con >75% word overlap
- Si dos resultados apuntan al mismo evento pero uno tiene URL de artículo y otro URL de evento → conserva el de URL de evento, descarta el de artículo
- Prioriza el resultado con más campos completos

### Paso 5: Escribir a archivo temporal y ejecutar pipeline

Escribe los resultados a `/tmp/websearch-hackathons.json` como array de RawHackathon. Luego ejecuta:

```bash
cd /Users/juanortega/hack0-2 && bun run scripts/seed-scraper.ts --input /tmp/websearch-hackathons.json
```

Si `seed-scraper.ts` no acepta `--input`, crea un script inline:

```bash
cd /Users/juanortega/hack0-2 && bun -e "
import results from '/tmp/websearch-hackathons.json';
import { runPostProcessor } from './lib/scraper/post-processor';
import { normalizeHackathon } from './lib/scraper/normalizer';
import { deduplicateAgainstDB } from './lib/scraper/deduplicator';
import { db } from './lib/db';
import { events } from './lib/db/schema';

const { hackathons } = await runPostProcessor(results);
const normalized = hackathons.map(normalizeHackathon);
const newEvents = await deduplicateAgainstDB(normalized);
if (newEvents.length > 0) {
  await db.insert(events).values(newEvents).onConflictDoNothing();
}
console.log('Inserted:', newEvents.length);
process.exit(0);
"
```

### Paso 6: Actualizar websearch.ts (opcional)

Si el usuario pide crear/actualizar el archivo scraper, escribe `lib/scraper/sources/websearch.ts` con:
- La lista de queries como constante exportada `WEBSEARCH_QUERIES`
- Una función `scrapeWebsearch(): Promise<RawHackathon[]>` que, cuando la llame un agente Claude Code, use WebSearch para ejecutar las queries y retornar los resultados normalizados

### Paso 7: Reportar

Al final, imprime:

```
## websearch-scraper Results
- Queries ejecutadas: XX
- Resultados brutos de WebSearch: XX
- Descartados (Capa 1 - URL): XX
- Descartados (Capa 2 - snippet pasado/no-evento): XX
- Descartados (Capa 3 - no es hackathon): XX
- Después de dedup en memoria: XX
- Nuevos en DB (post pipeline): XX
- Fuentes principales: [lista de dominios más frecuentes]
```

## Anti-bias rules

- Nunca buscar por nombre específico de evento ("HackMIT", "ETHDenver")
- Sí buscar por empresa como organizador ("hackathon organizado por Microsoft", "Vercel hackathon 2026")
- Usar variables de año dinámicas, nunca hardcodear fechas futuras
- No agregar el prefijo "Hoy es [mes] [año]." a las queries — los buscadores ignoran ese texto

## Archivos relacionados

- `references/queries.md` — lista completa de queries
- `lib/scraper/sources/websearch.ts` — archivo TypeScript del scraper (si existe)
- `lib/scraper/types.ts` — RawHackathon interface
