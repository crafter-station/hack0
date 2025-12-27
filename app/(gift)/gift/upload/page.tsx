import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UploadPageClient } from "@/components/gift/upload-page-client";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

export const metadata: Metadata = {
	title: "Sube tu foto",
	description:
		"Sube tu foto y la transformaremos en una ilustración navideña única con IA.",
};

export default async function GiftUploadPage() {
	const { userId } = await auth();

	if (userId) {
		const existingCard = await db.query.giftCards.findFirst({
			where: eq(giftCards.userId, userId),
		});

		if (existingCard) {
			redirect(`/gift/card/${existingCard.shareToken}`);
		}
	}

	return <UploadPageClient />;
}
