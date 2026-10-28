import { listCalendars } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await authorize(request, "calendars:read");
  if ("denied" in auth) return auth.denied;
  return json({ calendars: await listCalendars() }, 200, auth.quota);
}
