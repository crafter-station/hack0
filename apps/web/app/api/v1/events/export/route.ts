import { exportEvents, parseEventQuery } from "@/lib/api/events";
import { authorize } from "@/lib/api/http";

/** The whole filtered catalog as one file: `?format=csv` (default) or `?format=json`, with the same filters as /events. */
export async function GET(request: Request) {
  const auth = await authorize(request, "events:read");
  if ("denied" in auth) return auth.denied;
  const params = new URL(request.url).searchParams;
  const format = params.get("format") === "json" ? "json" : "csv";
  const body = await exportEvents(parseEventQuery(params), format);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      ...auth.quota,
      "content-type": format === "json" ? "application/json" : "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="hack0-events-${date}.${format}"`,
      "cache-control": "no-store",
    },
  });
}
