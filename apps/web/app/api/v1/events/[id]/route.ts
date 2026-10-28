import { getEvent } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, "events:read");
  if ("denied" in auth) return auth.denied;
  const event = await getEvent((await params).id);
  return event ? json({ event }, 200, auth.quota) : json({ error: "Event not found" }, 404, auth.quota);
}
