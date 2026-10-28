import { syncNow, toggleScope, toggleSync } from "@/app/admin/actions";
import { fullDate, humanError, relative, syncTone } from "@/lib/admin/format";

type Source = {
  id: string;
  name: string | null;
  url: string;
  provider: string;
  kind: string;
  scope: "latam" | "global";
  keyed: boolean;
  syncEnabled: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncedAt: Date | null;
  events: number;
};

const PROVIDER: Record<string, string> = { luma: "Luma", meetup: "Meetup", eventbrite: "Eventbrite" };

export function SourceRow({ s }: { s: Source }) {
  const state = syncTone(s.syncStatus, s.syncEnabled);
  const error = s.syncEnabled ? humanError(s.syncError) : null;
  return (
    <li className="row">
      <div className="cell grow">
        <span className="title">{s.name ?? s.url}</span>
        <span className="meta">
          {PROVIDER[s.provider] ?? s.provider}
          <span className={`tag ${s.scope}`}>{s.scope === "latam" ? "LATAM" : "Global"}</span>
          {s.keyed && <span className="tag">API key</span>}
        </span>
      </div>
      <div className="cell num">{s.events.toLocaleString("es")}</div>
      <div className="cell state">
        <span className={`dot ${state.tone}`} aria-hidden="true" />
        <span>
          {state.label}
          {error && (
            <small className="hint" title={s.syncError ?? undefined}>
              {error}
            </small>
          )}
        </span>
      </div>
      <div className="cell when" title={fullDate(s.lastSyncedAt)}>
        {relative(s.lastSyncedAt)}
      </div>
      <div className="cell actions">
        <form action={syncNow}>
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="ghost" disabled={!s.syncEnabled}>
            Sync
          </button>
        </form>
        <details className="menu">
          <summary aria-label={`Más acciones para ${s.name ?? s.url}`}>⋯</summary>
          <div className="menu-panel">
            <form action={toggleScope}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="scope" value={s.scope} />
              <button type="submit">{s.scope === "latam" ? "Marcar como global" : "Marcar como LATAM"}</button>
            </form>
            <form action={toggleSync}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="enabled" value={String(s.syncEnabled)} />
              <button type="submit">{s.syncEnabled ? "Pausar" : "Reanudar"}</button>
            </form>
            <a href={s.url} target="_blank" rel="noreferrer">
              Abrir en {PROVIDER[s.provider] ?? "origen"} ↗
            </a>
          </div>
        </details>
      </div>
    </li>
  );
}
