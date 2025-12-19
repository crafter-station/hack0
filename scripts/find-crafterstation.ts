import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function findCrafterStation() {
	const results = await db
		.select()
		.from(organizations)
		.where(like(organizations.name, "%crafter%"));

	console.log("Found organizations with 'crafter' in name:");
	results.forEach((org) => {
		console.log(`- ${org.name} (slug: ${org.slug}, owner: ${org.ownerUserId})`);
	});

	process.exit(0);
}

findCrafterStation().catch(console.error);
