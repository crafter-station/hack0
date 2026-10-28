import { listCalendars } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request) {
  const denied = await authorize(request, "calendars:read");
  if (denied) return denied;
  return json({ calendars: await listCalendars() });
}
