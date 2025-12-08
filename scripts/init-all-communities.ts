import { db } from "@/lib/db";
import { events, organizations, communityMembers } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

// This script creates communities for all events and makes you the owner
// Usage: bun run scripts/init-all-communities.ts <your-clerk-user-id>

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: bun run scripts/init-all-communities.ts <your-clerk-user-id>");
  console.error("Example: bun run scripts/init-all-communities.ts user_xxxxx");
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .trim();
}

async function main() {
  console.log(`🔍 Finding all events without organizations...`);

  // Get all events without organizationId
  const eventsWithoutOrg = await db.query.events.findMany({
    where: isNull(events.organizationId),
  });

  console.log(`📋 Found ${eventsWithoutOrg.length} events without organizations`);

  const organizationMap = new Map<string, string>(); // organizerName -> organizationId

  for (const event of eventsWithoutOrg) {
    const organizerName = event.organizerName || event.name;
    console.log(`\n📝 Processing: ${event.name}`);
    console.log(`   Organizer: ${organizerName}`);

    let organizationId: string;

    // Check if we already created an org for this organizer
    if (organizationMap.has(organizerName)) {
      organizationId = organizationMap.get(organizerName)!;
      console.log(`   ♻️  Using existing community: ${organizerName}`);
    } else {
      // Check if org already exists in DB
      const slug = slugify(organizerName);
      const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
      });

      if (existingOrg) {
        organizationId = existingOrg.id;
        console.log(`   ♻️  Found existing community: ${existingOrg.name}`);
      } else {
        // Create new organization
        const [newOrg] = await db.insert(organizations).values({
          slug,
          name: organizerName,
          displayName: organizerName,
          description: `Comunidad oficial de ${organizerName}`,
          ownerUserId: userId,
          type: event.organizerType || "community",
          websiteUrl: event.organizerUrl || event.websiteUrl,
          isPublic: true,
          isVerified: false,
        }).returning();

        organizationId = newOrg.id;
        console.log(`   ✅ Created community: ${newOrg.name}`);

        // Add user as owner
        await db.insert(communityMembers).values({
          communityId: organizationId,
          userId,
          role: "owner",
        });

        console.log(`   ✅ Added you as owner`);
      }

      organizationMap.set(organizerName, organizationId);
    }

    // Link event to organization
    await db.update(events)
      .set({ organizationId })
      .where(eq(events.id, event.id));

    console.log(`   🔗 Linked event to community`);
  }

  // Also make sure user is owner of all existing organizations
  console.log(`\n🔍 Checking existing organizations...`);
  const allOrgs = await db.query.organizations.findMany();

  for (const org of allOrgs) {
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, org.id),
        eq(communityMembers.userId, userId)
      ),
    });

    if (!membership) {
      await db.insert(communityMembers).values({
        communityId: org.id,
        userId,
        role: "owner",
      });
      console.log(`✅ Added you as owner of: ${org.name}`);
    } else {
      console.log(`✓ Already owner of: ${org.name}`);
    }
  }

  console.log(`\n🎉 Done! All events now have communities and you're the owner.`);
  console.log(`\nSummary:`);
  console.log(`- Created ${organizationMap.size} new communities`);
  console.log(`- Processed ${eventsWithoutOrg.length} events`);
  console.log(`- You're now owner of ${allOrgs.length} total communities`);
}

main().catch(console.error);
