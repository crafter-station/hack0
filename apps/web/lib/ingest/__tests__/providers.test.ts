import { afterEach, describe, expect, test } from "bun:test";
import { fetchPublicMeetupGroupSnapshot, fetchPublicProviderEvent, fetchPublicProviderSnapshot } from "../providers";

const originalFetch = globalThis.fetch;

/** Types a stub as `fetch` without a double cast; tests only call it. */
function asFetch(fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>): typeof fetch {
  return Object.assign(fn, { preconnect: originalFetch.preconnect });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("public provider fetchers", () => {
  test("imports public Eventbrite JSON-LD without requiring Firecrawl", async () => {
    globalThis.fetch = asFetch(
      async () =>
        new Response(
          `<script type="application/ld+json">${JSON.stringify({
            "@type": "Event",
            name: "Public Launch",
            startDate: "2026-09-10T18:00:00-05:00",
            endDate: "2026-09-10T20:00:00-05:00",
            url: "https://www.eventbrite.com/e/public-launch-tickets-123456789",
            image: "https://example.com/cover.png",
            organizer: { name: "Builders" },
            location: { address: { addressLocality: "Lima" } },
          })}</script>`,
          { headers: { "content-type": "text/html" } },
        ),
    );

    const event = await fetchPublicProviderEvent("eventbrite", "https://www.eventbrite.com/e/public-launch-tickets-123456789");
    expect(event.externalId).toBe("123456789");
    expect(event.event).toMatchObject({
      name: "Public Launch",
      city: "Lima",
      startAt: "2026-09-10T18:00:00-05:00",
    });
  });

  test("maintenance accepts a readable source with no events inside the lookback", async () => {
    globalThis.fetch = asFetch(
      async () =>
        new Response(
          `<script type="application/ld+json">${JSON.stringify({
            "@type": "Event",
            name: "Old launch",
            startDate: "2024-01-01T18:00:00Z",
            url: "https://www.eventbrite.com/e/old-launch-tickets-123456789",
          })}</script>`,
          { headers: { "content-type": "text/html" } },
        ),
    );

    const snapshot = await fetchPublicProviderSnapshot("eventbrite", "https://www.eventbrite.com/e/old-launch-tickets-123456789", 80, {
      after: "2026-01-01T00:00:00Z",
    });

    expect(snapshot.events).toEqual([]);
    expect(snapshot.readableCount).toBe(1);
    expect(snapshot.complete).toBe(true);
  });

  test("paginates public Meetup history and upcoming events without Firecrawl", async () => {
    const node = (id: string, status: "ACTIVE" | "PAST") => ({
      id,
      title: `Meetup ${id}`,
      eventUrl: `https://www.meetup.com/coders/events/${id}/`,
      description: `Description ${id}`,
      dateTime: status === "ACTIVE" ? "2026-09-01T18:00:00-05:00" : "2025-09-01T18:00:00-05:00",
      endTime: status === "ACTIVE" ? "2026-09-01T20:00:00-05:00" : "2025-09-01T20:00:00-05:00",
      status,
      eventHosts: [{ memberId: "host-1", name: "Host" }],
      featuredEventPhoto: {
        id: `photo-${id}`,
        baseUrl: "https://secure-content.meetupstatic.com/images/classic-events/",
        highResUrl: `https://example.com/${id}.jpg`,
      },
      venue: { name: "Venue", city: "Lima", state: "Lima", country: "pe" },
      group: { id: "group-1", name: "Coders", urlname: "coders" },
    });
    globalThis.fetch = asFetch(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        variables: {
          after: string | null;
          afterDateTime: string | null;
          beforeDateTime: string | null;
        };
      };
      const upcoming = Boolean(request.variables.afterDateTime);
      const secondPastPage = request.variables.after === "past-cursor";
      const events = upcoming
        ? {
            totalCount: 1,
            pageInfo: { endCursor: null, hasNextPage: false },
            edges: [{ node: node("upcoming-1", "ACTIVE") }],
          }
        : secondPastPage
          ? {
              totalCount: 2,
              pageInfo: { endCursor: null, hasNextPage: false },
              edges: [{ node: node("past-2", "PAST") }],
            }
          : {
              totalCount: 2,
              pageInfo: { endCursor: "past-cursor", hasNextPage: true },
              edges: [{ node: node("past-1", "PAST") }],
            };
      return new Response(
        JSON.stringify({
          data: {
            groupByUrlname: {
              id: "group-1",
              name: "Coders",
              description: "A public group",
              keyGroupPhoto: { highResUrl: "https://example.com/group.jpg" },
              events,
            },
          },
        }),
        { headers: { "content-type": "application/json" } },
      );
    });

    const snapshot = await fetchPublicMeetupGroupSnapshot("https://www.meetup.com/Coders?tracking=1", 2000, { kind: "full" });

    expect(snapshot).toMatchObject({
      name: "Coders",
      complete: true,
      discoveredCount: 3,
      readableCount: 3,
      sourceMethod: "provider_public_graphql",
    });
    expect(snapshot.events.map((event) => event.externalId).sort()).toEqual(["past-1", "past-2", "upcoming-1"]);
    expect(snapshot.events[0]?.event).toMatchObject({
      coverUrl: "https://example.com/upcoming-1.jpg",
      city: "Lima",
    });
  });

  test("does not mark complete Meetup pagination as partial because of cancelled events", async () => {
    globalThis.fetch = asFetch(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        variables: { afterDateTime: string | null };
      };
      const upcoming = Boolean(request.variables.afterDateTime);
      const node = upcoming
        ? {
            id: "upcoming-1",
            title: "Upcoming",
            eventUrl: "https://www.meetup.com/coders/events/upcoming-1/",
            dateTime: "2026-09-01T18:00:00Z",
            status: "ACTIVE",
          }
        : {
            id: "past-cancelled",
            title: "Cancelled",
            eventUrl: "https://www.meetup.com/coders/events/past-cancelled/",
            dateTime: "2025-09-01T18:00:00Z",
            status: "CANCELLED",
          };
      return new Response(
        JSON.stringify({
          data: {
            groupByUrlname: {
              id: "group-1",
              name: "Coders",
              events: {
                totalCount: 1,
                pageInfo: { endCursor: null, hasNextPage: false },
                edges: [{ node }],
              },
            },
          },
        }),
        { headers: { "content-type": "application/json" } },
      );
    });

    const snapshot = await fetchPublicMeetupGroupSnapshot("https://www.meetup.com/coders", null, {
      kind: "full",
    });

    expect(snapshot.complete).toBe(true);
    expect(snapshot.discoveredCount).toBe(2);
    expect(snapshot.readableCount).toBe(1);
    expect(snapshot.cancelledCount).toBe(1);
    expect(snapshot.events).toHaveLength(1);
  });
});
