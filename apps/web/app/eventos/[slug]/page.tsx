import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { EventList } from "@/components/event-list";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { Shell } from "@/components/shell";
import { cityKey, eventDescription, placeLabel, slugify } from "@/lib/calendar";
import { catalog, eventJsonLd, formatDate, SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { events } = await catalog();
  return events.map((e) => ({ slug: e.slug }));
}

async function find(slug: string) {
  const { events } = await catalog();
  const event = events.find((e) => e.slug === slug);
  // Names can change on Luma; the trailing short code stays the same.
  const moved = event ? null : events.find((e) => slug.endsWith(`-${e.slug.split("-").pop()}`));
  return { event, moved, events };
}

function summary(name: string, when: string, where: string) {
  return `${name}: ${when}${where ? ` en ${where}` : ""}. Agenda, lugar y registro del evento tech en hack0, el calendario del ecosistema tech de LATAM.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { event: e } = await find(slug);
  if (!e) return {};
  const where = placeLabel(e);
  const description = summary(e.name, formatDate(e).day, where);
  return {
    title: `${e.name}${e.metro ? ` · ${e.metro}` : ""} | hack0`,
    description,
    alternates: { canonical: `/eventos/${e.slug}` },
    openGraph: {
      title: e.name,
      description,
      url: `${SITE}/eventos/${e.slug}`,
      type: "website",
      images: e.coverUrl ? [e.coverUrl] : undefined,
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event: e, moved, events } = await find(slug);
  if (moved) permanentRedirect(`/eventos/${moved.slug}`);
  if (!e) notFound();
  const description = await eventDescription(e.id);
  const { day, time } = formatDate(e);
  const past = new Date(e.endAt ?? e.startAt).getTime() < Date.now();
  const city = cityKey(e);
  const related = events
    .filter((o) => o.id !== e.id && ((city && cityKey(o) === city) || o.tags.some((t) => e.tags.includes(t))))
    .slice(-6)
    .reverse();
  return (
    <Shell>
      <JsonLd data={eventJsonLd(e, description)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Eventos", item: `${SITE}/eventos` },
            { "@type": "ListItem", position: 2, name: e.name, item: `${SITE}/eventos/${e.slug}` },
          ],
        }}
      />
      <article className="event">
        <p className="crumbs">
          <a href="/eventos">eventos</a>
          {city && e.metro && (
            <>
              {" / "}
              <a href={`/ciudad/${city}`}>{e.metro}</a>
            </>
          )}
        </p>
        <h1>{e.name}</h1>
        <dl className="facts">
          <div>
            <dt>fecha</dt>
            <dd>
              {day} · {time}
            </dd>
          </div>
          <div>
            <dt>lugar</dt>
            <dd>{e.address ?? e.city ?? (e.online ? "Online" : "Por confirmar")}</dd>
          </div>
          {e.tags.length > 0 && (
            <div>
              <dt>temas</dt>
              <dd>
                {e.tags.map((t, i) => (
                  <span key={t}>
                    {i > 0 && " · "}
                    <a href={`/tema/${slugify(t)}`}>{t}</a>
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
        <div className="actions">
          <a className="btn primary" href={e.url}>
            {past ? "Ver en Luma" : "Registrarme en Luma"}
          </a>
        </div>
        {e.coverUrl && (
          <Image
            className="cover"
            src={e.coverUrl}
            alt={`Portada de ${e.name}`}
            width={960}
            height={480}
            sizes="(max-width: 960px) 100vw, 960px"
          />
        )}
        {description && <Markdown source={description} />}
      </article>
      {related.length > 0 && (
        <section>
          <div className="label">
            <span>eventos relacionados</span>
          </div>
          <EventList events={related} />
        </section>
      )}
    </Shell>
  );
}
