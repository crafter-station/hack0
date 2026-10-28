import { verifyToken } from "./tokens";

const HEADERS = { "access-control-allow-origin": "*", "cache-control": "no-store" };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: HEADERS });
}

function bearer(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

/** Returns an error response when the request lacks a live token with `scope`, else null. */
export async function authorize(request: Request, scope: string): Promise<Response | null> {
  const token = await verifyToken(bearer(request));
  if (!token) return json({ error: "Missing or invalid API token" }, 401);
  if (!token.scopes.includes(scope)) return json({ error: `Token lacks the ${scope} scope` }, 403);
  return null;
}
