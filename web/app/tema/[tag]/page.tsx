import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/hub-page";
import { catalog } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { tags } = await catalog();
  return tags.map((h) => ({ tag: h.slug }));
}

async function find(slug: string) {
  const { tags } = await catalog();
  return { hub: tags.find((h) => h.slug === slug), all: tags };
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const { hub } = await find(tag);
  if (!hub) return {};
  return {
    title: `${`Eventos de ${hub.name} en LATAM`} | hack0`,
    description: `Meetups, hackathones y workshops sobre ${hub.name} en Latinoamérica. ${hub.events.length} eventos en el calendario de hack0, con fechas, lugares y registro.`,
    alternates: { canonical: `/tema/${hub.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const { hub, all } = await find(tag);
  if (!hub) notFound();
  return (
    <HubPage
      title={`Eventos de ${hub.name} en LATAM`}
      intro={`Meetups, hackathones y workshops sobre ${hub.name} en Latinoamérica. ${hub.events.length} eventos en el calendario de hack0, con fechas, lugares y registro.`}
      path="/tema"
      hub={hub}
      links={all.filter((h) => h.slug !== hub.slug).slice(0, 24)}
    />
  );
}
