import { EventList } from "@/components/event-list";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import type { Hub } from "@/lib/site";
import { SITE, splitByTime } from "@/lib/site";

export function HubPage({ title, intro, path, hub, links, tagLinks = [] }: { title: string; intro: string; path: string; hub: Hub; links: Hub[]; tagLinks?: Hub[] }) {
  const { upcoming, past } = splitByTime(hub.events);
  return (
    <Shell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: hub.events.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/eventos/${e.slug}` })),
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
        {upcoming.length > 0 ? <EventList events={upcoming} /> : <p className="empty">No hay fechas nuevas todavía. Suscríbete al calendario para enterarte primero.</p>}
      </section>
      {past.length > 0 && (
        <section>
          <div className="label">
            <span>realizados</span>
            <span>{past.length}</span>
          </div>
          <EventList events={past} />
        </section>
      )}
      {links.length > 0 && (
        <section>
          <div className="label">
            <span>explorar</span>
          </div>
          <p className="chips">
            {links.map((l) => (
              <a key={l.slug} href={`${path}/${l.slug}`}>
                {l.name} <span>{l.events.length}</span>
              </a>
            ))}
          </p>
          {tagLinks.length > 0 && (
            <p className="chips">
              {tagLinks.map((l) => (
                <a key={l.slug} href={`/tema/${l.slug}`}>
                  {l.name} <span>{l.events.length}</span>
                </a>
              ))}
            </p>
          )}
        </section>
      )}
    </Shell>
  );
}
