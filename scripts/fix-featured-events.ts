import { db } from "../lib/db";
import { events } from "../lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";

async function fixFeaturedEvents() {
  console.log("Fixing featured/sponsored events...");

  try {
    // Find all events with "congreso" or "contecih" or "jakumbre" in name
    const toFix = await db
      .select({ id: events.id, slug: events.slug, name: events.name, isFeatured: events.isFeatured })
      .from(events)
      .where(
        or(
          ilike(events.name, '%congreso%'),
          ilike(events.name, '%contecih%'),
          ilike(events.name, '%jakumbre%')
        )
      );

    console.log("Found events to check:");
    toFix.forEach(e => console.log(`  - ${e.slug}: isFeatured=${e.isFeatured}`));

    // Remove isFeatured from all of them
    for (const event of toFix) {
      if (event.isFeatured) {
        await db
          .update(events)
          .set({ isFeatured: false })
          .where(eq(events.id, event.id));
        console.log(`✓ Removed sponsored from: ${event.slug}`);
      }
    }

    // Verify IA Hackathon Peru is still featured
    const iaHackathon = await db
      .select({ name: events.name, isFeatured: events.isFeatured })
      .from(events)
      .where(eq(events.slug, "ia-hackathon-peru-2025"));

    if (iaHackathon[0]) {
      console.log(`\n✓ IA Hackathon Peru - isFeatured: ${iaHackathon[0].isFeatured}`);
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

fixFeaturedEvents()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
