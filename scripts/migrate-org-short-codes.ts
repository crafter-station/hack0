import { neon } from "@neondatabase/serverless";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { customAlphabet } from "nanoid";
import { organizations } from "../lib/db/schema";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

async function migrate() {
	console.log("Generating short codes for organizations without one...");

	try {
		// Get all organizations without shortCode
		const orgsWithoutCode = await db
			.select({ id: organizations.id, slug: organizations.slug })
			.from(organizations)
			.where(isNull(organizations.shortCode));

		console.log(
			`Found ${orgsWithoutCode.length} organizations without short code`,
		);

		const existingCodes = new Set<string>();

		for (const org of orgsWithoutCode) {
			let code = nanoid();
			// Ensure uniqueness
			while (existingCodes.has(code)) {
				code = nanoid();
			}
			existingCodes.add(code);

			await db
				.update(organizations)
				.set({ shortCode: code })
				.where(eq(organizations.id, org.id));

			console.log(`  ${org.slug} -> ${code}`);
		}

		console.log(
			`\n✓ Generated ${orgsWithoutCode.length} short codes successfully!`,
		);
	} catch (error) {
		console.error("✗ Migration failed:", error);
		process.exit(1);
	}
}

migrate();
