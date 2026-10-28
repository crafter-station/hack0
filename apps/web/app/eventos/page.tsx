import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventFilters } from "@/components/event-filters";
import { EventList } from "@/components/event-list";
import { Shell } from "@/components/shell";
import { ARCHIVE_PAGE, hubIndex } from "@/lib/catalog";
import { filterHref, isFiltered, parseFilters, searchEvents } from "@/lib/search";

const TITLE = "Eventos tech en LATAM";
const INTRO = "Hackathones, conferencias, workshops y meetups de tecnología en Latinoamérica, con fechas, lugares y registro.";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  return {
    title: `${TITLE}: agenda y archivo | hack0`,
    description: INTRO,
    alternates: { canonical: "/eventos" },
    // Filter combinations are endless near-duplicates; the hubs (/ciudad, /tema) are the indexable versions.
    robots: isFiltered(filters) ? { index: false, follow: true } : undefined,
  };
}

export default async function Eventos({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [result, cities, tags] = await Promise.all([searchEvents(filters), hubIndex("ciudad"), hubIndex("tema")]);
  const pages = Math.ceil(result.total / ARCHIVE_PAGE);
  return (
    <Shell>
      <div className="hero-copy hub">
        <h1>{TITLE}</h1>
        <p>{INTRO}</p>
      </div>

      <EventFilters filters={filters} result={result} />

      <section className="results">
        {result.events.length > 0 ? (
          <EventList events={result.events} />
        ) : (
          <EmptyState
            art={filters.q ? "search" : "calendar"}
            title={filters.q ? `Nada con “${filters.q}”` : "Ningún evento con estos filtros"}
            action={
              <>
                <Link className="btn" href={filterHref({ cuando: filters.cuando, page: 0 }, {})}>
                  Quitar filtros
                </Link>
                {filters.cuando === "proximos" && (
                  <Link className="btn" href={filterHref(filters, { cuando: "pasados" })}>
                    Buscar en pasados
                  </Link>
                )}
              </>
            }
          >
            {filters.cuando === "proximos"
              ? "Puede que todavía no haya fechas nuevas así. Mira los realizados o amplía la búsqueda."
              : "Prueba con menos filtros."}
          </EmptyState>
        )}
        {pages > 1 && (
          <nav className="chips" aria-label="Páginas">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={filterHref(filters, { page: n - 1 })} aria-current={n === filters.page + 1 ? "page" : undefined}>
                {n}
              </Link>
            ))}
          </nav>
        )}
      </section>

      <section>
        <div className="label">
          <span>explorar por ciudad y tema</span>
        </div>
        {[
          [cities, "/ciudad"],
          [tags, "/tema"],
        ].map(([list, base]) => (
          <p className="chips" key={base as string}>
            {(list as typeof cities).map((l) => (
              <Link key={l.slug} href={`${base}/${l.slug}`}>
                {l.name} <span>{l.count}</span>
              </Link>
            ))}
          </p>
        ))}
      </section>
    </Shell>
  );
}
