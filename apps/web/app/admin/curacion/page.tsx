import { toggleCurated } from "@/app/admin/actions";
import { EmptyState } from "@/components/empty-state";
import { Flag } from "@/components/flag";
import { type CurationView, eventsForReview } from "@/lib/admin/queries";

type Props = { searchParams: Promise<{ q?: string; vista?: string }> };

const VIEWS: { value: CurationView; label: string }[] = [
  { value: "pendientes", label: "Pendientes" },
  { value: "curados", label: "Curados" },
  { value: "todos", label: "Todos" },
];

const dayKey = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
const dayLabel = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(d);
const time = (d: Date, tz: string) => new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(d);

export default async function CurationTab({ searchParams }: Props) {
  const { q, vista } = await searchParams;
  const view = VIEWS.find((v) => v.value === vista)?.value ?? "pendientes";
  const events = await eventsForReview({ q, view });
  const days = new Map<string, { label: string; items: typeof events }>();
  for (const e of events) {
    const tz = e.timezone ?? "America/Lima";
    const key = dayKey(e.startAt, tz);
    const day = days.get(key) ?? { label: dayLabel(e.startAt, tz), items: [] };
    day.items.push(e);
    days.set(key, day);
  }
  const href = (v: CurationView) =>
    `/admin/curacion?${new URLSearchParams({ ...(q ? { q } : {}), ...(v !== "pendientes" ? { vista: v } : {}) })}`;
  return (
    <>
      <div className="toolbar">
        <form className="search">
          <input type="search" name="q" defaultValue={q} placeholder="Buscar evento" aria-label="Buscar evento" />
          {view !== "pendientes" && <input type="hidden" name="vista" value={view} />}
        </form>
        <nav className="segment" aria-label="Vista">
          {VIEWS.map((v) => (
            <a key={v.value} href={href(v.value)} aria-current={v.value === view ? "true" : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      </div>
      {events.length === 0 &&
        (q ? (
          <EmptyState
            art="search"
            title={`Ningún evento con “${q}”`}
            action={
              <a className="btn" href={href(view)}>
                Borrar búsqueda
              </a>
            }
          >
            La búsqueda mira el nombre de los eventos próximos.
          </EmptyState>
        ) : view === "pendientes" ? (
          <EmptyState
            art="done"
            title="Todo curado"
            action={
              <a className="btn" href={href("curados")}>
                Ver curados
              </a>
            }
          >
            No quedan eventos próximos por revisar. Los nuevos aparecen aquí después de cada sync.
          </EmptyState>
        ) : view === "curados" ? (
          <EmptyState
            art="calendar"
            title="Aún no curaste ninguno"
            action={
              <a className="btn primary" href={href("pendientes")}>
                Empezar a curar
              </a>
            }
          >
            Un evento curado entra en la agenda semanal, tiene su post y puede ir al calendario de Luma.
          </EmptyState>
        ) : (
          <EmptyState art="calendar" title="No hay eventos próximos">
            Cuando las fuentes traigan fechas nuevas aparecen aquí.
          </EmptyState>
        ))}
      {[...days.entries()].map(([key, day]) => (
        <section key={key} className="day">
          <h2>{day.label}</h2>
          {day.items.map((e) => (
            <div key={e.id} className={`curate-row${e.curated ? " on" : ""}`}>
              <span className="time">{time(e.startAt, e.timezone ?? "America/Lima")}</span>
              {e.coverUrl ? (
                // biome-ignore lint/performance/noImgElement: a 48px thumbnail from the provider CDN, not worth the optimizer
                <img className="thumb" src={e.coverUrl} alt="" width={48} height={48} loading="lazy" />
              ) : (
                <span className="thumb empty-thumb" aria-hidden="true" />
              )}
              <span className="body">
                <a className="title" href={`/eventos/${e.slug}`} target="_blank" rel="noreferrer">
                  {e.name}
                </a>
                <span className="meta">
                  {e.hostName && <span>{e.hostName}</span>}
                  <span>
                    <Flag code={e.countryCode} /> {e.isOnline ? "Online" : (e.metro ?? "Sin ciudad")}
                  </span>
                  {e.languageCode && <span className="tag">{e.languageCode.toUpperCase()}</span>}
                </span>
              </span>
              <form action={toggleCurated}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="curated" value={String(e.curated)} />
                <button
                  type="submit"
                  className="switch"
                  role="switch"
                  aria-checked={e.curated}
                  aria-label={e.curated ? "Quitar de curados" : "Curar"}
                >
                  <span />
                </button>
              </form>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
