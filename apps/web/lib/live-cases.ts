/** When the three live cases of workshop 01 stop being placeholders: the night of the workshop, once it has ended. */
const LIVE_CASES_OPEN_AT = "2026-11-20T01:30:00Z";

/** Whether the live cases are published at `now`. */
export function liveCasesOpen(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(LIVE_CASES_OPEN_AT).getTime();
}
