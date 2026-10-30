import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/hub-page";
import { communityEvents, communityIndex } from "@/lib/catalog";
import { providerName } from "@/lib/event-view";
import { pastPage } from "@/lib/hub-params";

export const revalidate = 3600;

/** Rendered on first request and cached, like the city and topic hubs. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; pagina?: string[] }> };

function where(metros: string[]) {
  if (metros.length === 0) return "";
  const shown = metros.slice(0, 3);
  return ` en ${shown.join(", ")}${metros.length > shown.length ? " y más" : ""}`;
}

function intro(name: string, count: number, metros: string[]) {
  return `${name} organiza eventos tech${where(metros)}. ${count} ${count === 1 ? "evento" : "eventos"} en hack0, con fechas, lugares y registro.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pagina } = await params;
  const c = (await communityIndex()).find((x) => x.slug === slug);
  if (!c) return {};
  const path = pagina?.[0] ? `/comunidades/${slug}/${pagina[0]}` : `/comunidades/${slug}`;
  return {
    title: `${c.name}: eventos y comunidad | hack0`,
    description: intro(c.name, c.count, c.metros),
    alternates: { canonical: path },
  };
}

export default async function Page({ params }: Props) {
  const { slug, pagina } = await params;
  const page = pastPage({ pagina: pagina?.[0] });
  const [hub, all] = await Promise.all([communityEvents(slug, page), communityIndex()]);
  if (!hub) notFound();
  const { community: c } = hub;
  // Neighbours share a city, so the explore links stay local.
  const near = all.filter((o) => o.slug !== slug && o.metros.some((m) => c.metros.includes(m)));
  return (
    <HubPage
      title={c.name}
      intro={intro(c.name, c.count, c.metros)}
      path={`/comunidades/${slug}`}
      crumb={{ href: "/comunidades", label: "comunidades" }}
      action={
        <a className="btn" href={c.url} rel="noopener">
          Ver en {providerName(c.url)} <span aria-hidden="true">↗</span>
        </a>
      }
      upcoming={hub.upcoming}
      past={hub.past}
      pastTotal={hub.pastTotal}
      page={page}
      links={(near.length > 0 ? near : all.filter((o) => o.slug !== slug)).slice(0, 24)}
      linkPath="/comunidades"
    />
  );
}
