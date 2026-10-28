import { EmptyState } from "@/components/empty-state";
import { EventList } from "@/components/event-list";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import type { CalendarEvent } from "@/lib/calendar";
import { ARCHIVE_PAGE, type HubLink } from "@/lib/catalog";
import { LUMA, SITE } from "@/lib/site";

/** Hubs page as /ciudad/lima/2 so ISR can cache each page; the whole-catalog archive keeps ?pagina=2. */
function pageHref(path: string, n: number) {
  return path === "/eventos" ? `${path}?pagina=${n}` : `${path}/${n}`;
}

type Props = {
  title: string;
  intro: string;
  path: string;
  upcoming: CalendarEvent[];
  past: CalendarEvent[];
  pastTotal: number;
  page: number;
  links: HubLink[];
  linkPath: string;
  tagLinks?: HubLink[];
};

export function HubPage({ title, intro, path, upcoming, past, pastTotal, page, links, linkPath, tagLinks = [] }: Props) {
  const pages = Math.ceil(pastTotal / ARCHIVE_PAGE);
  return (
    <Shell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: [...upcoming, ...past].map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE}/eventos/${e.slug}`,
          })),
        }}
      />
      <div className="hero-copy hub">
        <p className="crumbs">
          <a href="/eventos">eventos</a>
        </p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <section>
        <div className="label">
          <span>próximos</span>
          <span>{upcoming.length}</span>
        </div>
        {upcoming.length > 0 ? (
          <EventList events={upcoming} />
        ) : (
          <EmptyState
            art="calendar"
            title="No hay fechas nuevas todavía"
            action={
              <a className="btn primary" href={LUMA}>
                Suscribirme al calendario
              </a>
            }
          >
            Abajo están los que ya pasaron. Suscríbete y te avisamos cuando salga el próximo.
          </EmptyState>
        )}
      </section>
      {past.length > 0 && (
        <section>
          <div className="label">
            <span>realizados</span>
            <span>{pastTotal}</span>
          </div>
          <EventList events={past} />
          {pages > 1 && (
            <p className="chips">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <a key={n} href={n === 1 ? path : pageHref(path, n)} aria-current={n === page + 1 ? "page" : undefined}>
                  {n}
                </a>
              ))}
            </p>
          )}
        </section>
      )}
      {(links.length > 0 || tagLinks.length > 0) && (
        <section>
          <div className="label">
            <span>explorar</span>
          </div>
          {[
            [links, linkPath],
            [tagLinks, "/tema"],
          ].map(([list, base]) =>
            (list as HubLink[]).length > 0 ? (
              <p className="chips" key={base as string}>
                {(list as HubLink[]).map((l) => (
                  <a key={l.slug} href={`${base}/${l.slug}`}>
                    {l.name} <span>{l.count}</span>
                  </a>
                ))}
              </p>
            ) : null,
          )}
        </section>
      )}
    </Shell>
  );
}
