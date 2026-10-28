import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/hub-page";
import { hubEvents, hubIndex } from "@/lib/catalog";
import { pastPage } from "@/lib/hub-params";

export const revalidate = 3600;

/** Rendered on first request and cached; the catalog is too large to prebuild every hub. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ tag: string }>; searchParams: Promise<{ pagina?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const hub = await hubEvents("tema", tag);
  if (!hub?.name) return {};
  return {
    title: `Eventos de ${hub.name} en LATAM | hack0`,
    description: `Meetups, hackathones y workshops sobre ${hub.name} en Latinoamérica, con fechas, lugares y registro.`,
    alternates: { canonical: `/tema/${tag}` },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { tag } = await params;
  const page = pastPage(await searchParams);
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
