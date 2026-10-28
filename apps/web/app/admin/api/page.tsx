import { revokeApiToken } from "@/app/admin/actions";
import { TokenForm } from "@/app/admin/token-form";
import { EmptyState } from "@/components/empty-state";
import { fullDate, relative } from "@/lib/admin/format";
import { tokensOverview } from "@/lib/admin/queries";

export default async function ApiTab() {
  const tokens = await tokensOverview();
  return (
    <>
      <p className="lead">
        Tokens para la API REST (<code>/api/v1</code>) y el servidor MCP (<code>/api/mcp</code>). 120 solicitudes por minuto por token.
      </p>
      <TokenForm />
      {tokens.length > 0 && (
        <ul className="table" aria-label="Tokens">
          <li className="row head" aria-hidden="true">
            <div className="cell grow">Nombre</div>
            <div className="cell">Prefijo</div>
            <div className="cell when">Último uso</div>
            <div className="cell actions" />
          </li>
          {tokens.map((t) => (
            <li key={t.id} className={`row${t.revokedAt ? " dim" : ""}`}>
              <div className="cell grow">
                <span className="title">{t.name}</span>
                <span className="meta">creado {relative(t.createdAt)}</span>
              </div>
              <div className="cell">
                <code>{t.prefix}…</code>
              </div>
              <div className="cell when" title={fullDate(t.lastUsedAt)}>
                {t.revokedAt ? "Revocado" : relative(t.lastUsedAt)}
              </div>
              <div className="cell actions">
                {!t.revokedAt && (
                  <form action={revokeApiToken}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="ghost danger">
                      Revocar
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {tokens.length === 0 && (
        <EmptyState art="key" title="Todavía no hay tokens">
          Crea uno arriba para un bot, un script o un agente. El valor se muestra una sola vez y se guarda solo su huella.
        </EmptyState>
      )}
    </>
  );
}
