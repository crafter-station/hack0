import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { achievements, giftCards, userAchievements } from "@/lib/db/schema";

export async function POST(req: Request) {
	const { userId } = await auth();

	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { token } = await req.json();

		if (!token) {
			return Response.json({ error: "Token is required" }, { status: 400 });
		}

		const card = await db.query.giftCards.findFirst({
			where: eq(giftCards.shareToken, token),
		});

		if (!card) {
			return Response.json({ error: "Card not found" }, { status: 404 });
		}

		await db
			.update(giftCards)
			.set({ userId })
			.where(eq(giftCards.shareToken, token));

		const existingAchievement = await db.query.userAchievements.findFirst({
			where: and(
				eq(userAchievements.userId, userId),
				eq(userAchievements.achievementId, "christmas_gift_2025"),
			),
		});

		if (!existingAchievement) {
			const achievement = await db.query.achievements.findFirst({
				where: eq(achievements.id, "christmas_gift_2025"),
			});

			if (achievement) {
				await db.insert(userAchievements).values({
					userId,
					achievementId: "christmas_gift_2025",
					metadata: JSON.stringify({ giftCardId: card.id }),
				});

				return Response.json({
					saved: true,
					achievementUnlocked: {
						id: achievement.id,
						name: achievement.name,
						description: achievement.description,
						rarity: achievement.rarity,
						points: achievement.points,
						iconUrl: achievement.iconUrl,
					},
				});
			}
		}

		return Response.json({ saved: true, achievementUnlocked: null });
	} catch (error) {
		console.error("Error saving gift card:", error);
		return Response.json(
			{ error: "Failed to save gift card" },
			{ status: 500 },
		);
	}
}
