import { start } from "workflow/api";
import { generateContent, publishCurated } from "@/workflows/publish";

/** Vercel Cron: refreshes content drafts, and pushes curated events to Luma when that is switched on. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const content = await start(generateContent, [new Date()]);
  const publish = process.env.HACK0_PUBLISH_TO_LUMA === "true" ? await start(publishCurated, []) : null;
  return Response.json({ contentRun: content.runId, publishRun: publish?.runId ?? null });
}
