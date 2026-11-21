import { Mark } from "@/components/logo";
import type { Draft } from "./form";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}` : (parts[0]?.slice(0, 2) ?? "")).toUpperCase();
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // biome-ignore lint/performance/noImgElement: a 36px account photo from Clerk's CDN, already sized there; the optimizer adds a request for nothing
      <img className="th-t-avatar" src={`${url}${url.includes("?") ? "&" : "?"}width=96`} alt="" width={36} height={36} />
    );
  }
  return (
    <span className="th-t-avatar" aria-hidden="true">
      {initials(name) || "?"}
    </span>
  );
}

/** The card as the course site will show it, redrawn on every keystroke. */
export function Preview({ draft, avatarUrl, verified }: { draft: Draft; avatarUrl: string | null; verified: boolean }) {
  const body = draft.body.trim();
  const name = draft.name.trim();
  return (
    <aside className="th-plate th-ticks th-t-plate" aria-label="Vista previa">
      <p className="th-plate-head">
        <span>vista previa</span>
        <span>así aparece en la web</span>
      </p>
      <div className="th-plate-stage">
        <figure className="th-t-card" data-empty={body ? undefined : "true"}>
          <header>
            <Mark size={18} bg="var(--card)" ink="var(--card-ink)" />
            <span>taste hacking · workshop 01</span>
          </header>
          <blockquote>
            <p>{body || "Tu testimonio aparece aquí mientras escribes."}</p>
          </blockquote>
          <figcaption>
            <Avatar url={avatarUrl} name={name} />
            <span>
              <b>{name || "Tu nombre"}</b>
              {draft.role.trim() && <small>{draft.role.trim()}</small>}
            </span>
            {verified && <i>asistente</i>}
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
