import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	eventHostOrganizations,
	eventSponsors,
	events,
	organizations,
} from "@/lib/db/schema";

async function main() {
	console.log("🚀 Creando Quantum AI Summit Perú 2025...\n");

	const existingOrg = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "quantumhub-peru"),
	});

	let quantumHubOrg: typeof organizations.$inferSelect;

	if (existingOrg) {
		console.log("✅ QuantumHub Perú ya existe:", existingOrg.id);
		quantumHubOrg = existingOrg;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "quantumhub-peru",
				name: "QuantumHub Perú",
				displayName: "QuantumHub Perú",
				description:
					"Escuela de Computación Cuántica dedicada a formar la próxima generación de científicos y tecnólogos cuánticos en Perú.",
				type: "community",
				email: "contacto@qhubperu.org",
				websiteUrl: "https://www.qhubperu.com",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ QuantumHub Perú creada:", newOrg.id);
		quantumHubOrg = newOrg;
	}

	const existingCedditec = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "cedditec"),
	});

	let cedditecOrg: typeof organizations.$inferSelect;

	if (existingCedditec) {
		console.log("✅ CEDDITEC ya existe:", existingCedditec.id);
		cedditecOrg = existingCedditec;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "cedditec",
				name: "CEDDITEC",
				displayName: "CEDDITEC",
				description:
					"Centro de Divulgación Científica, Cultura y Desarrollo Tecnológico.",
				type: "ngo",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ CEDDITEC creada:", newOrg.id);
		cedditecOrg = newOrg;
	}

	const existingCongreso = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "congreso-peru"),
	});

	let congresoOrg: typeof organizations.$inferSelect;

	if (existingCongreso) {
		console.log("✅ Congreso de la República ya existe:", existingCongreso.id);
		congresoOrg = existingCongreso;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "congreso-peru",
				name: "Congreso de la República del Perú",
				displayName: "Congreso de la República",
				description: "Poder Legislativo del Perú.",
				type: "government",
				websiteUrl: "https://www.congreso.gob.pe",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ Congreso de la República creada:", newOrg.id);
		congresoOrg = newOrg;
	}

	const existingMesaJovenes = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "mesa-jovenes-parlamentarios"),
	});

	let mesaJovenesOrg: typeof organizations.$inferSelect;

	if (existingMesaJovenes) {
		console.log(
			"✅ Mesa de Jóvenes Parlamentarios ya existe:",
			existingMesaJovenes.id,
		);
		mesaJovenesOrg = existingMesaJovenes;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "mesa-jovenes-parlamentarios",
				name: "Mesa de Jóvenes Parlamentarios del Perú",
				displayName: "Mesa de Jóvenes",
				description:
					"Espacio de participación juvenil en el Congreso de la República del Perú.",
				type: "government",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ Mesa de Jóvenes Parlamentarios creada:", newOrg.id);
		mesaJovenesOrg = newOrg;
	}

	const existingMicrosoft = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "microsoft"),
	});

	let microsoftOrg: typeof organizations.$inferSelect;

	if (existingMicrosoft) {
		console.log("✅ Microsoft ya existe:", existingMicrosoft.id);
		microsoftOrg = existingMicrosoft;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "microsoft",
				name: "Microsoft",
				displayName: "Microsoft",
				description:
					"Empresa tecnológica multinacional líder en software, servicios en la nube e inteligencia artificial.",
				type: "company",
				websiteUrl: "https://www.microsoft.com",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ Microsoft creada:", newOrg.id);
		microsoftOrg = newOrg;
	}

	const existingSoftwareOne = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "softwareone"),
	});

	let softwareOneOrg: typeof organizations.$inferSelect;

	if (existingSoftwareOne) {
		console.log("✅ SoftwareOne ya existe:", existingSoftwareOne.id);
		softwareOneOrg = existingSoftwareOne;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "softwareone",
				name: "SoftwareOne",
				displayName: "SoftwareOne",
				description:
					"Proveedor global de software y soluciones en la nube, partner de Microsoft.",
				type: "company",
				websiteUrl: "https://www.softwareone.com",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ SoftwareOne creada:", newOrg.id);
		softwareOneOrg = newOrg;
	}

	const existingInducontrol = await db.query.organizations.findFirst({
		where: eq(organizations.slug, "inducontrol"),
	});

	let inducontrolOrg: typeof organizations.$inferSelect;

	if (existingInducontrol) {
		console.log("✅ Inducontrol ya existe:", existingInducontrol.id);
		inducontrolOrg = existingInducontrol;
	} else {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				slug: "inducontrol",
				name: "Inducontrol Ingeniería SAC",
				displayName: "Inducontrol",
				description:
					"Sociedad de ingeniería especializada en automatización, control y tecnologías cuánticas educativas (SPINQ).",
				type: "company",
				ownerUserId: "user_temp_placeholder",
				isPublic: true,
				isVerified: true,
			})
			.returning();
		console.log("✅ Inducontrol creada:", newOrg.id);
		inducontrolOrg = newOrg;
	}

	console.log("\n📅 Creando evento principal...\n");

	const existingEvent = await db.query.events.findFirst({
		where: eq(events.slug, "quantum-ai-summit-peru-2025"),
	});

	let mainEvent: typeof events.$inferSelect;

	if (existingEvent) {
		console.log("⚠️  El evento ya existe:", existingEvent.id);
		mainEvent = existingEvent;
	} else {
		const [newEvent] = await db
			.insert(events)
			.values({
				slug: "quantum-ai-summit-peru-2025",
				name: "Quantum AI Summit Perú 2025",
				description: `El Quantum AI Summit 2025 es un evento pionero organizado por QuantumHub Perú y CEDDITEC, que reunirá a estudiantes, profesionales e investigadores para explorar el presente y futuro de la computación cuántica y la inteligencia artificial en el Perú y Latinoamérica.

Durante tres días (19, 20 y 21 de diciembre), el Summit ofrecerá conferencias magistrales, sesiones formativas, paneles especializados y Quantum Voices, un espacio de charlas inspiradoras al estilo TED, donde líderes jóvenes compartirán sus experiencias y trayectoria.

Esta edición cuenta con el auspicio de la Mesa de Jóvenes del Congreso de la República, y se realizará en el Palacio Municipal de Lima, un espacio emblemático abierto en esta ocasión para promover el desarrollo tecnológico en el país.

El Summit busca democratizar el acceso a tecnologías de frontera, conectar a la comunidad científica y tecnológica, y formar a la siguiente generación de innovadores peruanos preparados para liderar la era cuántica e inteligente.

Ingreso libre previa inscripción. Aforo limitado.`,
				eventType: "conference",
				startDate: new Date("2025-12-19T13:00:00-05:00"),
				endDate: new Date("2025-12-21T18:00:00-05:00"),
				format: "in-person",
				country: "PE",
				department: "Lima",
				city: "Lima",
				venue: "Palacio Municipal de Lima - Salón de los Espejos",
				timezone: "America/Lima",
				skillLevel: "all",
				domains: ["quantum", "ai"],
				websiteUrl: "https://www.qhubperu.com/quantumaisummit",
				registrationUrl: "https://lu.ma/quantum-ai-summit-peru-2025",
				status: "ongoing",
				isFeatured: true,
				isApproved: true,
				approvalStatus: "approved",
				organizationId: quantumHubOrg.id,
			})
			.returning();
		console.log("✅ Evento creado:", newEvent.id);
		mainEvent = newEvent;
	}

	console.log("\n🏢 Vinculando organizaciones host...\n");

	const existingQuantumHubHost =
		await db.query.eventHostOrganizations.findFirst({
			where: (t, { and }) =>
				and(
					eq(t.eventId, mainEvent.id),
					eq(t.organizationId, quantumHubOrg.id),
				),
		});

	if (!existingQuantumHubHost) {
		await db.insert(eventHostOrganizations).values({
			eventId: mainEvent.id,
			organizationId: quantumHubOrg.id,
			isPrimary: true,
			status: "approved",
		});
		console.log("✅ QuantumHub Perú vinculada como host principal");
	} else {
		console.log("✅ QuantumHub Perú ya está vinculada como host");
	}

	const existingCedditecHost = await db.query.eventHostOrganizations.findFirst({
		where: (t, { and }) =>
			and(eq(t.eventId, mainEvent.id), eq(t.organizationId, cedditecOrg.id)),
	});

	if (!existingCedditecHost) {
		await db.insert(eventHostOrganizations).values({
			eventId: mainEvent.id,
			organizationId: cedditecOrg.id,
			isPrimary: false,
			status: "approved",
		});
		console.log("✅ CEDDITEC vinculada como co-host");
	} else {
		console.log("✅ CEDDITEC ya está vinculada como host");
	}

	console.log("\n🎖️ Vinculando sponsors...\n");

	const sponsorsToCreate = [
		{ org: congresoOrg, tier: "partner" as const, order: 0 },
		{ org: mesaJovenesOrg, tier: "partner" as const, order: 1 },
		{ org: microsoftOrg, tier: "gold" as const, order: 0 },
		{ org: softwareOneOrg, tier: "gold" as const, order: 1 },
		{ org: inducontrolOrg, tier: "partner" as const, order: 2 },
	];

	for (const sponsor of sponsorsToCreate) {
		const existing = await db.query.eventSponsors.findFirst({
			where: (t, { and }) =>
				and(eq(t.eventId, mainEvent.id), eq(t.organizationId, sponsor.org.id)),
		});

		if (!existing) {
			await db.insert(eventSponsors).values({
				eventId: mainEvent.id,
				organizationId: sponsor.org.id,
				orderIndex: sponsor.order,
			});
			console.log(
				`✅ ${sponsor.org.name} vinculada como sponsor (${sponsor.tier})`,
			);
		} else {
			console.log(`✅ ${sponsor.org.name} ya está vinculada como sponsor`);
		}
	}

	console.log("\n🎉 ¡Quantum AI Summit Perú 2025 creado exitosamente!\n");
	console.log(`📍 Evento: https://hack0.dev/${mainEvent.slug}`);
	console.log(`🏢 Comunidad: https://hack0.dev/c/${quantumHubOrg.slug}`);

	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
