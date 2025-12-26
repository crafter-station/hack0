import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { eq, sql } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import {
	getManifestoPrompt,
	type ManifestoResult,
	VERTICAL_LABEL_EXAMPLES,
} from "@/lib/gift/manifesto";
import {
	BACKGROUND_PROMPTS,
	type BackgroundMood,
	COVER_BACKGROUND_PROMPTS,
	type GiftCardStyle,
	STYLE_PROMPTS,
} from "@/lib/gift/styles";

async function getNextBuilderId(): Promise<number> {
	const result = await db
		.select({ maxId: sql<number>`COALESCE(MAX(builder_id), 0)` })
		.from(giftCards);
	return (result[0]?.maxId || 0) + 1;
}

export const generateGiftCardTask = task({
	id: "generate-gift-card",
	maxDuration: 120,
	run: async (payload: {
		cardId: string;
		photoUrl: string;
		recipientName?: string;
		builderFeelings?: string;
		style: GiftCardStyle;
		backgroundMood: BackgroundMood;
		layoutId: string;
	}) => {
		const {
			cardId,
			photoUrl,
			recipientName,
			builderFeelings,
			style,
			backgroundMood,
		} = payload;

		metadata.set("step", "initializing");
		metadata.set("cardId", cardId);

		try {
			const builderId = await getNextBuilderId();
			metadata.set("builderId", builderId);

			await db
				.update(giftCards)
				.set({ status: "generating", builderId })
				.where(eq(giftCards.id, cardId));

			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_all_parallel");

			const [portraitResult, backgroundResult, coverResult, manifestoResult] =
				await Promise.all([
					fal.subscribe("fal-ai/gpt-image-1.5/edit", {
						input: {
							prompt: STYLE_PROMPTS[style],
							image_urls: [photoUrl],
							image_size: "1024x1024",
							quality: "high",
							input_fidelity: "high",
						},
					}),
					fal.subscribe("fal-ai/gpt-image-1.5", {
						input: {
							prompt: BACKGROUND_PROMPTS[backgroundMood],
							image_size: "1024x1024",
							quality: "high",
						},
					}),
					fal.subscribe("fal-ai/gpt-image-1.5", {
						input: {
							prompt: COVER_BACKGROUND_PROMPTS[backgroundMood],
							image_size: "1024x1024",
							quality: "high",
						},
					}),
					generateText({
						model: "openai/gpt-4o-mini",
						prompt: getManifestoPrompt(recipientName, builderFeelings),
					}),
				]);

			const rawPortraitUrl = (
				portraitResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			const generatedBackgroundUrl = (
				backgroundResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			const coverBackgroundUrl = (
				coverResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("step", "removing_background");

			const rmbgResult = await fal.subscribe("fal-ai/rmbg-v2", {
				input: {
					image_url: rawPortraitUrl,
				},
			});

			const generatedImageUrl = (rmbgResult.data as { image: { url: string } })
				.image.url;

			let manifesto: ManifestoResult;
			try {
				let jsonText = manifestoResult.text.trim();
				if (jsonText.startsWith("```")) {
					jsonText = jsonText
						.replace(/^```(?:json)?\s*/i, "")
						.replace(/```\s*$/, "");
				}
				manifesto = JSON.parse(jsonText) as ManifestoResult;
			} catch {
				manifesto = {
					phrase: manifestoResult.text.trim(),
					verticalLabel:
						VERTICAL_LABEL_EXAMPLES[
							Math.floor(Math.random() * VERTICAL_LABEL_EXAMPLES.length)
						],
				};
			}

			metadata.set("generatedImageUrl", generatedImageUrl);
			metadata.set("generatedBackgroundUrl", generatedBackgroundUrl);
			metadata.set("coverBackgroundUrl", coverBackgroundUrl);
			metadata.set("manifesto", manifesto.phrase);
			metadata.set("verticalLabel", manifesto.verticalLabel);
			metadata.set("step", "uploading_final");

			const utapi = new UTApi();
			const [uploadPortrait, uploadBackground, uploadCover] = await Promise.all(
				[
					utapi.uploadFilesFromUrl(generatedImageUrl),
					utapi.uploadFilesFromUrl(generatedBackgroundUrl),
					utapi.uploadFilesFromUrl(coverBackgroundUrl),
				],
			);

			const finalImageUrl = uploadPortrait.data?.url || generatedImageUrl;
			const finalBackgroundUrl =
				uploadBackground.data?.url || generatedBackgroundUrl;
			const finalCoverUrl = uploadCover.data?.url || coverBackgroundUrl;

			await db
				.update(giftCards)
				.set({
					generatedImageUrl: finalImageUrl,
					generatedBackgroundUrl: finalBackgroundUrl,
					coverBackgroundUrl: finalCoverUrl,
					message: manifesto.phrase,
					verticalLabel: manifesto.verticalLabel,
					status: "completed",
					completedAt: new Date(),
				})
				.where(eq(giftCards.id, cardId));

			metadata.set("step", "completed");
			metadata.set("finalImageUrl", finalImageUrl);
			metadata.set("finalBackgroundUrl", finalBackgroundUrl);
			metadata.set("finalCoverUrl", finalCoverUrl);

			return {
				success: true,
				cardId,
				builderId,
				generatedImageUrl: finalImageUrl,
				generatedBackgroundUrl: finalBackgroundUrl,
				coverBackgroundUrl: finalCoverUrl,
				message: manifesto.phrase,
				verticalLabel: manifesto.verticalLabel,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await db
				.update(giftCards)
				.set({
					status: "failed",
					errorMessage,
				})
				.where(eq(giftCards.id, cardId));

			metadata.set("step", "error");
			metadata.set("error", errorMessage);

			throw error;
		}
	},
});
