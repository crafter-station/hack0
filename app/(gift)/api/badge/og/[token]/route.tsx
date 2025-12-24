/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import { BadgeOGTemplate } from "@/components/og/badge-template";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

export const runtime = "nodejs";

interface RouteContext {
	params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
	try {
		const { token } = await context.params;

		const card = await db.query.giftCards.findFirst({
			where: eq(giftCards.shareToken, token),
		});

		if (!card || card.status !== "completed") {
			return new Response("Card not found", { status: 404 });
		}

		let portraitDataUri: string | undefined;
		if (card.generatedImageUrl) {
			try {
				const imageResponse = await fetch(card.generatedImageUrl);
				if (imageResponse.ok) {
					const imageBuffer = await imageResponse.arrayBuffer();
					const base64 = Buffer.from(imageBuffer).toString("base64");
					const contentType =
						imageResponse.headers.get("content-type") || "image/png";
					portraitDataUri = `data:${contentType};base64,${base64}`;
				}
			} catch (imgError) {
				console.error("Failed to fetch portrait image:", imgError);
			}
		}

		const pngResponse = new ImageResponse(
			<BadgeOGTemplate
				builderId={card.builderId || 0}
				portraitUrl={portraitDataUri}
				manifestoPhrase={card.message || "Builder LATAM 2025"}
				verticalLabel={card.verticalLabel || "BUILDER"}
				builderName={card.recipientName || undefined}
			/>,
			{
				width: 1200,
				height: 630,
				format: "png",
			},
		);

		const pngBuffer = await pngResponse.arrayBuffer();
		const jpegBuffer = await sharp(Buffer.from(pngBuffer))
			.jpeg({ quality: 80, progressive: true })
			.toBuffer();

		return new Response(jpegBuffer, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=86400, s-maxage=86400",
			},
		});
	} catch (error) {
		console.error("Badge OG Image generation error:", error);
		return new Response("Failed to generate image", { status: 500 });
	}
}
