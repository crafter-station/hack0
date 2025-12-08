import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function listAllOrgs() {
	const results = await db.select().from(organizations);

	console.log(`Total organizations: ${results.length}\n`);
	results.forEach((org) => {
		console.log(`Name: ${org.name}`);
		console.log(`Slug: ${org.slug}`);
		console.log(`Owner: ${org.ownerUserId}`);
		console.log("---");
	});

	process.exit(0);
}

listAllOrgs().catch(console.error);
