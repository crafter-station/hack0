import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getEvent, listCalendars, listEvents, parseEventQuery } from "@/lib/api/events";
import { verifyToken } from "@/lib/api/tokens";

const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

const mcp = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_events",
      {
        title: "List events",
        description: "Tech events in the hack0 catalog (LATAM hackathons, meetups, workshops, conferences), filtered and paginated.",
        inputSchema: z.object({
          status: z.enum(["all", "upcoming", "past"]).default("upcoming"),
          country: z.string().length(2).optional().describe("ISO 3166-1 alpha-2, e.g. PE"),
          provider: z.enum(["luma", "eventbrite", "meetup"]).optional(),
          from: z.string().optional().describe("ISO date, inclusive lower bound on startAt"),
          to: z.string().optional().describe("ISO date, inclusive upper bound on startAt"),
          limit: z.number().int().min(1).max(200).default(25),
          cursor: z.string().optional(),
        }),
      },
      async (args) => {
        const params = new URLSearchParams(Object.entries(args).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]])));
        return text(await listEvents(parseEventQuery(params)));
      },
    );
    server.registerTool(
      "get_event",
      {
        title: "Get event",
        description: "One event with every source that lists it, by canonical id or Luma event id (evt-...).",
        inputSchema: z.object({ id: z.string() }),
      },
      async ({ id }) => text((await getEvent(id)) ?? { error: "Event not found" }),
    );
    server.registerTool(
      "list_calendars",
      { title: "List calendars", description: "Sources the catalog syncs, with event counts and sync state.", inputSchema: z.object({}) },
      async () => text({ calendars: await listCalendars() }),
    );
  },
  { serverInfo: { name: "hack0", version: "1.0.0" } },
);

/** Same `hack0_sk_` tokens as the REST API. */
const handler = withMcpAuth(
  mcp,
  async (_req, token) => {
    const row = await verifyToken(token);
    return row ? { token: token ?? "", clientId: row.id, scopes: row.scopes } : undefined;
  },
  { required: true },
);

export { handler as GET, handler as POST };
