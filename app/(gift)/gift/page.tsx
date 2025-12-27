import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GiftLandingClient } from "@/components/gift/gift-landing-client";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

export const metadata: Metadata = {
	title: "Recibe tu regalo",
	description:
		"Una tarjeta de Navidad personalizada, creada con IA solo para ti. Un pequeño regalo de hack0.dev.",
};

export default async function GiftLandingPage() {
	const { userId } = await auth();

	if (userId) {
		const existingCard = await db.query.giftCards.findFirst({
			where: eq(giftCards.userId, userId),
		});

		if (existingCard) {
			redirect(`/gift/card/${existingCard.shareToken}`);
		}
	}

	return <GiftLandingClient />;
}
