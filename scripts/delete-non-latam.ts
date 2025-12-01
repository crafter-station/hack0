import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { notInArray, isNull, or } from "drizzle-orm";

// Solo mantener Peru
const ALLOWED_CODES = ["PE"];

async function deleteNonPeruEvents() {
  console.log("🔍 Finding non-Peru events...\n");
  console.log(`Allowed codes: ${ALLOWED_CODES.join(", ")}\n`);

  // Find events that are NOT PE/GLOBAL/LATAM
  const nonPeruEvents = await db
    .select({
      id: events.id,
      name: events.name,
      country: events.country,
    })
    .from(events)
    .where(
      or(
        notInArray(events.country, ALLOWED_CODES),
        isNull(events.country)
      )
    );

  if (nonPeruEvents.length === 0) {
    console.log("✅ No non-Peru events found. All good!");
    return;
  }

  console.log(`Found ${nonPeruEvents.length} non-Peru events:\n`);

  for (const event of nonPeruEvents) {
    console.log(`  - ${event.name} (${event.country || "NULL"})`);
  }

  console.log("\n🗑️  Deleting...\n");

  const deleted = await db
    .delete(events)
    .where(
      or(
        notInArray(events.country, ALLOWED_CODES),
        isNull(events.country)
      )
    )
    .returning({ id: events.id, name: events.name });

  console.log(`✅ Deleted ${deleted.length} events`);
}

deleteNonPeruEvents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
