import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EcoMap } from "@/components/eco-map";
import { EventList } from "@/components/event-list";
import { JsonLd } from "@/components/json-ld";
import { OrgLogo } from "@/components/org-logo";
import { Shell } from "@/components/shell";
import { slugify } from "@/lib/calendar";
import { cityPlaces, countryPath, findOrg, listedOrgs, type Org, orgEvents, pins, typeInfo } from "@/lib/ecosistema";
import { countryName } from "@/lib/search";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

function summary(o: Org) {
  const where = [o.city, countryName(o.country)].filter(Boolean).join(", ");
  return o.description ?? `${o.name} es ${typeInfo(o.type).singular.toLowerCase()} del ecosistema tech de ${where}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const o = await findOrg(slug);
  if (!o) return {};
  return {
    title: `${o.name}: ${typeInfo(o.type).singular.toLowerCase()} en ${o.city ?? countryName(o.country)} | hack0`,
    description: summary(o),
    // A branch is one site of a chain; search should rank the brand's profile, which lists every site.
    alternates: { canonical: `/org/${o.parentSlug ?? slug}` },
  };
}

/** Where the org sits among its peers, from the directory's own counts. */
function context(o: Org, peers: Org[]) {
  const t = typeInfo(o.type);
  const sameType = peers.filter((p) => p.type === o.type);
  const sameCity = o.city ? sameType.filter((p) => p.city === o.city).length : 0;
  const where = countryName(o.country);
  const city = o.city && sameCity > 1 ? `; ${sameCity} están en ${o.city}` : "";
  // Startups, incubators and universities are feminine in Spanish; investors and coworkings are masculine.
  const fem = o.type === "startup" || o.type === "incubator" || o.type === "university";
  const one = fem ? "la única" : "el único";
  const many = fem ? `una de las ${sameType.length}` : `uno de los ${sameType.length}`;
  return `Es ${sameType.length === 1 ? one : many} ${(sameType.length === 1 ? t.singular : t.plural).toLowerCase()} de ${where} en el directorio de hack0${city}.`;
}

const dateEs = (d: Date) => new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);

export default async function OrgPage({ params }: Props) {
  const { slug } = await params;
  const o = await findOrg(slug);
  if (!o) notFound();
  const t = typeInfo(o.type);
  const country = countryPath(o.country);
  const [all, events] = await Promise.all([listedOrgs(), orgEvents(o.eventTerms)]);
  const sameCountry = all.filter((x) => x.country === o.country);
  const branches = sameCountry.filter((x) => x.parentSlug === o.slug);
  const parent = o.parentSlug ? sameCountry.find((x) => x.slug === o.parentSlug) : undefined;
  const related = sameCountry
    .filter((x) => x.slug !== o.slug && x.type === o.type && !x.parentSlug && x.slug !== o.parentSlug)
    .slice(0, 12);
  // Only cities with their own hub get a link; an HQ abroad is shown as text.
  const cityHub = o.city ? cityPlaces(sameCountry).find((c) => c.slug === slugify(o.city ?? "")) : undefined;
  const pin = pins([o]);
  return (
    <Shell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "ecosistema", item: `${SITE}/ecosistema` },
            { name: countryName(o.country), item: `${SITE}${country}` },
            { name: t.plural, item: `${SITE}${country}/${t.segment}` },
            { name: o.name, item: `${SITE}/org/${o.slug}` },
          ].map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": o.type === "university" ? "CollegeOrUniversity" : "Organization",
          name: o.name,
          url: o.websiteUrl ?? `${SITE}/org/${o.slug}`,
          ...(o.logoUrl ? { logo: `${SITE}${o.logoUrl}` } : {}),
          description: summary(o),
          address: { "@type": "PostalAddress", addressCountry: o.country, ...(o.city ? { addressLocality: o.city } : {}) },
        }}
      />
      <div className="hero-copy hub org-hero">
        <p className="crumbs">
          <Link href="/ecosistema">ecosistema</Link> / <Link href={country}>{countryName(o.country).toLowerCase()}</Link> /{" "}
          <Link href={`${country}/${t.segment}`}>{t.segment}</Link>
        </p>
        <div className="org-head">
          <OrgLogo org={o} size={72} alt={`Logo de ${o.name}`} />
          <h1>{o.name}</h1>
        </div>
        <p>{summary(o)}</p>
        <p className="org-context">
          {parent ? (
            <>
              Sede de <Link href={`/org/${parent.slug}`}>{parent.name}</Link>.{" "}
            </>
          ) : null}
          {context(
            o,
            sameCountry.filter((x) => !x.parentSlug),
          )}
        </p>
        <p className="org-meta">
          {t.singular}
          {o.city && (
            <>
              {" · "}
              {cityHub ? <Link href={`${country}/${cityHub.slug}`}>{o.city}</Link> : o.city}
            </>
          )}
        </p>
        <div className="actions">
          {o.websiteUrl && (
            <a className="btn primary" href={o.websiteUrl} rel="noopener">
              Visitar web <span aria-hidden="true">↗</span>
            </a>
          )}
          {o.hiringUrl && (
            <a className="btn" href={o.hiringUrl} rel="noopener">
              Ver empleos <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
      {pin.length > 0 && (
        <div className="org-profile-map">
          <EcoMap pins={pin} places={[]} placeBase={country} view={[pin[0].lng, pin[0].lat, 14]} selected={pin[0].slug} />
        </div>
      )}
      {branches.length > 0 && (
        <section>
          <h2 className="label org-section">
            <span>sedes</span>
            <span>{branches.length}</span>
          </h2>
          <p className="chips">
            {branches.map((b) => (
              <Link key={b.slug} href={`/org/${b.slug}`}>
                {b.name.replace(`${o.name} `, "")}
              </Link>
            ))}
          </p>
        </section>
      )}
      {events.length > 0 && (
        <section>
          <h2 className="label org-section">
            <span>en eventos de hack0</span>
            <span>{events.length}</span>
          </h2>
          <EventList events={events} />
        </section>
      )}
      {related.length > 0 && (
        <section>
          <h2 className="label org-section">
            <span>
              más {t.segment} en {countryName(o.country)}
            </span>
          </h2>
          <p className="chips">
            {related.map((r) => (
              <Link key={r.slug} href={`/org/${r.slug}`}>
                {r.name}
              </Link>
            ))}
          </p>
        </section>
      )}
      <p className="org-source">
        Fuente:{" "}
        <a className="org-source-link" href={o.sourceUrl}>
          {new URL(o.sourceUrl).hostname.replace(/^www\./, "")}
        </a>
        {o.verifiedAt ? ` · verificado el ${dateEs(o.verifiedAt)}` : " · sin verificar"}
      </p>
    </Shell>
  );
}
