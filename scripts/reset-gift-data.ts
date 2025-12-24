import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { giftCards, userAchievements } from "@/lib/db/schema";

const CLERK_USER_ID = "railly@clerk.dev";

async function resetGiftData() {
	console.log("🧹 Limpiando datos de gift cards...\n");

	const deletedCards = await db.delete(giftCards).returning();
	console.log(`✓ Eliminadas ${deletedCards.length} gift cards`);

	const deletedAchievements = await db
		.delete(userAchievements)
		.where(eq(userAchievements.achievementId, "christmas_gift_2025"))
		.returning();
	console.log(`✓ Eliminados ${deletedAchievements.length} logros de navidad\n`);

	console.log("🎄 Listo para probar de nuevo!");
}

resetGiftData()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Error:", err);
		process.exit(1);
	});
