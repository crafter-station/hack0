"use client";

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@ui-sdk/react/combobox";
import { ScrollArea, ScrollAreaContent, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@ui-sdk/react/scroll-area";
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle";
import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { EcoMap, type MapPlace } from "@/components/eco-map";
import { OrgLogo } from "@/components/org-logo";

type ExplorerOrg = {
  slug: string;
  name: string;
  type: string;
  typeLabel: string;
  city: string | null;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  logoTone: "light" | "dark" | null;
  logoAspect: number | null;
  hiringUrl: string | null;
  lat: number | null;
  lng: number | null;
};

type Props = {
  title: string;
  intro: string;
  crumbs: { href: string; label: string }[];
  orgs: ExplorerOrg[];
  types: { type: string; plural: string; glyph: string }[];
  places: MapPlace[];
  placeBase: string;
  view: [number, number, number];
  links: { href: string; label: string; count: number }[];
  more: { href: string; label: string; count: number }[];
  /** Heading of the org list, so each hub's list is named in the outline. */
  listTitle: string;
  place: string;
  /** Prose and answers about this hub, server-written from its rows. */
  about: { paragraphs: string[]; faq: { q: string; a: string }[] };
};

const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Full-screen directory: the map is the page, the panel holds search, type filters and the crawlable list. */
export function EcoExplorer({ title, intro, crumbs, orgs, types, places, placeBase, view, links, more, listTitle, place, about }: Props) {
  const [active, setActive] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const shown = useMemo(() => (active.length === 0 ? orgs : orgs.filter((o) => active.includes(o.type))), [orgs, active]);
  const pins = useMemo(
    () =>
      shown.flatMap((o) =>
        o.lat !== null && o.lng !== null
          ? [
              {
                slug: o.slug,
                name: o.name,
                type: o.type,
                lat: o.lat,
                lng: o.lng,
                logoUrl: o.logoUrl,
                logoTone: o.logoTone,
                logoAspect: o.logoAspect,
              },
            ]
          : [],
      ),
    [shown],
  );
  const current = orgs.find((o) => o.slug === selected) ?? null;
  const panel = useRef<HTMLElement>(null);

  // A pick from the map or the search scrolls its row into view.
  useEffect(() => {
    if (!selected) return;
    panel.current?.querySelector(`[data-org="${CSS.escape(selected)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  const counts = useMemo(() => new Map(types.map((t) => [t.type, orgs.filter((o) => o.type === t.type).length])), [orgs, types]);

  return (
    <div className="eco">
      <EcoMap pins={pins} places={places} placeBase={placeBase} view={view} selected={selected} onSelect={setSelected} />
      <aside ref={panel} className="eco-panel" aria-label="Directorio">
        <header className="eco-head">
          <p className="crumbs">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 && " / "}
                <Link href={c.href}>{c.label}</Link>
              </span>
            ))}
          </p>
          <h1>{title}</h1>
          <p className="eco-intro">{intro}</p>
        </header>

        {orgs.length > 0 && (
          <div className="eco-search">
            <Combobox value={selected} onValueChange={(v) => setSelected(typeof v === "string" ? v : null)} autoHighlight>
              <ComboboxInput
                className="eco-search-input"
                aria-label="Buscar organización"
                placeholder="Buscar startup, fondo, universidad…"
              />
              <ComboboxContent className="eco-search-pop">
                <ComboboxEmpty>Nada con ese nombre todavía.</ComboboxEmpty>
                <ComboboxList>
                  {orgs.map((o) => (
                    <ComboboxItem
                      key={o.slug}
                      value={o.slug}
                      label={o.name}
                      keywords={[o.typeLabel, o.city ?? ""]}
                      className="eco-search-item"
                    >
                      <OrgLogo org={o} size={24} />
                      <span>{o.name}</span>
                      <small className="eco-search-kind">{o.typeLabel}</small>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        )}

        {types.length > 1 && (
          <ToggleGroup multiple value={active} onValueChange={setActive} aria-label="Filtrar por tipo" className="eco-types">
            {types.map((t) => (
              <Toggle key={t.type} value={t.type} className="eco-type" data-type={t.type}>
                <span className="eco-glyph" aria-hidden="true">
                  {t.glyph}
                </span>
                {t.plural}
                <span className="eco-count">{counts.get(t.type)}</span>
              </Toggle>
            ))}
          </ToggleGroup>
        )}

        {current && (
          <article className="eco-card" aria-live="polite">
            <button type="button" className="eco-close" onClick={() => setSelected(null)} aria-label="Cerrar">
              ×
            </button>
            <div className="eco-card-head">
              <OrgLogo org={current} size={56} />
              <div>
                <h2>{current.name}</h2>
                <p>
                  {current.typeLabel}
                  {current.city ? ` · ${current.city}` : ""}
                </p>
              </div>
            </div>
            {current.description && <p className="eco-card-desc">{current.description}</p>}
            <div className="eco-card-actions">
              <Link className="btn primary" href={`/org/${current.slug}`}>
                Ver perfil
              </Link>
              {current.websiteUrl && (
                <a className="btn" href={current.websiteUrl} rel="noopener">
                  Web ↗
                </a>
              )}
              {current.hiringUrl && (
                <a className="btn eco-hiring" href={current.hiringUrl} rel="noopener">
                  Empleos ↗
                </a>
              )}
            </div>
          </article>
        )}

        <ScrollArea className="eco-scroll">
          <ScrollAreaViewport className="eco-viewport" role="region" aria-label="Organizaciones">
            <ScrollAreaContent>
              {links.length > 0 && (
                <nav className="eco-links" aria-label="Explorar">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="eco-link">
                      {l.label} <span className="eco-link-count">{l.count}</span>
                    </Link>
                  ))}
                </nav>
              )}
              <h2 className="label eco-list-title">
                <span>{active.length === 0 ? listTitle.replace(/^Ecosistema tech de /, "Organizaciones en ") : "filtradas"}</span>
                <span>{shown.length}</span>
              </h2>
              <ul className="eco-list">
                {shown.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/org/${o.slug}`}
                      className="eco-row"
                      data-org={o.slug}
                      aria-current={o.slug === selected ? "true" : undefined}
                      onClick={(e) => {
                        // A plain click previews on the map; the link stays real for crawlers and new tabs.
                        if (!plainClick(e)) return;
                        e.preventDefault();
                        setSelected(o.slug);
                      }}
                    >
                      <OrgLogo org={o} size={36} />
                      <span>
                        <b className="eco-row-name">{o.name}</b>
                        <small className="eco-row-kind">
                          {o.typeLabel}
                          {o.city ? ` · ${o.city}` : ""}
                          {o.hiringUrl ? " · contratando" : ""}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {orgs.length === 0 && <p className="eco-empty">Todavía no mapeamos organizaciones aquí.</p>}
              {about.paragraphs.length > 0 && (
                <section className="eco-about" aria-labelledby="eco-about-title">
                  <h2 id="eco-about-title" className="label">
                    <span>sobre el ecosistema de {place}</span>
                  </h2>
                  {about.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {about.faq.map((f) => (
                    <div key={f.q} className="eco-faq">
                      <h3>{f.q}</h3>
                      <p>{f.a}</p>
                    </div>
                  ))}
                </section>
              )}
              {more.length > 0 && (
                <>
                  <div className="label eco-more">
                    <span>explorar</span>
                  </div>
                  <nav className="eco-links" aria-label="Más páginas">
                    {more.map((l) => (
                      <Link key={l.href} href={l.href} className="eco-link">
                        {l.label} <span className="eco-link-count">{l.count}</span>
                      </Link>
                    ))}
                  </nav>
                </>
              )}
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar orientation="vertical" className="eco-bar">
            <ScrollAreaThumb className="eco-thumb" />
          </ScrollAreaScrollbar>
        </ScrollArea>
      </aside>
    </div>
  );
}
