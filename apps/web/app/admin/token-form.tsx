"use client";

import { useActionState } from "react";
import { issueToken } from "./actions";

export function TokenForm() {
  const [token, action, pending] = useActionState(issueToken, null);
  return (
    <>
      <form action={action} className="admin-form">
        <input name="name" placeholder="para qué es (ej. bot de WhatsApp)" required />
        <button className="btn primary" type="submit" disabled={pending}>
          Crear token
        </button>
      </form>
      {token && (
        <p className="token-once">
          Cópialo ahora, no se vuelve a mostrar: <code>{token}</code>
        </p>
      )}
    </>
  );
}
