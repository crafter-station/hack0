import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

async function migrate() {
	console.log("Adding short_code column to organizations...");

	try {
		await db.execute(sql`
			ALTER TABLE organizations
			ADD COLUMN IF NOT EXISTS short_code VARCHAR(10) UNIQUE
		`);

		console.log("✓ Column added successfully!");
	} catch (error) {
		console.error("✗ Migration failed:", error);
		process.exit(1);
	}
}

migrate();
