import { inArray } from "drizzle-orm";
import { start } from "workflow/api";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { dueSources } from "@/lib/ingest/sources";
import { syncAll } from "@/workflows/sync-source";

/** Vercel Cron entry point: per provider, one workflow walks its due sources in turn. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDb();
  const due = await dueSources(db);
  if (due.length > 0) {
    await db
      .update(sources)
      .set({ syncStatus: "queued" })
      .where(
        inArray(
          sources.id,
          due.map((s) => s.id),
        ),
      );
  }
  // One sequential run per provider: no burst against any host, and a rate-limited provider cannot hold up the others.
  const byProvider = Map.groupBy(due, (s) => s.provider);
  const runs = await Promise.all([...byProvider.values()].map((group) => start(syncAll, [group.map((s) => s.id)])));
  return Response.json({ sources: due.length, runIds: runs.map((r) => r.runId) });
}
