import { eq, isNull } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

async function generateUniqueShortCode(): Promise<string> {
	let code = nanoid();
	let isUnique = false;

	while (!isUnique) {
		const existing = await db
			.select({ id: events.id })
			.from(events)
			.where(eq(events.shortCode, code))
			.limit(1);

		if (existing.length === 0) {
			isUnique = true;
		} else {
			code = nanoid();
		}
	}

	return code;
}

async function migrateShortCodes() {
	console.log("Starting short code migration...");

	const eventsWithoutShortCode = await db
		.select({ id: events.id, name: events.name })
		.from(events)
		.where(isNull(events.shortCode));

	console.log(`Found ${eventsWithoutShortCode.length} events without short codes`);

	for (const event of eventsWithoutShortCode) {
		const shortCode = await generateUniqueShortCode();

		await db
			.update(events)
			.set({ shortCode })
			.where(eq(events.id, event.id));

		console.log(`✓ ${event.name} -> ${shortCode}`);
	}

	console.log("\nMigration complete!");
}

migrateShortCodes()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	});
