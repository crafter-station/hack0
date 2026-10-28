import Form from "next/form";
import Link from "next/link";
import { pauseUnfixable } from "@/app/admin/actions";
import { AddSource } from "@/components/admin/add-source";
import { SourceRow } from "@/components/admin/source-row";
import { EmptyState } from "@/components/empty-state";
import { errorKind } from "@/lib/admin/format";
import { type SourceView, sourcesOverview } from "@/lib/admin/queries";

type Props = { searchParams: Promise<{ q?: string; vista?: string }> };

const VIEWS: { value: SourceView; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "error", label: "Con error" },
  { value: "pausadas", label: "Pausadas" },
];

export default async function SourcesTab({ searchParams }: Props) {
  const { q, vista } = await searchParams;
  const view = VIEWS.find((v) => v.value === vista)?.value ?? "todas";
  const rows = await sourcesOverview({ q, view });
  const unfixable = rows.filter((r) => {
    const kind = r.syncEnabled && r.syncStatus === "failed" ? errorKind(r.syncError) : null;
    return kind === "gone" || kind === "duplicate";
  }).length;
  const href = (v: SourceView) => `/admin?${new URLSearchParams({ ...(q ? { q } : {}), ...(v !== "todas" ? { vista: v } : {}) })}`;
  return (
    <>
      <div className="toolbar">
        <Form action="/admin" className="search">
          <input type="search" name="q" defaultValue={q} placeholder="Buscar fuente" aria-label="Buscar fuente" />
          {view !== "todas" && <input type="hidden" name="vista" value={view} />}
        </Form>
        <nav className="segment" aria-label="Vista">
          {VIEWS.map((v) => (
            <Link key={v.value} href={href(v.value)} aria-current={v.value === view ? "true" : undefined}>
              {v.label}
            </Link>
          ))}
        </nav>
        <AddSource />
      </div>
      {view === "error" && unfixable > 0 && (
        <div className="fix-bar">
          <span>
            {unfixable} {unfixable === 1 ? "fuente ya no existe o está duplicada" : "fuentes ya no existen o están duplicadas"}. Reintentar
            no las arregla.
          </span>
          <form action={pauseUnfixable}>
            <button type="submit" className="btn primary">
              Pausar {unfixable === 1 ? "esa fuente" : `las ${unfixable}`}
            </button>
          </form>
        </div>
      )}
      {rows.length > 0 && (
        <ul className="table" aria-label="Fuentes">
          <li className="row head" aria-hidden="true">
            <div className="cell grow">Fuente</div>
            <div className="cell num">Eventos</div>
            <div className="cell state">Estado</div>
            <div className="cell when">Último sync</div>
            <div className="cell actions" />
          </li>
          {rows.map((s) => (
            <SourceRow key={s.id} s={s} />
          ))}
        </ul>
      )}
      {rows.length === 0 &&
        (q ? (
          <EmptyState
            art="search"
            title={`Nada que se llame “${q}”`}
            action={
              <Link className="btn" href={href(view)}>
                Borrar búsqueda
              </Link>
            }
          >
            Prueba con parte del nombre o busca en todas las fuentes.
          </EmptyState>
        ) : view === "error" ? (
          <EmptyState art="done" title="Todas las fuentes sincronizan bien">
            Cuando una falle aparece aquí, con el motivo en simple.
          </EmptyState>
        ) : view === "pausadas" ? (
          <EmptyState art="signal" title="Ninguna fuente pausada">
            Pausa una desde su menú ⋯ si quieres dejar de leerla sin borrarla.
          </EmptyState>
        ) : (
          <EmptyState art="calendar" title="Todavía no hay fuentes">
            Agrega un calendario de Luma, un grupo de Meetup o un organizador de Eventbrite y el cron lo sincroniza cada día.
          </EmptyState>
        ))}
    </>
  );
}
