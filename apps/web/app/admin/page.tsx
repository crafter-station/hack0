import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/admin/auth";
import { eventsForReview, sourcesOverview } from "@/lib/admin/queries";
import { addSource, syncNow, toggleCurated, toggleSync } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "admin | hack0", robots: { index: false, follow: false } };

const when = (d: Date | null) => (d ? new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(d) : "nunca");

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const [rows, events] = await Promise.all([sourcesOverview(), eventsForReview(q)]);
  return (
    <Shell>
      <div className="hero-copy hub">
        <h1>Admin</h1>
        <p>
          {rows.length} fuentes · {events.length} eventos próximos para curar
        </p>
      </div>

      <section>
        <div className="label">
          <span>agregar calendario de Luma</span>
        </div>
        <form action={addSource} className="admin-form">
          <input name="url" placeholder="https://luma.com/..." required />
          <input name="name" placeholder="nombre (opcional)" />
          <button className="btn primary" type="submit">
            Agregar
          </button>
        </form>
      </section>

      <section>
        <div className="label">
          <span>fuentes</span>
          <span>{rows.length}</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>fuente</th>
              <th>eventos</th>
              <th>estado</th>
              <th>último sync</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={s.url}>{s.name ?? s.url}</a>
                  {s.syncError && <small className="error">{s.syncError}</small>}
                </td>
                <td>{s.events}</td>
                <td>{s.syncEnabled ? s.syncStatus : "pausada"}</td>
                <td>{when(s.lastSyncedAt)}</td>
                <td className="row-actions">
                  <form action={syncNow}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit">sync</button>
                  </form>
                  <form action={toggleSync}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="enabled" value={String(s.syncEnabled)} />
                    <button type="submit">{s.syncEnabled ? "pausar" : "activar"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="label">
          <span>curación</span>
          <span>{events.filter((e) => e.curated).length} curados</span>
        </div>
        <form className="admin-form">
          <input name="q" defaultValue={q} placeholder="buscar evento" />
          <button className="btn" type="submit">
            Buscar
          </button>
        </form>
        <table className="admin-table">
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <a href={e.url}>{e.name}</a>
                </td>
                <td>{when(e.startAt)}</td>
                <td>{[e.city, e.countryCode, e.languageCode].filter(Boolean).join(" · ")}</td>
                <td className="row-actions">
                  <form action={toggleCurated}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="curated" value={String(e.curated)} />
                    <button type="submit" aria-pressed={e.curated}>
                      {e.curated ? "curado" : "curar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
