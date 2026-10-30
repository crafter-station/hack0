import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { CSSProperties } from "react";
import { EventBar } from "@/components/event-bar";
import { EventList } from "@/components/event-list";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { ShareButton } from "@/components/share-button";
import { Shell } from "@/components/shell";
import { cityKey, placeLabel, slugify } from "@/lib/calendar";
import { eventCommunities, findEvent, indexable, relatedEvents } from "@/lib/catalog";
import { bodyOf, eventWhen, googleCalendarUrl, providerName } from "@/lib/event-view";
import { optimizable } from "@/lib/images";
import { eventJsonLd, formatDate, SITE } from "@/lib/site";
import { eventTint } from "@/lib/tint";

export const revalidate = 3600;

/** Rendered on first request and cached; the catalog is too large to prebuild every event. */
export function generateStaticParams() {
  return [];
}

function summary(name: string, when: string, where: string) {
  return `${name}: ${when}${where ? ` en ${where}` : ""}. Agenda, lugar y registro del evento tech en hack0, el calendario del ecosistema tech de LATAM.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await findEvent(slug);
  if (!page) return {};
  const e = page.event;
  const where = placeLabel(e);
  const description = summary(e.name, formatDate(e).day, where);
  return {
    title: `${e.name}${e.metro ? ` · ${e.metro}` : ""} | hack0`,
    description,
    alternates: { canonical: `/eventos/${e.slug}` },
    robots: indexable(page) ? undefined : { index: false, follow: true },
    openGraph: {
      title: e.name,
      description,
      url: `${SITE}/eventos/${e.slug}`,
      type: "website",
      images: e.coverUrl ? [e.coverUrl] : undefined,
    },
  };
}

function PinIcon({ online }: { online: boolean }) {
  return online ? (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="5" width="18" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { page, movedTo } = await findEvent(slug);
  if (movedTo) permanentRedirect(`/eventos/${movedTo}`);
  if (!page) notFound();
  const { event: e, description } = page;
  const when = eventWhen(e);
  const past = new Date(e.endAt ?? e.startAt).getTime() < Date.now();
  const city = cityKey(e);
  const provider = providerName(e.url);
  const [related, tint, communities] = await Promise.all([relatedEvents(e), eventTint(e.url, e.coverUrl), eventCommunities(e.slug)]);
  const body = bodyOf(e.name, description);
  const place = e.online ? "Online" : (e.address ?? e.city ?? "Lugar por confirmar");
  const cta = past ? `Ver en ${provider}` : `Registrarme en ${provider}`;
  const style = tint ? ({ "--tint": tint } as CSSProperties) : undefined;
  return (
    <Shell>
      <JsonLd data={eventJsonLd(e, description, communities)} />
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
      <article className="event" style={style}>
        <p className="crumbs">
          <Link href="/eventos">eventos</Link>
          {city && e.metro && (
            <>
              {" / "}
              <Link href={`/ciudad/${city}`}>{e.metro}</Link>
            </>
          )}
        </p>
        {past && <p className="badge">Ya pasó</p>}
        <h1>{e.name}</h1>
        <div className="event-grid">
          <div className="event-media">
            {e.coverUrl ? (
              <Image
                className="cover"
                src={e.coverUrl}
                alt={`Portada de ${e.name}`}
                width={960}
                height={480}
                sizes="(max-width: 760px) 100vw, 440px"
                priority
                unoptimized={!optimizable(e.coverUrl)}
              />
            ) : (
              <div className="cover cover-empty" aria-hidden="true">
                <span>{when.dayNumber}</span>
                <span>{when.month}</span>
              </div>
            )}
            {body && (
              <section className="about">
                <div className="label">
                  <span>sobre el evento</span>
                </div>
                <Markdown source={body} />
              </section>
            )}
          </div>
          <aside className="event-head">
            <ul className="when-where">
              <li>
                <span className="ww-tile cal" aria-hidden="true">
                  <b>{when.month}</b>
                  <span>{when.dayNumber}</span>
                </span>
                <span>
                  <strong>{when.longDate}</strong>
                  <span>
                    {when.range} · {when.zone}
                  </span>
                </span>
              </li>
              <li>
                <span className="ww-tile" aria-hidden="true">
                  <PinIcon online={e.online} />
                </span>
                <span>
                  <strong>{place}</strong>
                  {e.online ? (
                    <span>El link llega al registrarte en {provider}</span>
                  ) : (
                    e.metro && !place.includes(e.metro) && <span>{e.metro}</span>
                  )}
                </span>
              </li>
            </ul>
            <div className="register">
              <a className="btn tint" href={e.url} rel="noopener">
                {cta} <span aria-hidden="true">↗</span>
              </a>
              {!past && (
                <p className="add">
                  <a href={googleCalendarUrl(e)} rel="noopener">
                    Google Calendar
                  </a>
                  <a href={`/eventos/${e.slug}/ics`} download>
                    Apple / Outlook
                  </a>
                  <ShareButton title={e.name} url={`${SITE}/eventos/${e.slug}`} />
                </p>
              )}
            </div>
            {communities.length > 0 && (
              <p className="hosts">
                <span>Organiza</span>
                {communities.map((c) => (
                  <Link key={c.slug} href={`/comunidades/${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </p>
            )}
            {e.tags.length > 0 && (
              <p className="topics">
                {e.tags.map((t) => (
                  <Link key={t} href={`/tema/${slugify(t)}`}>
                    {t}
                  </Link>
                ))}
              </p>
            )}
          </aside>
        </div>
        {!past && (
          <EventBar watch=".register">
            <span>
              <b>
                {when.weekday} {when.dayNumber} {when.month}
              </b>{" "}
              {when.range}
            </span>
            <a className="btn tint" href={e.url} rel="noopener">
              Registrarme
            </a>
          </EventBar>
        )}
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
