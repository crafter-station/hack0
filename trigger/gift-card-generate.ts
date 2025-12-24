import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import {
	BACKGROUND_PROMPTS,
	type BackgroundMood,
	type GiftCardStyle,
	STYLE_PROMPTS,
} from "@/lib/gift/styles";

export const generateGiftCardTask = task({
	id: "generate-gift-card",
	maxDuration: 120,
	run: async (payload: {
		cardId: string;
		photoUrl: string;
		recipientName?: string;
		style: GiftCardStyle;
		backgroundMood: BackgroundMood;
		layoutId: string;
	}) => {
		const { cardId, photoUrl, recipientName, style, backgroundMood } = payload;

		metadata.set("step", "generating_images");
		metadata.set("cardId", cardId);

		try {
			await db
				.update(giftCards)
				.set({ status: "generating" })
				.where(eq(giftCards.id, cardId));

			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_portrait_and_background");

			const [portraitResult, backgroundResult] = await Promise.all([
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
			]);

			const generatedImageUrl = (
				portraitResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			const generatedBackgroundUrl = (
				backgroundResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("generatedImageUrl", generatedImageUrl);
			metadata.set("generatedBackgroundUrl", generatedBackgroundUrl);
			metadata.set("step", "generating_message");

			const messageResult = await generateText({
				model: "openai/gpt-5-nano",
				prompt: `Escribe un mensaje navideño de hack0 para ${recipientName || "un builder"}.
Contexto: hack0.dev mapea el ecosistema tech de LATAM. Empezamos por Perú y en 2026 expandimos a toda LATAM.
Objetivo: Invitar a que nos acompañe en 2026 a mapear y conectar la comunidad tech.

Reglas:
- Máximo 25 palabras
- Tono: cálido pero con propósito, como un amigo que te invita a un proyecto importante
- Menciona sutilmente el 2026 y el mapeo/conexión del ecosistema tech
- Evita clichés navideños genéricos
- Hazlo sentir parte de algo más grande

Ejemplos de tono:
- "En 2026 seguimos mapeando juntos. Gracias por ser parte de esta comunidad."
- "Este 2026, la misión continúa. ¿Nos acompañas a conectar LATAM?"

Responde SOLO el mensaje, nada más.`,
			});

			metadata.set("step", "uploading_final");

			const utapi = new UTApi();
			const [uploadPortrait, uploadBackground] = await Promise.all([
				utapi.uploadFilesFromUrl(generatedImageUrl),
				utapi.uploadFilesFromUrl(generatedBackgroundUrl),
			]);

			const finalImageUrl = uploadPortrait.data?.url || generatedImageUrl;
			const finalBackgroundUrl =
				uploadBackground.data?.url || generatedBackgroundUrl;

			await db
				.update(giftCards)
				.set({
					generatedImageUrl: finalImageUrl,
					generatedBackgroundUrl: finalBackgroundUrl,
					message: messageResult.text,
					status: "completed",
					completedAt: new Date(),
				})
				.where(eq(giftCards.id, cardId));

			metadata.set("step", "completed");
			metadata.set("finalImageUrl", finalImageUrl);
			metadata.set("finalBackgroundUrl", finalBackgroundUrl);

			return {
				success: true,
				cardId,
				generatedImageUrl: finalImageUrl,
				generatedBackgroundUrl: finalBackgroundUrl,
				message: messageResult.text,
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
