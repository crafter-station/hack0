import { db } from "../lib/db";
import { events, sponsors, type NewSponsor } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function updateJakumbreSponsors() {
  console.log("Updating JAKUMBRE 2025 sponsors...");

  try {
    // Get JAKUMBRE parent event
    const [jakumbre] = await db
      .select()
      .from(events)
      .where(eq(events.slug, "jakumbre-2025"))
      .limit(1);

    if (!jakumbre) {
      console.error("JAKUMBRE 2025 not found!");
      return;
    }

    console.log(`Found JAKUMBRE: ${jakumbre.id}`);

    // Delete existing sponsors
    await db.delete(sponsors).where(eq(sponsors.eventId, jakumbre.id));
    console.log("Deleted existing sponsors");

    // Create correct sponsors based on the image
    const eventSponsors: NewSponsor[] = [
      {
        eventId: jakumbre.id,
        name: "UNSA - Universidad Nacional de San Agustín de Arequipa",
        websiteUrl: "https://www.unsa.edu.pe",
        tier: "platinum",
        orderIndex: 0,
      },
      {
        eventId: jakumbre.id,
        name: "VRI - Vicerrectorado de Investigación",
        websiteUrl: "https://vri.unsa.edu.pe",
        tier: "gold",
        orderIndex: 0,
      },
      {
        eventId: jakumbre.id,
        name: "DIE - Dirección de Incubadora de Empresas",
        websiteUrl: "https://www.unsa.edu.pe",
        tier: "gold",
        orderIndex: 1,
      },
      {
        eventId: jakumbre.id,
        name: "Parque Científico Tecnológico UNSA",
        websiteUrl: "https://www.unsa.edu.pe",
        tier: "gold",
        orderIndex: 2,
      },
      {
        eventId: jakumbre.id,
        name: "JAKU Emprende UNSA",
        websiteUrl: "https://luma.com/jaku-emprende-unsa",
        tier: "partner",
        orderIndex: 0,
      },
    ];

    const insertedSponsors = await db.insert(sponsors).values(eventSponsors).returning();
    console.log(`Created ${insertedSponsors.length} sponsors:`);
    insertedSponsors.forEach(s => console.log(`  - ${s.name} (${s.tier})`));

    console.log("\nJAKUMBRE sponsors updated!");

  } catch (error) {
    console.error("Error updating sponsors:", error);
    throw error;
  }
}

// Run if executed directly
updateJakumbreSponsors()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
