import type { Metadata } from "next";
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
          <p className="empty">
            Nada con estos filtros. <a href={filterHref({ cuando: filters.cuando, page: 0 }, {})}>Ver todos</a>
          </p>
        )}
        {pages > 1 && (
          <nav className="chips" aria-label="Páginas">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <a key={n} href={filterHref(filters, { page: n - 1 })} aria-current={n === filters.page + 1 ? "page" : undefined}>
                {n}
              </a>
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
              <a key={l.slug} href={`${base}/${l.slug}`}>
                {l.name} <span>{l.count}</span>
              </a>
            ))}
          </p>
        ))}
      </section>
    </Shell>
  );
}
