import { afterEach, expect, test } from "bun:test";
import { isoDuration, submitToCalendar, toSubmission } from "../luma-calendar";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const at = (iso: string) => new Date(iso);

test("durations are ISO 8601", () => {
  expect(isoDuration(at("2026-11-05T23:00:00Z"), at("2026-11-06T01:30:00Z"))).toBe("PT2H30M");
  expect(isoDuration(at("2026-11-05T23:00:00Z"), at("2026-11-05T23:45:00Z"))).toBe("PT45M");
  expect(isoDuration(at("2026-11-05T23:00:00Z"), at("2026-11-05T23:00:00Z"))).toBeNull();
});

test("a Luma event goes by id; an external one needs an end and a timezone", () => {
  const base = { url: "https://meetup.com/x/events/1", name: "x", startAt: at("2026-11-05T23:00:00Z") };
  expect(toSubmission({ ...base, lumaEventId: "evt-1", endAt: null, timezone: null })).toEqual({
    submission: { platform: "luma", event_api_id: "evt-1" },
  });
  expect(toSubmission({ ...base, lumaEventId: null, endAt: null, timezone: "America/Lima" })).toEqual({ error: "no end time" });
  expect(toSubmission({ ...base, lumaEventId: null, endAt: at("2026-11-06T01:00:00Z"), timezone: null })).toEqual({ error: "no timezone" });
  const ok = toSubmission({ ...base, lumaEventId: null, endAt: at("2026-11-06T01:00:00Z"), timezone: "America/Lima" });
  expect(ok).toEqual({
    submission: {
      platform: "external",
      url: base.url,
      name: "x",
      start_at: "2026-11-05T23:00:00.000Z",
      duration_interval: "PT2H",
      timezone: "America/Lima",
    },
  });
});

function stubLuma(existing: boolean) {
  const calls: string[] = [];
  globalThis.fetch = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url.replace("https://public-api.luma.com/v1/calendars/events", "")}`);
      if (url.includes("/lookup")) return Response.json({ event: existing ? { id: "calev-1", status: "approved" } : null });
      return Response.json({ id: "calev-2", status: "approved" });
    },
    { preconnect: realFetch.preconnect },
  );
  return calls;
}

test("submitting checks the calendar first and never adds twice", async () => {
  process.env.LUMA_API_KEY = "test-key";
  const calls = stubLuma(true);
  expect(await submitToCalendar({ platform: "luma", event_api_id: "evt-1" })).toEqual({ id: "calev-1", status: "approved", existed: true });
  expect(calls).toEqual(["GET /lookup?platform=luma&event_api_id=evt-1"]);
});

test("a new event is looked up, then added", async () => {
  process.env.LUMA_API_KEY = "test-key";
  const calls = stubLuma(false);
  expect((await submitToCalendar({ platform: "luma", event_api_id: "evt-9" })).existed).toBe(false);
  expect(calls).toEqual(["GET /lookup?platform=luma&event_api_id=evt-9", "POST /add"]);
});
