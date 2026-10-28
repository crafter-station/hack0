import { getEvent } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorize(request, "events:read");
  if (denied) return denied;
  const event = await getEvent((await params).id);
  return event ? json({ event }) : json({ error: "Event not found" }, 404);
}
