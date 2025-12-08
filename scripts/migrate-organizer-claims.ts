import { db } from "@/lib/db";
import { organizerClaims, eventOrganizers, events, communityMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function migrateOrganizerClaims() {
  console.log("🔄 Starting migration of organizer claims to eventOrganizers...\n");

  // Fetch all approved organizer claims
  const approvedClaims = await db
    .select()
    .from(organizerClaims)
    .where(eq(organizerClaims.status, "approved"));

  console.log(`📊 Found ${approvedClaims.length} approved organizer claims\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const claim of approvedClaims) {
    try {
      // Get the event to check if it has an organizationId
      const event = await db.query.events.findFirst({
        where: eq(events.id, claim.eventId),
      });

      if (!event) {
        console.log(`⚠️  Event not found for claim ${claim.id}, skipping...`);
        skipped++;
        continue;
      }

      if (!event.organizationId) {
        console.log(`⚠️  Event "${event.name}" has no organizationId, skipping claim ${claim.id}...`);
        skipped++;
        continue;
      }

      // Check if user is already a community member
      const membership = await db.query.communityMembers.findFirst({
        where: and(
          eq(communityMembers.communityId, event.organizationId),
          eq(communityMembers.userId, claim.userId)
        ),
      });

      // If not a member, add them as a member first
      if (!membership) {
        console.log(`  👤 Adding ${claim.userId} as community member...`);
        await db.insert(communityMembers).values({
          communityId: event.organizationId,
          userId: claim.userId,
          role: "member",
          invitedBy: null, // Auto-migrated from organizer claim
        });
      }

      // Check if already an event organizer
      const existing = await db.query.eventOrganizers.findFirst({
        where: and(
          eq(eventOrganizers.eventId, claim.eventId),
          eq(eventOrganizers.userId, claim.userId)
        ),
      });

      if (existing) {
        console.log(`  ⏭️  User ${claim.userId} already organizer for event "${event.name}", skipping...`);
        skipped++;
        continue;
      }

      // Create event organizer with "lead" role (since they were verified organizers)
      await db.insert(eventOrganizers).values({
        eventId: claim.eventId,
        userId: claim.userId,
        role: "lead",
      });

      console.log(`  ✅ Migrated claim ${claim.id} → User ${claim.userId} is now lead organizer for "${event.name}"`);
      migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrating claim ${claim.id}:`, error);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✨ Migration complete!`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log("=".repeat(60) + "\n");
}

migrateOrganizerClaims()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
