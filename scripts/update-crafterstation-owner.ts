import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function updateCrafterStationOwner() {
	const result = await db
		.update(organizations)
		.set({
			ownerUserId: "user_36FQkzDwYsrVnyuKMicGRacBvzD",
		})
		.where(eq(organizations.slug, "crafter-station"))
		.returning();

	if (result.length > 0) {
		console.log("✅ Crafter Station owner updated successfully!");
		console.log("Organization:", result[0].name);
		console.log("New owner:", result[0].ownerUserId);
	} else {
		console.log("❌ Crafter Station organization not found");
	}

	process.exit(0);
}

updateCrafterStationOwner().catch(console.error);
