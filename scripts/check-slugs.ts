import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { isNull, or } from "drizzle-orm";

async function checkSlugs() {
  const allEvents = await db.select().from(events);

  console.log(`Total events: ${allEvents.length}\n`);

  // Check for null slugs or names
  const problematic = allEvents.filter(e => !e.slug || !e.name);
  console.log(`❌ Events missing slug or name: ${problematic.length}`);
  if (problematic.length > 0) {
    console.log(problematic.map(e => `  - ${e.name || 'NO NAME'} (slug: ${e.slug || 'NO SLUG'})`).join('\n'));
  }

  // Check for spaces in slugs
  const slugsWithSpaces = allEvents.filter(e => e.slug && e.slug.includes(' '));
  console.log(`\n❌ Slugs with spaces: ${slugsWithSpaces.length}`);
  if (slugsWithSpaces.length > 0) {
    console.log(slugsWithSpaces.map(e => `  - "${e.slug}"`).join('\n'));
  }

  // Check for uppercase in slugs
  const slugsWithUpper = allEvents.filter(e => e.slug && e.slug !== e.slug.toLowerCase());
  console.log(`\n❌ Slugs with uppercase: ${slugsWithUpper.length}`);
  if (slugsWithUpper.length > 0) {
    console.log(slugsWithUpper.map(e => `  - "${e.slug}" → should be "${e.slug.toLowerCase()}"`).join('\n'));
  }

  // Check for special characters (not a-z0-9-)
  const slugsWithSpecial = allEvents.filter(e => {
    if (!e.slug) return false;
    return /[^a-z0-9-]/.test(e.slug);
  });
  console.log(`\n❌ Slugs with special chars: ${slugsWithSpecial.length}`);
  if (slugsWithSpecial.length > 0) {
    console.log(slugsWithSpecial.map(e => `  - "${e.slug}"`).join('\n'));
  }

  // Check for duplicate slugs
  const slugCounts = new Map<string, number>();
  allEvents.forEach(e => {
    if (e.slug) {
      slugCounts.set(e.slug, (slugCounts.get(e.slug) || 0) + 1);
    }
  });
  const duplicates = Array.from(slugCounts.entries()).filter(([_, count]) => count > 1);
  console.log(`\n❌ Duplicate slugs: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log(duplicates.map(([slug, count]) => `  - "${slug}" (${count} times)`).join('\n'));
  }

  // Summary
  const hasIssues = problematic.length > 0 || slugsWithSpaces.length > 0 ||
                    slugsWithUpper.length > 0 || slugsWithSpecial.length > 0 ||
                    duplicates.length > 0;

  console.log(`\n${hasIssues ? '⚠️  Issues found!' : '✅ All slugs look good!'}`);
}

checkSlugs().then(() => process.exit(0)).catch(console.error);
