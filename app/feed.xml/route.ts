import { Feed } from "feed";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";

const SITE_URL = "https://hack0.dev";

export async function GET() {
  const feed = new Feed({
    title: "hack0.dev - Eventos Tech en Perú",
    description: "Hackathons, conferencias, workshops y eventos tech en Perú",
    id: SITE_URL,
    link: SITE_URL,
    language: "es",
    image: `${SITE_URL}/og-image.png`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `hack0.dev ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${SITE_URL}/feed.xml`,
    },
    author: {
      name: "hack0.dev",
      link: SITE_URL,
    },
  });

  // Get active events (ongoing, open, upcoming) - exclude ended
  const activeEvents = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isApproved, true),
        // Exclude ended events (endDate >= now OR endDate is null)
        or(
          sql`${events.endDate} IS NULL`,
          sql`${events.endDate} >= NOW()`
        )
      )
    )
    .orderBy(desc(events.createdAt))
    .limit(50);

  for (const event of activeEvents) {
    const eventUrl = `${SITE_URL}/${event.slug}`;

    // Truncate description to 500 chars
    const description = event.description
      ? event.description.length > 500
        ? `${event.description.slice(0, 497)}...`
        : event.description
      : `${event.name} - Evento tech en Perú`;

    feed.addItem({
      title: event.name,
      id: eventUrl,
      link: eventUrl,
      description,
      date: event.createdAt ?? new Date(),
      image: event.eventImageUrl ?? undefined,
      author: event.organizerName
        ? [{ name: event.organizerName }]
        : undefined,
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
