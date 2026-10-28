import Link from "next/link";
import { decideDraft } from "@/app/admin/actions";
import { EmptyState } from "@/components/empty-state";
import { relative } from "@/lib/admin/format";
import { openDrafts } from "@/lib/admin/queries";

export default async function ContentTab() {
  const drafts = await openDrafts();
  return (
    <>
      <p className="lead">Agenda semanal y un post por evento destacado. Se generan cada día; nada se publica solo.</p>
      {drafts.length === 0 && (
        <EmptyState
          art="drafts"
          title="Sin borradores por ahora"
          action={
            <Link className="btn primary" href="/admin/curacion">
              Destacar eventos
            </Link>
          }
        >
          Destaca eventos de esta semana: cada mañana se arma la agenda semanal y un post por evento, listos para revisar.
        </EmptyState>
      )}
      <div className="drafts">
        {drafts.map((d) => (
          <article key={d.id} className="draft-card">
            <header>
              <span className="tag">{d.kind === "agenda" ? "Agenda semanal" : "Post del evento"}</span>
              <span className="muted">{relative(d.updatedAt)}</span>
            </header>
            <pre>{d.body}</pre>
            <footer>
              {(["approved", "discarded"] as const).map((status) => (
                <form key={status} action={decideDraft}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="status" value={status} />
                  <button type="submit" className={status === "approved" ? "btn primary" : "ghost"}>
                    {status === "approved" ? "Aprobar" : "Descartar"}
                  </button>
                </form>
              ))}
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
