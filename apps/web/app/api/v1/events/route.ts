import { listEvents, parseEventQuery } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request) {
  const denied = await authorize(request, "events:read");
  if (denied) return denied;
  return json(await listEvents(parseEventQuery(new URL(request.url).searchParams)));
}
