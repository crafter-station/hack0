import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { giftCards, userAchievements } from "@/lib/db/schema";

const DEV_URL =
	"postgresql://neondb_owner:npg_4FXYQLJszBZ5@ep-morning-smoke-ad5hhywz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const PROD_URL =
	"postgresql://neondb_owner:npg_4FXYQLJszBZ5@ep-green-pond-adl5gijz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function resetDatabase(name: string, url: string) {
	console.log(`\n🧹 Limpiando ${name}...`);

	const sql = neon(url);
	const db = drizzle(sql);

	const deletedCards = await db.delete(giftCards).returning();
	console.log(`  ✓ Eliminadas ${deletedCards.length} gift cards`);

	const deletedAchievements = await db
		.delete(userAchievements)
		.where(eq(userAchievements.achievementId, "christmas_gift_2025"))
		.returning();
	console.log(`  ✓ Eliminados ${deletedAchievements.length} logros de navidad`);
}

async function resetGiftData() {
	console.log("🎄 Reseteando gift cards en DEV y PROD...");

	await resetDatabase("DEV", DEV_URL);
	await resetDatabase("PROD", PROD_URL);

	console.log("\n✅ Listo para probar de nuevo!");
}

resetGiftData()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Error:", err);
		process.exit(1);
	});
