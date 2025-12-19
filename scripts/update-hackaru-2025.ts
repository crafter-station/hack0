import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { events } from "../lib/db/schema";

async function main() {
	console.log("Actualizando evento HackAru 2025...\n");

	const eventSlug = "hackaru-2025";

	const newWebsiteUrl = "https://www.instagram.com/ujiawaynawila/p/DR5jvjekrW7";
	const newRegistrationUrl =
		"https://docs.google.com/forms/d/e/1FAIpQLSfhie9IIyBmWGP81ws_qLaLLMXeVOg1b_PbwfWg46mqtm3TFw/closedform";

	try {
		await db
			.update(events)
			.set({
				websiteUrl: newWebsiteUrl,
				registrationUrl: newRegistrationUrl,
			})
			.where(eq(events.slug, eventSlug));

		console.log("✓ URLs actualizadas:");
		console.log(`  - Website: ${newWebsiteUrl}`);
		console.log(`  - Registro: ${newRegistrationUrl}`);
		console.log("\n¡Listo! Evento Hackaru 2025 actualizado.");
	} catch (error) {
		console.error("❌ Error al actualizar el evento:", error);
	}
}

main();
