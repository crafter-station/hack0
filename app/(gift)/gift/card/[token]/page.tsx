import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardReveal } from "@/components/gift/card-reveal";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

function getBaseUrl() {
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "https://hack0.dev";
}

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

	const baseUrl = getBaseUrl();

	if (!card || !card.builderId) {
		return {
			title: "HACK0.DEV 2025",
			description: "Badge navideño de hack0.dev",
		};
	}

	const formattedId = `#${card.builderId.toString().padStart(4, "0")}`;
	const builderName = card.recipientName ? ` - ${card.recipientName}` : "";
	const ogImageUrl = `${baseUrl}/api/badge/og/${token}`;

	return {
		title: `HACK0.DEV 2025 ${formattedId}${builderName}`,
		description: card.message || "Badge navideño de hack0.dev",
		openGraph: {
			title: `HACK0.DEV 2025 ${formattedId}${builderName}`,
			description: card.message || "Badge navideño de hack0.dev",
			url: `${baseUrl}/gift/card/${token}`,
			images: [
				{
					url: ogImageUrl,
					width: 1200,
					height: 1200,
					alt: `Badge de ${card.recipientName || "Builder"}`,
				},
			],
			type: "profile",
		},
		twitter: {
			card: "summary_large_image",
			title: `HACK0.DEV 2025 ${formattedId}${builderName}`,
			description: card.message || "Badge navideño de hack0.dev",
			images: [ogImageUrl],
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
				coverBackgroundUrl={
					card.coverBackgroundUrl || card.generatedBackgroundUrl
				}
				manifestoPhrase={card.message}
				verticalLabel={card.verticalLabel || "BUILDER"}
				builderName={card.recipientName || undefined}
			/>
		</div>
	);
}
