import { listEvents, parseEventQuery } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await authorize(request, "events:read");
  if ("denied" in auth) return auth.denied;
  return json(await listEvents(parseEventQuery(new URL(request.url).searchParams)), 200, auth.quota);
}
