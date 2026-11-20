import sitemap from "@/app/sitemap";
import { SITE } from "@/lib/site";

// IndexNow tells Bing (whose index feeds ChatGPT and Copilot search) and the other engines which URLs changed.
// The key is public by design: engines check it against public/<key>.txt, which must keep the same value.
const KEY = "41201a99b33d43586e1d2f368ed81771";
const WINDOW_DAYS = 3;

/** Vercel Cron: submits sitemap URLs modified in the last few days. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const urls = (await sitemap())
    .filter((entry) => entry.lastModified && new Date(entry.lastModified).getTime() >= cutoff)
    .map((entry) => entry.url);
  if (urls.length === 0) return Response.json({ submitted: 0 });

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
  });
  return Response.json({ submitted: urls.length, status: res.status }, { status: res.ok ? 200 : 502 });
}
