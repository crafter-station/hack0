import Link from "next/link";
import { AutoSubmitForm } from "@/components/auto-submit";
import { Flag } from "@/components/flag";
import { countryName, type Filters, filterHref, type SearchResult } from "@/lib/search";

type Props = { filters: Filters; result: SearchResult };

function Segment({ items, current }: { items: { label: string; href: string; on: boolean }[]; current: string }) {
  return (
    <nav className="segment" aria-label={current}>
      {items.map((i) => (
        <Link key={i.label} href={i.href} aria-current={i.on ? "true" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

/** Search, time and format toggles, country chips with flags, city and topic selects, and the active-filter summary. */
export function EventFilters({ filters: f, result }: Props) {
  const active = [
    f.q && { label: `“${f.q}”`, href: filterHref(f, { q: undefined }) },
    f.pais && { label: countryName(f.pais), flag: f.pais, href: filterHref(f, { pais: undefined }) },
    f.ciudad && {
      label: result.facets.ciudades.find((c) => c.value === f.ciudad)?.label ?? f.ciudad,
      href: filterHref(f, { ciudad: undefined }),
    },
    f.tema && {
      label: `#${result.facets.temas.find((t) => t.value === f.tema)?.label ?? f.tema}`,
      href: filterHref(f, { tema: undefined }),
    },
    f.formato && { label: f.formato, href: filterHref(f, { formato: undefined }) },
  ].filter((a): a is { label: string; href: string; flag?: string } => Boolean(a));

  return (
    <section className="filters" aria-label="Filtrar eventos">
      <AutoSubmitForm className="filter-search">
        <input type="search" name="q" defaultValue={f.q} placeholder="Buscar eventos, comunidades, temas…" aria-label="Buscar eventos" />
        {f.pais && <input type="hidden" name="pais" value={f.pais.toLowerCase()} />}
        {f.formato && <input type="hidden" name="formato" value={f.formato} />}
        {f.cuando === "pasados" && <input type="hidden" name="cuando" value="pasados" />}
        <select name="ciudad" defaultValue={f.ciudad ?? ""} aria-label="Ciudad">
          <option value="">Todas las ciudades</option>
          {result.facets.ciudades.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label} ({c.count})
            </option>
          ))}
        </select>
        <select name="tema" defaultValue={f.tema ?? ""} aria-label="Tema">
          <option value="">Todos los temas</option>
          {result.facets.temas.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} ({t.count})
            </option>
          ))}
        </select>
        <button className="btn primary" type="submit">
          Buscar
        </button>
      </AutoSubmitForm>

      <div className="filter-row">
        <Segment
          current="Cuándo"
          items={[
            { label: "Próximos", href: filterHref(f, { cuando: "proximos" }), on: f.cuando === "proximos" },
            { label: "Pasados", href: filterHref(f, { cuando: "pasados" }), on: f.cuando === "pasados" },
          ]}
        />
        <Segment
          current="Formato"
          items={[
            { label: "Todos", href: filterHref(f, { formato: undefined }), on: !f.formato },
            { label: "Presencial", href: filterHref(f, { formato: "presencial" }), on: f.formato === "presencial" },
            { label: "Online", href: filterHref(f, { formato: "online" }), on: f.formato === "online" },
          ]}
        />
      </div>

      {result.facets.paises.length > 0 && (
        <nav className="country-chips" aria-label="País">
          {result.facets.paises.map((p) => {
            const on = f.pais === p.value;
            return (
              <Link key={p.value} href={filterHref(f, { pais: on ? undefined : p.value })} aria-current={on ? "true" : undefined}>
                <Flag code={p.value} /> {p.label} <span>{p.count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <p className="filter-summary" aria-live="polite">
        <b>
          {result.total} {result.total === 1 ? "evento" : "eventos"}
        </b>
        {active.map((a) => (
          <Link key={a.href} href={a.href} className="pill" aria-label={`Quitar filtro ${a.label}`}>
            {a.flag && <Flag code={a.flag} />} {a.label} <span aria-hidden="true">×</span>
          </Link>
        ))}
        {active.length > 0 && (
          <Link href={filterHref({ cuando: f.cuando, page: 0 }, {})} className="clear">
            limpiar
          </Link>
        )}
      </p>
    </section>
  );
}
