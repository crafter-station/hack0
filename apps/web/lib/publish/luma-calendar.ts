import { RetryableError } from "workflow";

const API = "https://public-api.luma.com/v1/calendars/events";

type Submission =
  | { platform: "luma"; event_api_id: string }
  | { platform: "external"; url: string; name: string; start_at: string; duration_interval: string; timezone: string };

type Candidate = { lumaEventId: string | null; url: string; name: string; startAt: Date; endAt: Date | null; timezone: string | null };

/** ISO 8601 duration between two instants, e.g. PT2H30M. */
export function isoDuration(start: Date, end: Date): string | null {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

/** What Luma needs to list the event, or why it cannot: external events must carry an end and a timezone. */
export function toSubmission(e: Candidate): { submission: Submission } | { error: string } {
  if (e.lumaEventId) return { submission: { platform: "luma", event_api_id: e.lumaEventId } };
  if (!e.endAt) return { error: "no end time" };
  if (!e.timezone) return { error: "no timezone" };
  const duration = isoDuration(e.startAt, e.endAt);
  if (!duration) return { error: "end is not after start" };
  return {
    submission: {
      platform: "external",
      url: e.url,
      name: e.name,
      start_at: e.startAt.toISOString(),
      duration_interval: duration,
      timezone: e.timezone,
    },
  };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.LUMA_API_KEY;
  if (!key) throw new Error("LUMA_API_KEY is not set");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "x-luma-api-key": key, "content-type": "application/json", ...init.headers },
  });
  if (res.status === 429) throw new RetryableError("Luma rate limit", { retryAfter: "1m" });
  if (!res.ok) throw new Error(`Luma ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

/** Adds the event to the hack0 calendar unless it is already there; safe to call twice. */
export async function submitToCalendar(submission: Submission): Promise<{ id: string; status: string; existed: boolean }> {
  const query = new URLSearchParams(
    submission.platform === "luma"
      ? { platform: "luma", event_api_id: submission.event_api_id }
      : { platform: "external", url: submission.url },
  );
  const found = await call<{ event: { id: string; status: string } | null }>(`/lookup?${query}`);
  if (found.event) return { ...found.event, existed: true };
  const added = await call<{ id: string; status: string }>("/add", { method: "POST", body: JSON.stringify(submission) });
  return { ...added, existed: false };
}
