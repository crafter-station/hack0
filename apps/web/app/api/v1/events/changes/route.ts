import { listChanges } from "@/lib/api/events";
import { authorize, json } from "@/lib/api/http";

/** Incremental sync: pass the last `nextCursor` as `since` (0 for everything). */
export async function GET(request: Request) {
  const auth = await authorize(request, "events:read");
  if ("denied" in auth) return auth.denied;
  const params = new URL(request.url).searchParams;
  const since = params.get("since") ?? "0";
  if (!/^\d+$/.test(since)) return json({ error: "since must be the numeric cursor a previous call returned" }, 400, auth.quota);
  return json(await listChanges(Number(since), Number(params.get("limit") ?? undefined)), 200, auth.quota);
}
