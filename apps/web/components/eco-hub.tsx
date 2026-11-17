import { EcoExplorer } from "@/components/eco-explorer";
import type { MapPlace } from "@/components/eco-map";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import { ORG_TYPES, type Org, typeInfo } from "@/lib/ecosistema";
import { SITE } from "@/lib/site";

type Props = {
  title: string;
  path: string;
  intro: string;
  crumbs: { href: string; label: string }[];
  orgs: Org[];
  places: MapPlace[];
  placeBase: string;
  view: [number, number, number];
  chips: { href: string; label: string; count: number }[];
  /** Links to related hubs, listed after the orgs so they don't compete with the filters. */
  more?: { href: string; label: string; count: number }[];
};

const GLYPH: Record<string, string> = { startup: "S", investor: "$", incubator: "I", university: "U", coworking: "C" };

/** Every /ecosistema hub: the full-screen explorer over server-rendered data, plus its ItemList. */
export function EcoHub({ title, path, intro, crumbs, orgs, places, placeBase, view, chips, more = [] }: Props) {
  const types = ORG_TYPES.filter((t) => orgs.some((o) => o.type === t.type)).map((t) => ({
    type: t.type,
    plural: t.plural,
    glyph: GLYPH[t.type],
  }));
  return (
    <Shell immersive>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [...crumbs.filter((c) => c.href !== "/"), { href: path, label: title }].map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: `${SITE}${c.href}`,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          numberOfItems: orgs.length,
          itemListElement: orgs.map((o, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/org/${o.slug}`, name: o.name })),
        }}
      />
      <EcoExplorer
        title={title}
        intro={intro}
        crumbs={crumbs}
        types={types}
        places={places}
        placeBase={placeBase}
        view={view}
        listTitle={title}
        links={chips}
        more={more}
        orgs={orgs.map((o) => ({
          slug: o.slug,
          name: o.name,
          type: o.type,
          typeLabel: typeInfo(o.type).singular,
          city: o.city,
          description: o.description,
          websiteUrl: o.websiteUrl,
          logoUrl: o.logoUrl,
          logoTone: o.logoTone,
          logoAspect: o.logoAspect,
          hiringUrl: o.hiringUrl,
          lat: o.lat,
          lng: o.lng,
        }))}
      />
    </Shell>
  );
}
