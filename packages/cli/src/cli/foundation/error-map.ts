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

type ErrorEntry = {
  name: string;
  human: string;
  hint?: string;
};

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
