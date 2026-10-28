import { and, asc, count, desc, eq, ilike, type SQL, sql } from "drizzle-orm";
import { allEvents, type CalendarEvent, slugify } from "@/lib/calendar";
import { ARCHIVE_PAGE, hubIndex } from "@/lib/catalog";
import { rowToEvent } from "@/lib/catalog-db";
import { getDb } from "@/lib/db/client";
import { canonicalEvents } from "@/lib/db/schema";

export type Filters = {
  q?: string;
  pais?: string;
  ciudad?: string;
  tema?: string;
  formato?: "presencial" | "online";
  cuando: "proximos" | "pasados";
  page: number;
};

type Facet = { value: string; label: string; count: number };
export type SearchResult = { events: CalendarEvent[]; total: number; facets: { paises: Facet[]; ciudades: Facet[]; temas: Facet[] } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Reads the filter query string; anything unknown falls back to upcoming, unfiltered, first page. */
export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const formato = one(params.formato);
  const page = Number(one(params.pagina));
  return {
    q: one(params.q)?.slice(0, 80),
    pais: one(params.pais)?.toUpperCase().slice(0, 2),
    ciudad: one(params.ciudad),
    tema: one(params.tema),
    formato: formato === "presencial" || formato === "online" ? formato : undefined,
    cuando: one(params.cuando) === "pasados" ? "pasados" : "proximos",
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

/** True when anything narrows the default listing; such pages are noindex. */
export const isFiltered = (f: Filters) => Boolean(f.q || f.pais || f.ciudad || f.tema || f.formato || f.cuando === "pasados" || f.page > 0);

/** The query string for `f` with `patch` applied; page resets unless set. */
export function filterHref(f: Filters, patch: Partial<Filters>) {
  const next = { ...f, page: 0, ...patch };
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.pais) qs.set("pais", next.pais.toLowerCase());
  if (next.ciudad) qs.set("ciudad", next.ciudad);
  if (next.tema) qs.set("tema", next.tema);
  if (next.formato) qs.set("formato", next.formato);
  if (next.cuando === "pasados") qs.set("cuando", "pasados");
  if (next.page > 0) qs.set("pagina", String(next.page + 1));
  const s = qs.toString();
  return s ? `/eventos?${s}` : "/eventos";
}

const regionName = new Intl.DisplayNames(["es"], { type: "region" });
export const countryName = (code: string) => {
  try {
    return regionName.of(code.toUpperCase()) ?? code;
  } catch {
    // Not an ISO region code; show it as Luma sent it.
    return code;
  }
};

// ---------- Postgres ----------

type Facets = "pais" | "ciudad" | "tema";

async function names(kind: "ciudad" | "tema", slug: string | undefined) {
  if (!slug) return undefined;
  return (await hubIndex(kind)).find((h) => h.slug === slug)?.name ?? slug;
}

async function dbConditions(f: Filters, omit?: Facets): Promise<SQL> {
  const ends = sql`coalesce(${canonicalEvents.endAt}, ${canonicalEvents.startAt})`;
  const now = sql`${new Date().toISOString()}::timestamptz`;
  const where: (SQL | undefined)[] = [
    eq(canonicalEvents.listed, true),
    eq(canonicalEvents.active, true),
    f.cuando === "pasados" ? sql`${ends} < ${now}` : sql`${ends} >= ${now}`,
    f.q ? ilike(canonicalEvents.name, `%${f.q.replace(/[%_]/g, "")}%`) : undefined,
    f.formato ? eq(canonicalEvents.isOnline, f.formato === "online") : undefined,
    omit !== "pais" && f.pais ? eq(canonicalEvents.countryCode, f.pais) : undefined,
  ];
  const metro = omit !== "ciudad" ? await names("ciudad", f.ciudad) : undefined;
  if (metro) where.push(eq(canonicalEvents.metro, metro));
  const tag = omit !== "tema" ? await names("tema", f.tema) : undefined;
  if (tag) where.push(sql`${tag} = any(${canonicalEvents.tags})`);
  return and(...where.filter((c): c is SQL => c !== undefined)) as SQL;
}

async function dbSearch(f: Filters): Promise<SearchResult> {
  const where = await dbConditions(f);
  const order = f.cuando === "pasados" ? desc(canonicalEvents.startAt) : asc(canonicalEvents.startAt);
  const [rows, [total], paises, ciudades, temas] = await Promise.all([
    getDb()
      .select()
      .from(canonicalEvents)
      .where(where)
      .orderBy(order)
      .limit(ARCHIVE_PAGE)
      .offset(f.page * ARCHIVE_PAGE),
    getDb().select({ n: count() }).from(canonicalEvents).where(where),
    getDb()
      .select({ value: canonicalEvents.countryCode, count: count() })
      .from(canonicalEvents)
      .where(and(await dbConditions(f, "pais"), sql`${canonicalEvents.countryCode} is not null`))
      .groupBy(canonicalEvents.countryCode)
      .orderBy(desc(count())),
    getDb()
      .select({ value: canonicalEvents.metro, count: count() })
      .from(canonicalEvents)
      .where(and(await dbConditions(f, "ciudad"), sql`${canonicalEvents.metro} is not null`))
      .groupBy(canonicalEvents.metro)
      .orderBy(desc(count())),
    getDb()
      .select({ value: sql<string>`unnest(${canonicalEvents.tags})`, count: count() })
      .from(canonicalEvents)
      .where(await dbConditions(f, "tema"))
      .groupBy(sql`1`)
      .orderBy(desc(count())),
  ]);
  return {
    events: rows.map(rowToEvent),
    total: total?.n ?? 0,
    facets: {
      paises: paises.flatMap((r) => (r.value ? [{ value: r.value, label: countryName(r.value), count: r.count }] : [])),
      ciudades: ciudades.flatMap((r) => (r.value ? [{ value: slugify(r.value), label: r.value, count: r.count }] : [])),
      temas: temas.map((r) => ({ value: slugify(r.value), label: r.value, count: r.count })),
    },
  };
}

// ---------- Luma calendar fallback ----------

function matches(e: CalendarEvent, f: Filters, omit?: Facets, now = Date.now()) {
  const ended = new Date(e.endAt ?? e.startAt).getTime() < now;
  if ((f.cuando === "pasados") !== ended) return false;
  if (f.q && !e.name.toLowerCase().includes(f.q.toLowerCase())) return false;
  if (f.formato && e.online !== (f.formato === "online")) return false;
  if (omit !== "pais" && f.pais && e.country !== f.pais) return false;
  if (omit !== "ciudad" && f.ciudad && (!e.metro || slugify(e.metro) !== f.ciudad)) return false;
  if (omit !== "tema" && f.tema && !e.tags.some((t) => slugify(t) === f.tema)) return false;
  return true;
}

function tally(events: CalendarEvent[], key: (e: CalendarEvent) => string[], label: (v: string, e: CalendarEvent) => string): Facet[] {
  const counts = new Map<string, Facet>();
  for (const e of events) {
    for (const value of key(e)) counts.set(value, { value, label: label(value, e), count: (counts.get(value)?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

async function lumaSearch(f: Filters): Promise<SearchResult> {
  const all = (await allEvents()) ?? [];
  const hits = all.filter((e) => matches(e, f));
  if (f.cuando === "pasados") hits.reverse();
  return {
    events: hits.slice(f.page * ARCHIVE_PAGE, (f.page + 1) * ARCHIVE_PAGE),
    total: hits.length,
    facets: {
      paises: tally(
        all.filter((e) => matches(e, f, "pais")),
        (e) => (e.country ? [e.country.toUpperCase()] : []),
        (v) => countryName(v),
      ),
      ciudades: tally(
        all.filter((e) => matches(e, f, "ciudad")),
        (e) => (e.metro ? [slugify(e.metro)] : []),
        (_v, e) => e.metro ?? "",
      ),
      temas: tally(
        all.filter((e) => matches(e, f, "tema")),
        (e) => e.tags.map(slugify),
        (v, e) => e.tags.find((t) => slugify(t) === v) ?? v,
      ),
    },
  };
}

export function searchEvents(f: Filters): Promise<SearchResult> {
  return process.env.DATABASE_URL ? dbSearch(f) : lumaSearch(f);
}
