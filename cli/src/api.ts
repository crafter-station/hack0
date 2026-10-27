import { apiUrl } from "./config.js";
import type { Bundle, CatalogItem } from "./contract.js";
import { fail } from "./output.js";

type Options = { key?: string; admin?: string; method?: string; body?: unknown };

async function call<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.key) headers.authorization = `Bearer ${opts.key}`;
  if (opts.admin) headers["x-hack0-admin"] = opts.admin;
  let res: Response;
  try {
    res = await fetch(`${apiUrl()}/api/v1${path}`, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (cause) {
    throw fail("network", `Could not reach ${apiUrl()}.`, cause instanceof Error ? cause.message : undefined);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: { code: string; message: string; hint?: string } };
  if (!res.ok) {
    const code = data.error?.code ?? (res.status === 404 ? "not-found" : "runtime");
    throw fail(code, data.error?.message ?? `The server answered ${res.status}.`, data.error?.hint);
  }
  return data as T;
}

export const api = {
  catalog: (key?: string) => call<{ items: CatalogItem[] }>("/catalog", { key }),
  bundle: (id: string, key?: string) => call<Bundle>(`/packages/${encodeURIComponent(id)}`, { key }),
  me: (key: string) => call<{ email: string; workshops: string[] }>("/me", { key }),
  recover: (email: string) => call<{ sent: boolean }>("/keys/recover", { body: { email } }),
  feedback: (message: string, context: Record<string, unknown>) => call<{ id: string }>("/feedback", { body: { message, context } }),
  grant: (admin: string, email: string, workshop: string, note?: string) =>
    call<{ email: string; workshop: string; newKey: boolean; emailed: boolean }>("/admin/grant", {
      admin,
      body: { email, workshop, note },
    }),
  publish: (admin: string, bundle: Omit<Bundle, "free"> & { free: boolean }) =>
    call<{ id: string; version: string }>("/admin/packages", { admin, body: bundle }),
  linkEdition: (admin: string, eventId: string, workshop: string, label?: string) =>
    call<{ eventId: string; workshop: string }>("/admin/editions", { admin, body: { eventId, workshop, label } }),
};
