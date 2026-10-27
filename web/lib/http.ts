export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function error(status: number, code: string, message: string, hint?: string): Response {
  return Response.json({ error: { code, message, ...(hint ? { hint } : {}) } }, { status });
}

export function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

export function isAdmin(req: Request): boolean {
  const expected = process.env.HACK0_ADMIN_TOKEN;
  const given = req.headers.get("x-hack0-admin");
  return Boolean(expected && given && timingSafe(given, expected));
}

function timingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
