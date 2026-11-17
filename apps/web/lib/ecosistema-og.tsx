import { renderOg } from "@/app/taste-hacking/_og/render";
import { HubCard, OrgCard } from "@/components/eco-og";
import { slugify } from "@/lib/calendar";
import { countryFromSlug, findOrg, listedOrgs, logoDataUris, type Org, typeBySegment, typeInfo } from "@/lib/ecosistema";
import { countryName } from "@/lib/search";

/** Logos worth showing first: orgs that have one, in the order the directory lists them. */
const faces = (orgs: Org[]) =>
  logoDataUris(
    orgs
      .filter((o) => o.logoUrl)
      .slice(0, 7)
      .map((o) => o.slug),
  );

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Share image for /ecosistema, /ecosistema/[pais] and /ecosistema/[pais]/[segmento]. */
export async function hubImage(pais?: string, segmento?: string) {
  const all = await listedOrgs();
  const code = pais ? countryFromSlug(pais) : null;
  if (!code) {
    return renderOg(
      <HubCard
        title="Ecosistema tech de LATAM"
        count={plural(all.length, "organización", "organizaciones")}
        crumb="/ecosistema"
        logos={await faces(all)}
      />,
    );
  }
  const country = all.filter((o) => o.country === code);
  const name = countryName(code);
  const type = segmento ? typeBySegment(segmento) : undefined;
  let orgs = country;
  let title = `Ecosistema tech de ${name}`;
  let noun: [string, string] = ["organización", "organizaciones"];
  if (type) {
    orgs = country.filter((o) => o.type === type.type);
    title = `${type.plural} en ${name}`;
    noun = [type.singular.toLowerCase(), type.plural.toLowerCase()];
  } else if (segmento) {
    orgs = country.filter((o) => o.city && slugify(o.city) === segmento);
    title = `Ecosistema tech de ${orgs[0]?.city ?? name}`;
  }
  const path = ["/ecosistema", pais, segmento].filter(Boolean).join("/");
  return renderOg(<HubCard title={title} count={plural(orgs.length, ...noun)} crumb={path} logos={await faces(orgs)} />);
}

/** Share image for /org/[slug]. */
export async function orgImage(slug: string) {
  const o = await findOrg(slug);
  if (!o) return new Response(null, { status: 404 });
  const [logo] = await logoDataUris([o.slug]);
  const kind = [typeInfo(o.type).singular, o.city ?? countryName(o.country)].join(" · ");
  return renderOg(<OrgCard name={o.name} kind={kind} crumb={`/org/${o.slug}`} logo={logo ?? null} />);
}
