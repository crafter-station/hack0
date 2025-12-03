import { db } from "../lib/db";
import { events, sponsors, type NewEvent, type NewSponsor } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function seedJakumbre() {
  console.log("Seeding JAKUMBRE 2025 event with child events and sponsors...");

  try {
    // Check if parent event already exists
    const existingParent = await db
      .select()
      .from(events)
      .where(eq(events.slug, "jakumbre-2025"))
      .limit(1);

    if (existingParent.length > 0) {
      console.log("JAKUMBRE 2025 already exists, skipping...");
      return;
    }

    // 1. Create parent event (JAKUMBRE 2025 - IV Cumbre)
    const parentEvent: NewEvent = {
      slug: "jakumbre-2025",
      name: "JAKUMBRE 2025 - IV Cumbre de Emprendimiento e Innovación Universitaria",
      description: `Tres días para aprender, conectar y conocer de cerca cómo la innovación, la tecnología y el emprendimiento están transformando Arequipa y el Perú.

Cada día se vive en una sede distinta, con enfoque en áreas clave del ecosistema:
- Día 1: Área de Biomédicas
- Día 2: Área de Ingenierías
- Día 3: Área de Sociales

Arequipa necesita más eventos como estos. De nosotros depende el éxito de nuestro ecosistema emprendedor.`,
      eventType: "conference",
      startDate: new Date("2025-12-03T09:00:00"),
      endDate: new Date("2025-12-05T13:30:00"),
      format: "in-person",
      country: "PE",
      city: "Arequipa",
      timezone: "America/Lima",
      skillLevel: "all",
      domains: ["general", "social-impact", "healthtech"],
      prizePool: null,
      websiteUrl: "https://lnkd.in/euH26nTY",
      registrationUrl: "https://lnkd.in/euH26nTY",
      organizerName: "JAKU Emprende UNSA + VRI + Parque Científico Tecnológico",
      organizerType: "university",
      organizerUrl: "https://www.unsa.edu.pe",
      isJuniorFriendly: true,
      status: "upcoming",
      isFeatured: true,
      isApproved: true,
    };

    const [insertedParent] = await db.insert(events).values(parentEvent).returning();
    console.log(`Created parent event: ${insertedParent.name} (${insertedParent.id})`);

    // 2. Create child events (3 days)
    const childEvents: NewEvent[] = [
      {
        slug: "jakumbre-2025-dia-1-biomedicas",
        name: "JAKUMBRE - Día 1: Área de Biomédicas",
        description: `La cumbre inicia con una jornada dedicada a las áreas de biomédicas, donde se presentarán perspectivas sobre innovación en salud y un panel de experiencias donde startups especializadas en biotecnología y salud presentan cómo están llevando sus proyectos desde el laboratorio hacia el impacto real.`,
        eventType: "conference",
        parentEventId: insertedParent.id,
        dayNumber: 1,
        startDate: new Date("2025-12-03T09:00:00"),
        endDate: new Date("2025-12-03T12:00:00"),
        format: "in-person",
        country: "PE",
        city: "Arequipa",
        timezone: "America/Lima",
        skillLevel: "all",
        domains: ["healthtech", "biotech"],
        websiteUrl: "https://luma.com/c19gpm00",
        registrationUrl: "https://luma.com/c19gpm00",
        organizerName: "JAKU Emprende UNSA",
        organizerType: "university",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
      {
        slug: "jakumbre-2025-dia-2-ingenierias",
        name: "JAKUMBRE - Día 2: Área de Ingenierías",
        description: `El segundo día reúne a la comunidad de ingenierías para explorar cómo convertir soluciones técnicas en empresas reales desde la ingeniería.

Se abordarán tendencias, retos y casos destacados, impulsando el intercambio entre especialistas y proyectos en desarrollo.`,
        eventType: "conference",
        parentEventId: insertedParent.id,
        dayNumber: 2,
        startDate: new Date("2025-12-04T08:30:00"),
        endDate: new Date("2025-12-04T11:30:00"),
        format: "in-person",
        country: "PE",
        city: "Arequipa",
        timezone: "America/Lima",
        skillLevel: "all",
        domains: ["general", "robotics"],
        websiteUrl: "https://luma.com/8mauyn2j",
        registrationUrl: "https://luma.com/8mauyn2j",
        organizerName: "JAKU Emprende UNSA",
        organizerType: "university",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
      {
        slug: "jakumbre-2025-dia-3-sociales",
        name: "JAKUMBRE - Día 3: Área de Sociales",
        description: `La tercera jornada pone en valor el rol de la comunidad emprendedora, resaltando nuevas tendencias, aprendizajes y experiencias que fortalecen el ecosistema.

Una conferencia magistral introduce la importancia del trabajo colaborativo, seguida de un panel con especialistas y un Demo Pitch Flash presenta startups locales.`,
        eventType: "conference",
        parentEventId: insertedParent.id,
        dayNumber: 3,
        startDate: new Date("2025-12-05T08:30:00"),
        endDate: new Date("2025-12-05T12:30:00"),
        format: "in-person",
        country: "PE",
        city: "Arequipa",
        timezone: "America/Lima",
        skillLevel: "all",
        domains: ["social-impact", "general"],
        websiteUrl: "https://luma.com/ff0fxzdb",
        registrationUrl: "https://luma.com/ff0fxzdb",
        organizerName: "JAKU Emprende UNSA",
        organizerType: "university",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
    ];

    const insertedChildren = await db.insert(events).values(childEvents).returning();
    console.log(`Created ${insertedChildren.length} child events`);

    // 3. Create sponsors
    const eventSponsors: NewSponsor[] = [
      {
        eventId: insertedParent.id,
        name: "UNSA",
        websiteUrl: "https://www.unsa.edu.pe",
        tier: "platinum",
        orderIndex: 0,
      },
      {
        eventId: insertedParent.id,
        name: "Vicerrectorado de Investigación UNSA",
        websiteUrl: "https://vri.unsa.edu.pe",
        tier: "gold",
        orderIndex: 0,
      },
      {
        eventId: insertedParent.id,
        name: "Parque Científico Tecnológico",
        websiteUrl: "https://www.unsa.edu.pe",
        tier: "gold",
        orderIndex: 1,
      },
      {
        eventId: insertedParent.id,
        name: "JAKU Emprende UNSA",
        websiteUrl: "https://luma.com/jaku-emprende-unsa",
        tier: "partner",
        orderIndex: 0,
      },
    ];

    const insertedSponsors = await db.insert(sponsors).values(eventSponsors).returning();
    console.log(`Created ${insertedSponsors.length} sponsors`);

    console.log("\nJAKUMBRE 2025 seeding complete!");
    console.log(`Parent event: ${insertedParent.slug}`);
    console.log(`Child events: ${insertedChildren.map(c => c.slug).join(", ")}`);

  } catch (error) {
    console.error("Error seeding JAKUMBRE:", error);
    throw error;
  }
}

// Run if executed directly
seedJakumbre()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
