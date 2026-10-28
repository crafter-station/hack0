import type { Metadata } from "next";
import { HubPage } from "@/components/hub-page";
import { hubEvents, hubIndex } from "@/lib/catalog";
import { pastPage } from "@/lib/hub-params";

export const revalidate = 3600;

const TITLE = "Eventos tech en LATAM";
const INTRO = "Hackathones, conferencias, workshops y meetups de tecnología en Latinoamérica, con fechas, lugares y registro.";

type Props = { searchParams: Promise<{ pagina?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pastPage(await searchParams);
  // Each archive page is its own canonical, as Google asks for paginated series.
  return {
    title: `${TITLE}: agenda y archivo | hack0`,
    description: INTRO,
    alternates: { canonical: page > 0 ? `/eventos?pagina=${page + 1}` : "/eventos" },
  };
}

export default async function Eventos({ searchParams }: Props) {
  const page = pastPage(await searchParams);
  const [hub, cities, tags] = await Promise.all([hubEvents(null, null, page), hubIndex("ciudad"), hubIndex("tema")]);
  return (
    <HubPage
      title={TITLE}
      intro={INTRO}
      path="/eventos"
      upcoming={hub?.upcoming ?? []}
      past={hub?.past ?? []}
      pastTotal={hub?.pastTotal ?? 0}
      page={page}
      links={cities}
      linkPath="/ciudad"
      tagLinks={tags}
    />
  );
}
