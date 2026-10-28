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

type Props = { params: Promise<{ city: string; pagina?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, pagina } = await params;
  // Each page of a paginated hub is its own canonical, as Google asks for paginated series.
  const path = pagina?.[0] ? `/ciudad/${city}/${pagina[0]}` : `/ciudad/${city}`;
  const hub = await hubEvents("ciudad", city);
  if (!hub?.name) return {};
  return {
    title: `Eventos tech en ${hub.name} | hack0`,
    description: `Hackathones, meetups, workshops y conferencias de tecnología en ${hub.name}, con fechas, lugares y registro.`,
    alternates: { canonical: path },
  };
}

export default async function Page({ params }: Props) {
  const { city, pagina } = await params;
  const page = pastPage({ pagina: pagina?.[0] });
  const [hub, links] = await Promise.all([hubEvents("ciudad", city, page), hubIndex("ciudad")]);
  if (!hub?.name) notFound();
  return (
    <HubPage
      title={`Eventos tech en ${hub.name}`}
      intro={`Hackathones, meetups, workshops y conferencias de tecnología en ${hub.name}, con fechas, lugares y registro.`}
      path={`/ciudad/${city}`}
      upcoming={hub.upcoming}
      past={hub.past}
      pastTotal={hub.pastTotal}
      page={page}
      links={links.filter((h) => h.slug !== city).slice(0, 24)}
      linkPath="/ciudad"
    />
  );
}
