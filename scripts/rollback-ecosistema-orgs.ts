import { neon } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { organizations } from "@/lib/db/schema";

const useProd = process.argv.includes("--prod");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

const SYSTEM_OWNER_USER_ID =
	process.env.SYSTEM_OWNER_USER_ID || "system_ecosistema_import";

async function rollbackEcosistemaOrgs() {
	const dryRun = !process.argv.includes("--confirm");

	console.log(`🔄 Rollback Ecosistema Peruano organizations...`);
	console.log(`   Environment: ${useProd ? "🔴 PRODUCTION" : "🟢 DEV"}`);
	console.log(
		`   Database: ${DATABASE_URL.split("@")[1]?.split("/")[0] || "configured"}`,
	);
	console.log(`   Owner ID: ${SYSTEM_OWNER_USER_ID}`);
	console.log(
		`   Mode: ${dryRun ? "DRY RUN (use --confirm to execute)" : "⚠️  EXECUTING DELETE"}`,
	);
	console.log("");

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(organizations)
		.where(eq(organizations.ownerUserId, SYSTEM_OWNER_USER_ID));

	const count = Number(countResult[0]?.count || 0);

	console.log(
		`📊 Found ${count} organizations with ownerUserId = "${SYSTEM_OWNER_USER_ID}"`,
	);

	if (count === 0) {
		console.log("\n✅ Nothing to rollback!");
		return;
	}

	if (dryRun) {
		const orgs = await db
			.select({ slug: organizations.slug, name: organizations.name })
			.from(organizations)
			.where(eq(organizations.ownerUserId, SYSTEM_OWNER_USER_ID))
			.limit(10);

		console.log("\n📋 Sample organizations that would be deleted:");
		for (const org of orgs) {
			console.log(`   - ${org.slug}: ${org.name}`);
		}
		if (count > 10) console.log(`   ... and ${count - 10} more`);

		console.log(`\n⚠️  To execute the rollback, run:`);
		console.log(`   bun run scripts/rollback-ecosistema-orgs.ts --confirm`);
		return;
	}

	console.log(`\n🗑️  Deleting ${count} organizations...`);

	await db
		.delete(organizations)
		.where(eq(organizations.ownerUserId, SYSTEM_OWNER_USER_ID));

	console.log(`\n✅ Rollback complete! Deleted ${count} organizations.`);
}

rollbackEcosistemaOrgs()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
