import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function main() {
	const [org] = await db
		.insert(organizations)
		.values({
			slug: "start-lima",
			name: "START Lima",
			displayName: "START Lima",
			description:
				"Comunidad de emprendimiento e innovación tecnológica en Lima",
			type: "community",
			ownerUserId: "user_temp_placeholder",
			isPublic: true,
			isVerified: true,
		})
		.returning();

	console.log("✅ Organización creada:", org);
	console.log(`🔗 URL del dashboard: https://hack0.dev/c/${org.slug}`);

	process.exit(0);
}

main().catch(console.error);
