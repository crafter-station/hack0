import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgePage } from "@/components/badge-page";
import { communityIndex } from "@/lib/catalog";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const find = async (slug: string) => (await communityIndex()).find((c) => c.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await find(slug);
  if (!c) return {};
  return {
    title: `Badge de ${c.name} para su web | hack0`,
    alternates: { canonical: `/comunidades/${slug}/badge` },
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const c = await find(slug);
  if (!c) notFound();
  return (
    <BadgePage
      name={c.name}
      path={`/comunidades/${slug}`}
      badgePath={`/badge/comunidades/${slug}.svg`}
      hasNext={c.upcoming > 0}
      crumb={{ href: "/comunidades", label: "comunidades" }}
      lede="Elige, copia y pégalo en tu web. Se actualiza solo."
    />
  );
}
