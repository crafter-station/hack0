import { AppError } from "./cli/foundation/error-map.js";
import { detectMode, type EmitOptions } from "./cli/platform/detect.js";
import { danger, dim, muted, warn } from "./cli/platform/style.js";
import { CONTRACT_VERSION, type Envelope, EXIT, type ExitCode, type NextStep } from "./contract.js";

export type Ctx = { command: string; flags: EmitOptions };

export function fail(code: string, human: string, hint?: string): AppError {
  return new AppError(code, { name: code, human, hint });
}

export function emitResult<T>(ctx: Ctx, result: T, nextSteps: NextStep[] = [], human?: (value: T) => void): ExitCode {
  if (detectMode(ctx.flags) === "json") {
    const envelope: Envelope<T> = {
      version: CONTRACT_VERSION,
      command: ctx.command,
      timestamp: new Date().toISOString(),
      ok: true,
      result,
      ...(nextSteps.length > 0 ? { nextSteps } : {}),
    };
    process.stdout.write(`${JSON.stringify(envelope)}\n`);
    return EXIT.ok;
  }
  if (human) human(result);
  else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (nextSteps.length > 0) {
    process.stderr.write("\n");
    for (const step of nextSteps) process.stderr.write(`${dim("next")}  ${step.command}\n      ${muted(step.reason)}\n`);
  }
  return EXIT.ok;
}

const EXIT_BY_CODE: Record<string, ExitCode> = {
  usage: EXIT.usage,
  "auth.missing-key": EXIT.auth,
  "auth.rejected": EXIT.auth,
  "auth.admin-missing": EXIT.auth,
  "not-found": EXIT.notFound,
  "entitlement.missing": EXIT.forbidden,
  network: EXIT.network,
  "install.conflict": EXIT.conflict,
  "publish.too-large": EXIT.usage,
};

export function emitError(ctx: Ctx, error: unknown): ExitCode {
  const err = error instanceof AppError ? error : fail("runtime", error instanceof Error ? error.message : String(error));
  const exit = EXIT_BY_CODE[err.code] ?? EXIT.runtime;
  if (detectMode(ctx.flags) === "json") {
    const envelope: Envelope<never> = {
      version: CONTRACT_VERSION,
      command: ctx.command,
      timestamp: new Date().toISOString(),
      ok: false,
      error: {
        code: err.code,
        message: err.human,
        ...(err.hint ? { hint: err.hint } : {}),
        retryable: err.code === "network",
      },
    };
    process.stdout.write(`${JSON.stringify(envelope)}\n`);
    return exit;
  }
  process.stderr.write(`${danger("error")}  ${err.human}\n`);
  if (err.hint) process.stderr.write(`${warn("hint")}   ${err.hint}\n`);
  return exit;
}
