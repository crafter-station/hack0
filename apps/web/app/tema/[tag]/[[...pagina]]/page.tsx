import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/hub-page";
import { hubEvents, hubIndex } from "@/lib/catalog";
import { pastPage } from "@/lib/hub-params";

export const revalidate = 3600;

/** Rendered on first request and cached; the catalog is too large to prebuild every hub. Past pages live at /<hub>/2, not in a query string, so ISR can cache them. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ tag: string; pagina?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag, pagina } = await params;
  // Each page of a paginated hub is its own canonical, as Google asks for paginated series.
  const path = pagina?.[0] ? `/tema/${tag}/${pagina[0]}` : `/tema/${tag}`;
  const hub = await hubEvents("tema", tag);
  if (!hub?.name) return {};
  return {
    title: `Eventos de ${hub.name} en LATAM | hack0`,
    description: `Meetups, hackathones y workshops sobre ${hub.name} en Latinoamérica, con fechas, lugares y registro.`,
    alternates: { canonical: path },
  };
}

export default async function Page({ params }: Props) {
  const { tag, pagina } = await params;
  const page = pastPage({ pagina: pagina?.[0] });
  const [hub, links] = await Promise.all([hubEvents("tema", tag, page), hubIndex("tema")]);
  if (!hub?.name) notFound();
  return (
    <HubPage
      title={`Eventos de ${hub.name} en LATAM`}
      intro={`Meetups, hackathones y workshops sobre ${hub.name} en Latinoamérica, con fechas, lugares y registro.`}
      path={`/tema/${tag}`}
      upcoming={hub.upcoming}
      past={hub.past}
      pastTotal={hub.pastTotal}
      page={page}
      links={links.filter((h) => h.slug !== tag).slice(0, 24)}
      linkPath="/tema"
    />
  );
}
