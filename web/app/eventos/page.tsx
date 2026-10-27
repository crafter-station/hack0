import type { Metadata } from "next";
import { HubPage } from "@/components/hub-page";
import { catalog } from "@/lib/site";

export const revalidate = 3600;

const TITLE = "Eventos tech en LATAM";
const INTRO = "Hackathones, conferencias, workshops y meetups de tecnología en Latinoamérica, con fechas, lugares y registro.";

export const metadata: Metadata = {
  title: `${TITLE}: agenda y archivo | hack0`,
  description: INTRO,
  alternates: { canonical: "/eventos" },
};

export default async function Eventos() {
  const { events, cities, tags } = await catalog();
  return <HubPage title={TITLE} intro={INTRO} path="/ciudad" hub={{ slug: "", name: TITLE, events }} links={cities} tagLinks={tags} />;
}
