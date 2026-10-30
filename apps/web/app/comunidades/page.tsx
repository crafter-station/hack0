import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import { type Community, communityIndex } from "@/lib/catalog";
import { LUMA, SITE } from "@/lib/site";

export const revalidate = 3600;

const INTRO = "Las comunidades que organizan los hackathones, meetups y workshops del ecosistema tech de LATAM, agrupadas por ciudad.";

export const metadata: Metadata = {
  title: "Comunidades tech de LATAM | hack0",
  description: INTRO,
  alternates: { canonical: "/comunidades" },
};

/** Each community under its most frequent city; online-only ones last. */
function byCity(list: Community[]) {
  const groups = new Map<string, Community[]>();
  for (const c of list) {
    const key = c.metros[0] ?? "online";
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.entries()].sort((a, b) => Number(a[0] === "online") - Number(b[0] === "online") || b[1].length - a[1].length);
}

export default async function Communities() {
  const list = await communityIndex();
  return (
    <Shell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Comunidades tech de LATAM",
          itemListElement: list.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE}/comunidades/${c.slug}`,
            name: c.name,
          })),
        }}
      />
      <div className="hero-copy hub">
        <p className="crumbs">
          <Link href="/eventos">eventos</Link>
        </p>
        <h1>Comunidades</h1>
        <p>{INTRO}</p>
      </div>
      {list.length === 0 ? (
        <EmptyState
          art="calendar"
          title="Todavía no hay comunidades"
          action={
            <a className="btn primary" href={LUMA}>
              Subir evento
            </a>
          }
        >
          Aparecen acá cuando sincronizamos sus calendarios.
        </EmptyState>
      ) : (
        byCity(list).map(([city, members]) => (
          <section key={city}>
            <div className="label">
              <span>{city}</span>
              <span>{members.length}</span>
            </div>
            <ul className="communities">
              {members.map((c) => (
                <li key={c.slug}>
                  <Link href={`/comunidades/${c.slug}`}>
                    <b>{c.name}</b>
                    <small>{c.metros.slice(0, 3).join(" · ") || "online"}</small>
                    <span>
                      {c.upcoming > 0 && (
                        <em>
                          {c.upcoming} {c.upcoming === 1 ? "próximo" : "próximos"} ·{" "}
                        </em>
                      )}
                      {c.count} {c.count === 1 ? "evento" : "eventos"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Shell>
  );
}
