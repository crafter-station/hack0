import { db } from "@/lib/db";
import { events, organizations, communityMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// This script assigns an event to a community and makes you the owner
// Usage: bun run scripts/init-community-for-event.ts <event-slug> <your-clerk-user-id>

const eventSlug = process.argv[2];
const userId = process.argv[3];

if (!eventSlug || !userId) {
  console.error("Usage: bun run scripts/init-community-for-event.ts <event-slug> <your-clerk-user-id>");
  console.error("Example: bun run scripts/init-community-for-event.ts hackaru-2025 user_xxxxx");
  process.exit(1);
}

async function main() {
  console.log(`🔍 Looking for event: ${eventSlug}`);

  // Find the event
  const event = await db.query.events.findFirst({
    where: eq(events.slug, eventSlug),
  });

  if (!event) {
    console.error(`❌ Event not found: ${eventSlug}`);
    process.exit(1);
  }

  console.log(`✅ Found event: ${event.name}`);

  // Check if event already has an organization
  if (event.organizationId) {
    console.log(`📋 Event already has organization: ${event.organizationId}`);

    // Check if user is already a member
    const existingMembership = await db.query.communityMembers.findFirst({
      where: eq(communityMembers.communityId, event.organizationId),
    });

    if (existingMembership) {
      console.log(`✅ You're already a member with role: ${existingMembership.role}`);
      process.exit(0);
    }

    // Add user as owner
    await db.insert(communityMembers).values({
      communityId: event.organizationId,
      userId,
      role: "owner",
    });

    console.log(`✅ Added you as owner of the community`);
    process.exit(0);
  }

  // Create a new organization for this event
  console.log(`📝 Creating new community for event...`);

  const [organization] = await db.insert(organizations).values({
    slug: `${eventSlug}-community`,
    name: `${event.name} Community`,
    displayName: event.organizerName || event.name,
    description: `Comunidad oficial de ${event.name}`,
    ownerUserId: userId,
    isPublic: true,
    isVerified: false,
  }).returning();

  console.log(`✅ Created community: ${organization.name}`);

  // Link event to organization
  await db.update(events)
    .set({ organizationId: organization.id })
    .where(eq(events.id, event.id));

  console.log(`✅ Linked event to community`);

  // Add user as owner
  await db.insert(communityMembers).values({
    communityId: organization.id,
    userId,
    role: "owner",
  });

  console.log(`✅ Added you as owner of the community`);
  console.log(`\n🎉 Done! You can now manage this event at /events/${eventSlug}/manage`);
}

main().catch(console.error);
