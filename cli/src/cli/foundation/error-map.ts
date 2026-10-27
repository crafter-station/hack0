// cligentic block: error-map
//
// Typed error class with code, name, human message, and hint. Maps
// upstream API errors to actionable messages. Agents read the hint
// field to self-correct.
//
// Usage:
//   import { AppError, mapError } from "./foundation/error-map";
//
//   const errors = {
//     "AUTH_EXPIRED": { name: "AuthExpired", human: "Session expired.", hint: "Run: myapp login" },
//     "RATE_LIMIT":  { name: "RateLimit", human: "Too many requests.", hint: "Wait 60s and retry." },
//   };
//
//   try { await api.call(); }
//   catch (err) { throw mapError(err, errors); }

export type ErrorEntry = {
  name: string;
  human: string;
  hint?: string;
};

export type ErrorMap = Record<string, ErrorEntry>;

export class AppError extends Error {
  code: string;
  human: string;
  hint?: string;

  constructor(code: string, entry: ErrorEntry, cause?: unknown) {
    super(entry.human);
    this.name = entry.name;
    this.code = code;
    this.human = entry.human;
    this.hint = entry.hint;
    if (cause) this.cause = cause;
  }

  toJSON() {
    return {
      ok: false,
      code: this.code,
      name: this.name,
      error: this.human,
      hint: this.hint,
    };
  }
}

/**
 * Maps an upstream error to an AppError using the provided error map.
 * If the error has a `code` property that matches a key in the map,
 * returns a typed AppError with the mapped message and hint.
 * Otherwise wraps the original error as-is.
 */
export function mapError(err: unknown, errors: ErrorMap): AppError {
  const code = extractCode(err);
  if (code && errors[code]) {
    return new AppError(code, errors[code], err);
  }
  const message = err instanceof Error ? err.message : String(err);
  return new AppError("UNKNOWN", { name: "UnknownError", human: message }, err);
}

/**
 * Creates an AppError from an HTTP response. Looks up the status code in
 * statusMap first, then falls back to extractCode on the body string parsed
 * as JSON, then returns a generic HTTP error.
 */
export function fromHttp(status: number, body: string, statusMap: Record<number, string>, errors: ErrorMap): AppError {
  const mappedCode = statusMap[status];
  if (mappedCode && errors[mappedCode]) {
    return new AppError(mappedCode, errors[mappedCode]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }
  const code = extractCode(parsed);
  if (code && errors[code]) {
    return new AppError(code, errors[code]);
  }
  return new AppError("HTTP_ERROR", {
    name: "HttpError",
    human: `HTTP ${status}`,
    hint: body.slice(0, 120) || undefined,
  });
}

function extractCode(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const obj = err as Record<string, unknown>;
  const candidate =
    obj.code ??
    obj.status ??
    obj.statusCode ??
    (obj.response && typeof obj.response === "object" ? (obj.response as Record<string, unknown>).status : undefined);
  if (candidate === undefined || candidate === null) return null;
  return String(candidate);
}
