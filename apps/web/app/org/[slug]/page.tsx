import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EcoMap } from "@/components/eco-map";
import { JsonLd } from "@/components/json-ld";
import { OrgLogo } from "@/components/org-logo";
import { Shell } from "@/components/shell";
import { slugify } from "@/lib/calendar";
import { cityPlaces, countryPath, findOrg, listedOrgs, type Org, pins, typeInfo } from "@/lib/ecosistema";
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
    alternates: { canonical: `/org/${slug}` },
  };
}

const dateEs = (d: Date) => new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);

export default async function OrgPage({ params }: Props) {
  const { slug } = await params;
  const o = await findOrg(slug);
  if (!o) notFound();
  const t = typeInfo(o.type);
  const country = countryPath(o.country);
  const sameCountry = (await listedOrgs()).filter((x) => x.country === o.country);
  const related = sameCountry.filter((x) => x.slug !== o.slug && x.type === o.type).slice(0, 12);
  // Only cities with their own hub get a link; an HQ abroad is shown as text.
  const cityHub = o.city ? cityPlaces(sameCountry).find((c) => c.slug === slugify(o.city ?? "")) : undefined;
  const pin = pins([o]);
  return (
    <Shell>
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
          <OrgLogo org={o} size={72} />
          <h1>{o.name}</h1>
        </div>
        <p>{summary(o)}</p>
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
      {related.length > 0 && (
        <section>
          <div className="label">
            <span>
              más {t.segment} en {countryName(o.country)}
            </span>
          </div>
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
