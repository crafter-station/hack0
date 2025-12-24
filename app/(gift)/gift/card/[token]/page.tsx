import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardReveal } from "@/components/gift/card-reveal";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

interface CardPageProps {
	params: Promise<{ token: string }>;
}

export async function generateMetadata({
	params,
}: CardPageProps): Promise<Metadata> {
	const { token } = await params;
	const card = await db.query.giftCards.findFirst({
		where: eq(giftCards.shareToken, token),
	});

	if (!card || !card.builderId) {
		return {
			title: "Builder LATAM 2025",
			description: "Badge de builder del ecosistema tech LATAM.",
		};
	}

	const formattedId = `#${card.builderId.toString().padStart(4, "0")}`;

	return {
		title: `Builder LATAM 2025 ${formattedId}`,
		description: card.message || "Badge de builder del ecosistema tech LATAM.",
		openGraph: {
			title: `Builder LATAM 2025 ${formattedId}`,
			description:
				card.message || "Badge de builder del ecosistema tech LATAM.",
			images: [`/api/badge/og/${token}`],
			type: "profile",
		},
		twitter: {
			card: "summary_large_image",
			title: `Builder LATAM 2025 ${formattedId}`,
			description:
				card.message || "Badge de builder del ecosistema tech LATAM.",
			images: [`/api/badge/og/${token}`],
		},
	};
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

	const formattedId = card.builderId
		? `#${card.builderId.toString().padStart(4, "0")}`
		: "";

	return (
		<div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-6">
			<CardReveal
				token={token}
				builderId={card.builderId || 0}
				generatedImageUrl={card.generatedImageUrl}
				generatedBackgroundUrl={card.generatedBackgroundUrl}
				manifestoPhrase={card.message}
				verticalLabel={card.verticalLabel || "BUILDER"}
				builderName={card.recipientName || undefined}
			/>
		</div>
	);
}
