import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/hub-page";
import { catalog } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { cities } = await catalog();
  return cities.map((h) => ({ city: h.slug }));
}

async function find(slug: string) {
  const { cities } = await catalog();
  return { hub: cities.find((h) => h.slug === slug), all: cities };
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const { hub } = await find(city);
  if (!hub) return {};
  return {
    title: `${`Eventos tech en ${hub.name}`} | hack0`,
    description: `Hackathones, meetups, workshops y conferencias de tecnología en ${hub.name}. ${hub.events.length} eventos en el calendario de hack0, con fechas, lugares y registro.`,
    alternates: { canonical: `/ciudad/${hub.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const { hub, all } = await find(city);
  if (!hub) notFound();
  return (
    <HubPage
      title={`Eventos tech en ${hub.name}`}
      intro={`Hackathones, meetups, workshops y conferencias de tecnología en ${hub.name}. ${hub.events.length} eventos en el calendario de hack0, con fechas, lugares y registro.`}
      path="/ciudad"
      hub={hub}
      links={all.filter((h) => h.slug !== hub.slug).slice(0, 24)}
    />
  );
}
