import { RATE_LIMIT, verifyToken } from "./tokens";

const HEADERS = { "access-control-allow-origin": "*", "cache-control": "no-store" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...HEADERS, ...headers } });
}

function bearer(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

/** Rate-limit headers for a response, in the format Event Aggregator's API sent. */
type Quota = Record<string, string>;

/** Returns `{ denied }` when the request lacks a live, unthrottled token with `scope`; otherwise the quota headers. */
export async function authorize(request: Request, scope: string): Promise<{ denied: Response } | { quota: Quota }> {
  const token = await verifyToken(bearer(request));
  if (!token) return { denied: json({ error: "Missing or invalid API token" }, 401) };
  const quota = {
    "x-ratelimit-limit": String(RATE_LIMIT),
    "x-ratelimit-remaining": String(Math.max(0, RATE_LIMIT - token.used)),
    "x-ratelimit-reset": String(Math.ceil(token.resetAt.getTime() / 1000)),
  };
  if (token.used > RATE_LIMIT) {
    const retry = String(Math.max(1, Math.ceil((token.resetAt.getTime() - Date.now()) / 1000)));
    return { denied: json({ error: "rate_limited" }, 429, { ...quota, "retry-after": retry }) };
  }
  if (!token.scopes.includes(scope)) return { denied: json({ error: `Token lacks the ${scope} scope` }, 403, quota) };
  return { quota };
}
