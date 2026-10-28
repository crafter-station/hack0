import { inArray } from "drizzle-orm";
import { start } from "workflow/api";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { dueSources } from "@/lib/ingest/sources";
import { syncSource } from "@/workflows/sync-source";

/** Vercel Cron entry point: starts one sync workflow per due source. */
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
  const runs = await Promise.all(due.map((s) => start(syncSource, [s.id])));
  return Response.json({ started: runs.length, runIds: runs.map((r) => r.runId) });
}
