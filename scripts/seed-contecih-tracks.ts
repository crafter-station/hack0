import { db } from "../lib/db";
import { events, sponsors, type NewEvent, type NewSponsor } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const CONTECIH_PARENT_ID = "d4a96ca8-1fff-4ec8-8da8-d2f6045908ac";

async function seedContecihTracks() {
  console.log("Adding CONTECIH 2025 tracks (ejes temáticos)...");

  try {
    // 1. Update parent event with full description
    await db
      .update(events)
      .set({
        name: "V Congreso de Tecnología, Innovación y Habilidades para el Futuro – CONTECIH 2025",
        description: `Tenemos el agrado de invitar a la comunidad académica y profesional a participar en la quinta edición del CONTECIH, un evento organizado por IEEE Computer Society UTP en alianza con IEEE Computer Society UTEC, que reunirá conferencias y talleres especializados en áreas clave del desarrollo tecnológico actual.

Este año el congreso abordará tres ejes fundamentales:
- Ciberseguridad
- Desarrollo de Videojuegos
- Inteligencia Artificial

Evento gratuito + Certificado de participación opcional.
Dirigido a estudiantes de ingeniería y tecnología, docentes, investigadores, profesionales TI y miembros de la comunidad IEEE.`,
        startDate: new Date("2025-12-11T14:00:00"),
        endDate: new Date("2025-12-13T18:00:00"),
        format: "hybrid",
        registrationUrl: "https://luma.com/yq4yihj0",
        websiteUrl: "https://luma.com/yq4yihj0",
        organizerName: "IEEE Computer Society UTP & UTEC",
        organizerType: "student_org",
        isJuniorFriendly: true,
        isFeatured: true,
      })
      .where(eq(events.id, CONTECIH_PARENT_ID));

    console.log("Updated parent event");

    // 2. Check if tracks already exist
    const existingTracks = await db
      .select()
      .from(events)
      .where(eq(events.parentEventId, CONTECIH_PARENT_ID));

    if (existingTracks.length > 0) {
      console.log(`Tracks already exist (${existingTracks.length}), skipping creation...`);
      return;
    }

    // 3. Create child events (3 ejes temáticos)
    const trackEvents: NewEvent[] = [
      {
        slug: "contecih-2025-ciberseguridad",
        name: "CONTECIH 2025 - Eje: Ciberseguridad",
        description: `Eje temático de Ciberseguridad del V Congreso CONTECIH 2025.

Conferencias y talleres especializados en seguridad informática, ethical hacking, y protección de sistemas.

Sede: UTEC – Barranco`,
        eventType: "conference",
        parentEventId: CONTECIH_PARENT_ID,
        dayNumber: 1,
        startDate: new Date("2025-12-11T14:00:00"),
        endDate: new Date("2025-12-11T18:00:00"),
        format: "in-person",
        country: "PE",
        city: "Lima (UTEC Barranco)",
        timezone: "America/Lima",
        skillLevel: "intermediate",
        domains: ["cybersecurity"],
        websiteUrl: "https://luma.com/yq4yihj0",
        registrationUrl: "https://luma.com/yq4yihj0",
        organizerName: "IEEE Computer Society UTEC",
        organizerType: "student_org",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
      {
        slug: "contecih-2025-videojuegos",
        name: "CONTECIH 2025 - Eje: Desarrollo de Videojuegos",
        description: `Eje temático de Desarrollo de Videojuegos del V Congreso CONTECIH 2025.

Conferencias y talleres especializados en game development, engines, diseño de juegos y la industria gaming.

Modalidad: Virtual`,
        eventType: "conference",
        parentEventId: CONTECIH_PARENT_ID,
        dayNumber: 2,
        startDate: new Date("2025-12-12T17:00:00"),
        endDate: new Date("2025-12-12T20:00:00"),
        format: "virtual",
        country: "PE",
        timezone: "America/Lima",
        skillLevel: "all",
        domains: ["gaming"],
        websiteUrl: "https://luma.com/yq4yihj0",
        registrationUrl: "https://luma.com/yq4yihj0",
        organizerName: "IEEE Computer Society UTP",
        organizerType: "student_org",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
      {
        slug: "contecih-2025-inteligencia-artificial",
        name: "CONTECIH 2025 - Eje: Inteligencia Artificial",
        description: `Eje temático de Inteligencia Artificial del V Congreso CONTECIH 2025.

Conferencias y talleres especializados en machine learning, deep learning, LLMs y aplicaciones de IA.

Sede: UTP Lima Centro`,
        eventType: "conference",
        parentEventId: CONTECIH_PARENT_ID,
        dayNumber: 3,
        startDate: new Date("2025-12-13T14:30:00"),
        endDate: new Date("2025-12-13T18:00:00"),
        format: "in-person",
        country: "PE",
        city: "Lima (UTP Lima Centro)",
        timezone: "America/Lima",
        skillLevel: "intermediate",
        domains: ["ai"],
        websiteUrl: "https://luma.com/yq4yihj0",
        registrationUrl: "https://luma.com/yq4yihj0",
        organizerName: "IEEE Computer Society UTP",
        organizerType: "student_org",
        isJuniorFriendly: true,
        status: "upcoming",
        isApproved: true,
      },
    ];

    const insertedTracks = await db.insert(events).values(trackEvents).returning();
    console.log(`Created ${insertedTracks.length} track events`);

    // 4. Create sponsors
    const existingSponsors = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.eventId, CONTECIH_PARENT_ID));

    if (existingSponsors.length === 0) {
      const eventSponsors: NewSponsor[] = [
        {
          eventId: CONTECIH_PARENT_ID,
          name: "IEEE Computer Society UTP",
          websiteUrl: "https://www.utp.edu.pe",
          tier: "platinum",
          orderIndex: 0,
        },
        {
          eventId: CONTECIH_PARENT_ID,
          name: "IEEE Computer Society UTEC",
          websiteUrl: "https://utec.edu.pe",
          tier: "platinum",
          orderIndex: 1,
        },
        {
          eventId: CONTECIH_PARENT_ID,
          name: "UTP",
          websiteUrl: "https://www.utp.edu.pe",
          tier: "gold",
          orderIndex: 0,
        },
        {
          eventId: CONTECIH_PARENT_ID,
          name: "UTEC",
          websiteUrl: "https://utec.edu.pe",
          tier: "gold",
          orderIndex: 1,
        },
      ];

      const insertedSponsors = await db.insert(sponsors).values(eventSponsors).returning();
      console.log(`Created ${insertedSponsors.length} sponsors`);
    }

    console.log("\nCONTECIH 2025 tracks seeding complete!");
    console.log(`Tracks: ${insertedTracks.map(t => t.slug).join(", ")}`);

  } catch (error) {
    console.error("Error seeding CONTECIH tracks:", error);
    throw error;
  }
}

// Run if executed directly
seedContecihTracks()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
