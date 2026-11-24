import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgePage } from "@/components/badge-page";
import { findOrg } from "@/lib/ecosistema";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const o = await findOrg(slug);
  if (!o) return {};
  return {
    title: `Badge de ${o.name} para su web | hack0`,
    alternates: { canonical: `/org/${slug}/badge` },
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const o = await findOrg(slug);
  if (!o) notFound();
  return (
    <BadgePage
      name={o.name}
      path={`/org/${slug}`}
      badgePath={`/badge/org/${slug}.svg`}
      crumb={{ href: "/ecosistema", label: "ecosistema" }}
      lede="Elige, copia y pégalo en tu web. Lleva a tu perfil en el mapa."
    />
  );
}
