import { afterEach, describe, expect, test } from "bun:test";
import { fetchEventPage, fetchUpcomingFromPage, lumaPageKind, proseToMarkdown, resolveCalendarId, resolveProfileId } from "../luma-public";
import fixture from "./luma-pages.fixture.json";

// Page props captured from luma.com on 2026-10-28 (hack0's calendar, one of its events, a host profile), trimmed.
const html = (initialData: unknown) =>
  `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { initialData } } })}</script></html>`;

const realFetch = globalThis.fetch;
const serve = (initialData: unknown) => {
  globalThis.fetch = (async (_input: string | URL) =>
    new Response(html(initialData), { headers: { "content-type": "text/html" } })) as typeof fetch;
};
afterEach(() => {
  globalThis.fetch = realFetch;
});

const BEFORE_ALL = new Date("2026-01-01T00:00:00Z");

describe("public Luma pages", () => {
  test("a calendar page vouches for its upcoming list, with country, coordinates and timezone", async () => {
    serve(fixture.calendar);
    const events = await fetchUpcomingFromPage("https://luma.com/hack0", BEFORE_ALL);
    expect(events).toHaveLength(2);
    expect(events?.[0]).toMatchObject({
      apiId: "evt-rFhHBy45FdesNLY",
      countryCode: "PE",
      timezone: "America/Lima",
      url: "https://luma.com/5z2nzojb",
    });
    expect(events?.[0]?.latitude).toBeCloseTo(-12.096, 2);
  });

  test("a page with more upcoming start times than entries cannot vouch for the list", async () => {
    serve({
      ...fixture.calendar,
      data: { ...fixture.calendar.data, event_start_ats: [...fixture.calendar.data.event_start_ats, "2027-01-01T00:00:00Z"] },
    });
    expect(await fetchUpcomingFromPage("https://luma.com/hack0", BEFORE_ALL)).toBeNull();
    serve({ ...fixture.calendar, data: { ...fixture.calendar.data, upcoming: { ...fixture.calendar.data.upcoming, has_more: true } } });
    expect(await fetchUpcomingFromPage("https://luma.com/hack0", BEFORE_ALL)).toBeNull();
  });

  test("a changed page shape returns null instead of an empty list", async () => {
    serve({ kind: "calendar", data: {} });
    expect(await fetchUpcomingFromPage("https://luma.com/hack0", BEFORE_ALL)).toBeNull();
  });

  test("an event page carries its description as markdown", async () => {
    serve(fixture.event);
    const event = await fetchEventPage("https://luma.com/5z2nzojb");
    expect(event?.name).toBe("Del dato a la nube: Introducción a SQL y AWS");
    expect(event?.description?.startsWith("¿Alguna vez te preguntaste")).toBe(true);
    expect(event?.description?.split("\n\n").length).toBeGreaterThan(1);
  });

  test("the page says what a short link is, and ids resolve from pages", async () => {
    serve(fixture.event);
    expect(await lumaPageKind("https://luma.com/5z2nzojb")).toBe("event");
    serve(fixture.calendar);
    expect(await lumaPageKind("https://luma.com/hack0")).toBe("calendar");
    expect(await resolveCalendarId("https://luma.com/hack0")).toBe(fixture.calendar.data.calendar.api_id);
    serve(fixture.profile);
    expect(await lumaPageKind("https://luma.com/user/theveller")).toBe("profile");
    expect(await resolveProfileId("https://luma.com/user/theveller")).toBe("usr-WCvZP6ABC54eywD");
  });

  test("rich text becomes markdown lists and headings", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Agenda" }] },
        {
          type: "bullet_list",
          content: [{ type: "list_item", content: [{ type: "paragraph", content: [{ type: "text", text: "SQL" }] }] }],
        },
        { type: "horizontal_rule" },
      ],
    };
    expect(proseToMarkdown(doc)).toBe("### Agenda\n\n- SQL");
  });
});
