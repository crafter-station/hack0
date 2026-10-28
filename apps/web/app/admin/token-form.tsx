"use client";

import { useActionState, useState } from "react";
import { issueToken } from "./actions";

export function TokenForm() {
  const [token, action, pending] = useActionState(issueToken, null);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <form action={action} className="token-form">
        <input name="name" placeholder="Para qué es, p. ej. bot de WhatsApp" required aria-label="Nombre del token" />
        <button className="btn primary" type="submit" disabled={pending}>
          Crear token
        </button>
      </form>
      {token && (
        <p className="token-once">
          Cópialo ahora, no se vuelve a mostrar: <code>{token}</code>{" "}
          <button
            type="button"
            className="ghost"
            onClick={() =>
              navigator.clipboard.writeText(token).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </p>
      )}
    </>
  );
}
