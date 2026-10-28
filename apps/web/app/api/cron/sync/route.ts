import { inArray } from "drizzle-orm";
import { start } from "workflow/api";
import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import { dueSources } from "@/lib/ingest/sources";
import { syncAll } from "@/workflows/sync-source";

/** Vercel Cron entry point: one workflow walks every due source in turn. */
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
  const run = due.length > 0 ? await start(syncAll, [due.map((s) => s.id)]) : null;
  return Response.json({ sources: due.length, runId: run?.runId ?? null });
}
