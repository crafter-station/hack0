import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

async function migrate() {
	console.log("Starting migration...");

	try {
		// Drop old sponsors table
		console.log("1. Dropping old sponsors table...");
		await db.execute(sql`DROP TABLE IF EXISTS sponsors CASCADE`);

		// Create new event_sponsors table
		console.log("2. Creating event_sponsors table...");
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_sponsors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tier sponsor_tier DEFAULT 'partner',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

		// Create indexes
		console.log("3. Creating indexes...");
		await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON event_sponsors(event_id)
    `);
		await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_event_sponsors_organization_id ON event_sponsors(organization_id)
    `);

		console.log("✓ Migration completed successfully!");
	} catch (error) {
		console.error("✗ Migration failed:", error);
		process.exit(1);
	}
}

migrate();
