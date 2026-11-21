import Link from "next/link";
import { decideTestimonialAction } from "@/app/admin/actions";
import { EmptyState } from "@/components/empty-state";
import { relative } from "@/lib/admin/format";
import { testimonialsForReview } from "@/lib/testimonials";

const STATUS_LABEL: Record<string, string> = { pending: "Por revisar", approved: "Publicado", hidden: "Oculto" };

const ACTIONS: Record<string, { status: "approved" | "hidden" | "pending"; label: string; primary?: boolean }[]> = {
  pending: [
    { status: "approved", label: "Aprobar", primary: true },
    { status: "hidden", label: "Ocultar" },
  ],
  approved: [{ status: "hidden", label: "Ocultar" }],
  hidden: [{ status: "approved", label: "Aprobar", primary: true }],
};

export default async function TestimonialsTab() {
  const items = await testimonialsForReview();
  return (
    <>
      <p className="lead">
        Testimonios del workshop. Solo los aprobados salen en <code>/api/v1/testimonials</code>.
      </p>
      {items.length === 0 && (
        <EmptyState
          art="drafts"
          title="Sin testimonios todavía"
          action={
            <Link className="btn primary" href="/taste-hacking/testimonials">
              Abrir el formulario
            </Link>
          }
        >
          Comparte /taste-hacking/testimonials con quienes asistieron. Con ?nombre=Ana el formulario abre con su nombre puesto.
        </EmptyState>
      )}
      <div className="drafts">
        {items.map((t) => (
          <article key={t.id} className="draft-card">
            <header>
              <span className="tag">{STATUS_LABEL[t.status] ?? t.status}</span>
              <span className="muted">{relative(new Date(t.createdAt))}</span>
            </header>
            <pre>{t.body}</pre>
            <p className="muted">
              {t.name}
              {t.role ? ` · ${t.role}` : ""}
              {t.link ? (
                <>
                  {" · "}
                  <a href={t.link} target="_blank" rel="noopener noreferrer">
                    {t.link.replace(/^https?:\/\//, "")}
                  </a>
                </>
              ) : null}
              {t.email ? ` · ${t.email}` : ""}
              {t.verified ? " · asistente con compra" : ""}
            </p>
            <footer>
              {(ACTIONS[t.status] ?? []).map((a) => (
                <form key={a.status} action={decideTestimonialAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value={a.status} />
                  <button type="submit" className={a.primary ? "btn primary" : "ghost"}>
                    {a.label}
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
