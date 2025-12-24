import { tasks } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { getRandomLayout } from "@/lib/gift/layouts";
import {
	type BackgroundMood,
	type GiftCardStyle,
	getRandomBackgroundMood,
	getRandomStyle,
} from "@/lib/gift/styles";
import type { generateGiftCardTask } from "@/trigger/gift-card-generate";

export async function POST(req: Request) {
	try {
		const { photoUrl, recipientName } = await req.json();

		if (!photoUrl) {
			return Response.json({ error: "Photo URL is required" }, { status: 400 });
		}

		const shareToken = nanoid(12);
		const layoutId = getRandomLayout();
		const style = getRandomStyle();
		const backgroundMood = getRandomBackgroundMood();

		const [card] = await db
			.insert(giftCards)
			.values({
				originalPhotoUrl: photoUrl,
				recipientName: recipientName || null,
				layoutId,
				style,
				shareToken,
			})
			.returning();

		const handle = await tasks.trigger<typeof generateGiftCardTask>(
			"generate-gift-card",
			{
				cardId: card.id,
				photoUrl,
				recipientName,
				style: style as GiftCardStyle,
				backgroundMood: backgroundMood as BackgroundMood,
				layoutId,
			},
		);

		await db
			.update(giftCards)
			.set({ triggerRunId: handle.id })
			.where(eq(giftCards.id, card.id));

		return Response.json({ token: shareToken });
	} catch (error) {
		console.error("Error generating gift card:", error);
		return Response.json(
			{ error: "Failed to generate gift card" },
			{ status: 500 },
		);
	}
}
