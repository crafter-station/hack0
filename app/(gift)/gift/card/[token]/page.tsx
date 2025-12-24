import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardReveal } from "@/components/gift/card-reveal";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import type { GiftCardLayoutId } from "@/lib/gift/layouts";
import type { GiftCardStyle } from "@/lib/gift/styles";

export const metadata: Metadata = {
	title: "Tu tarjeta de Navidad",
	description:
		"Tu tarjeta de Navidad personalizada creada con IA. Felices fiestas de hack0.dev.",
};

interface CardPageProps {
	params: Promise<{ token: string }>;
}

export default async function GiftCardPage({ params }: CardPageProps) {
	const { token } = await params;

	const card = await db.query.giftCards.findFirst({
		where: eq(giftCards.shareToken, token),
	});

	if (!card) {
		notFound();
	}

	if (card.status === "pending" || card.status === "generating") {
		redirect(`/gift/loading/${token}`);
	}

	if (
		card.status === "failed" ||
		!card.generatedImageUrl ||
		!card.generatedBackgroundUrl ||
		!card.message
	) {
		redirect(`/gift/loading/${token}`);
	}

	return (
		<div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-6">
			<div className="text-center mb-4">
				<h1
					className="text-lg font-semibold tracking-tight"
					style={{ color: "#fafafa" }}
				>
					Tu regalo de Navidad
				</h1>
				<p className="text-xs" style={{ color: "rgba(250, 250, 250, 0.6)" }}>
					Creada especialmente para ti
				</p>
			</div>

			<CardReveal
				token={token}
				generatedImageUrl={card.generatedImageUrl}
				generatedBackgroundUrl={card.generatedBackgroundUrl}
				message={card.message}
				recipientName={card.recipientName || undefined}
				layoutId={card.layoutId as GiftCardLayoutId}
				style={card.style as GiftCardStyle}
			/>
		</div>
	);
}
