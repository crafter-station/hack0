import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const queryClient = neon(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

async function main() {
	console.log("Fixing protocol-relative URLs in the database...\n");

	const results = await Promise.all([
		db.execute(sql`
      UPDATE events
      SET event_image_url = 'https:' || event_image_url
      WHERE event_image_url LIKE '//%'
    `),
		db.execute(sql`
      UPDATE organizations
      SET logo_url = 'https:' || logo_url
      WHERE logo_url LIKE '//%'
    `),
		db.execute(sql`
      UPDATE organizations
      SET cover_url = 'https:' || cover_url
      WHERE cover_url LIKE '//%'
    `),
	]);

	console.log(`events.eventImageUrl fixed: ${results[0].rowCount ?? 0} rows`);
	console.log(`organizations.logoUrl fixed: ${results[1].rowCount ?? 0} rows`);
	console.log(`organizations.coverUrl fixed: ${results[2].rowCount ?? 0} rows`);
	console.log("\nDone.");
}

main().catch(console.error);
