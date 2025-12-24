import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;

	const card = await db.query.giftCards.findFirst({
		where: eq(giftCards.shareToken, token),
	});

	if (!card) {
		return Response.json({ error: "Card not found" }, { status: 404 });
	}

	return Response.json({
		status: card.status,
		generatedImageUrl: card.generatedImageUrl,
		generatedBackgroundUrl: card.generatedBackgroundUrl,
		message: card.message,
		recipientName: card.recipientName,
		layoutId: card.layoutId,
		style: card.style,
		errorMessage: card.errorMessage,
	});
}
