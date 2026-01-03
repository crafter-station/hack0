import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq, sql } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

const DEFAULT_SAMPLE_PHOTO =
	"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=512&h=512&fit=crop&crop=face";

const BASE_FRAMING = `Chest-up view. Keep the person's likeness and features recognizable. Maintain the original pose and expression.`;

const PRESET_FRAMING: Record<string, string> = {
	pixel_art: `8-bit pixel-art portrait. ${BASE_FRAMING} Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft.`,
	cyberpunk: `Flat illustration cyberpunk portrait. ${BASE_FRAMING} Stylized cartoon with neon cyan and magenta colors. Simple cel-shaded style. Bold graphic design aesthetic. Neon glow effects on flat colors. Not photorealistic, illustrated look.`,
	anime: `Anime style portrait. ${BASE_FRAMING} Clean cel-shaded illustration. Big expressive eyes. Use a simple solid color background. Style should be like modern anime, beautiful and polished.`,
	sticker: `Cute sticker illustration style portrait. ${BASE_FRAMING} Thick black outlines around everything. Bright cheerful colors. Slightly chibi proportions with bigger head. Kawaii cute aesthetic. Simple cel-shaded with minimal shading. Like a vinyl sticker or emoji. White background.`,
	ghibli: `Studio Ghibli style portrait. ${BASE_FRAMING} Hand-drawn animation look. Soft warm colors. Gentle watercolor-like shading. Miyazaki anime aesthetic. Dreamy and whimsical. Simple but expressive features. Cozy and nostalgic feel.`,
};

export const testBadgeStyleTask = task({
	id: "test-badge-style",
	maxDuration: 120,
	run: async (payload: {
		communityId: string;
		styleId: string;
		portraitPrompt: string;
		backgroundPrompt?: string;
		testImageUrl?: string;
		customBackgroundImageUrl?: string;
	}) => {
		const {
			communityId,
			styleId,
			portraitPrompt,
			backgroundPrompt,
			testImageUrl,
			customBackgroundImageUrl,
		} = payload;

		metadata.set("step", "initializing");
		metadata.set("communityId", communityId);
		metadata.set("styleId", styleId);

		const sourceImageUrl = testImageUrl || DEFAULT_SAMPLE_PHOTO;
		const framingInstructions = PRESET_FRAMING[styleId] || BASE_FRAMING;
		const enhancedPortraitPrompt = `${portraitPrompt}. ${framingInstructions}`;

		try {
			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_portrait");

			const portraitResult = await fal.subscribe("fal-ai/qwen-image-edit", {
				input: {
					prompt: enhancedPortraitPrompt,
					image_url: sourceImageUrl,
				},
			});

			const rawPortraitUrl = (
				portraitResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("step", "removing_background");

			const rmbgResult = await fal.subscribe("fal-ai/bria/background/remove", {
				input: {
					image_url: rawPortraitUrl,
				},
			});

			const portraitNoBgUrl = (rmbgResult.data as { image: { url: string } })
				.image.url;

			let backgroundUrl: string;

			if (customBackgroundImageUrl) {
				metadata.set("step", "using_custom_background");
				backgroundUrl = customBackgroundImageUrl;
			} else if (backgroundPrompt) {
				metadata.set("step", "generating_background");
				const backgroundResult = await fal.subscribe("fal-ai/flux/schnell", {
					input: {
						prompt: backgroundPrompt,
						image_size: {
							width: 512,
							height: 512,
						},
						num_images: 1,
						enable_safety_checker: false,
					},
				});
				backgroundUrl = (
					backgroundResult.data as { images: Array<{ url: string }> }
				).images[0].url;
			} else {
				backgroundUrl =
					"https://images.unsplash.com/photo-1557683316-973673baf926?w=512&h=512&fit=crop";
			}

			metadata.set("step", "uploading_to_storage");

			const utapi = new UTApi();
			const isAlreadyUploaded = customBackgroundImageUrl?.includes("utfs.io");

			const uploadPortrait = await utapi.uploadFilesFromUrl(portraitNoBgUrl);
			const finalPortraitUrl = uploadPortrait.data?.url || portraitNoBgUrl;

			let finalBackgroundUrl: string;
			if (isAlreadyUploaded) {
				finalBackgroundUrl = backgroundUrl;
			} else {
				const uploadBackground = await utapi.uploadFilesFromUrl(backgroundUrl);
				finalBackgroundUrl = uploadBackground.data?.url || backgroundUrl;
			}

			metadata.set("step", "saving_to_database");

			await db
				.update(organizations)
				.set({
					badgeStyleTestImages: sql`
						COALESCE(badge_style_test_images, '{}'::jsonb) ||
						${JSON.stringify({
							[styleId]: {
								portrait: finalPortraitUrl,
								background: finalBackgroundUrl,
							},
						})}::jsonb
					`,
					updatedAt: new Date(),
				})
				.where(eq(organizations.id, communityId));

			metadata.set("step", "completed");
			metadata.set("portraitUrl", finalPortraitUrl);
			metadata.set("backgroundUrl", finalBackgroundUrl);

			return {
				success: true,
				communityId,
				styleId,
				portraitUrl: finalPortraitUrl,
				backgroundUrl: finalBackgroundUrl,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			metadata.set("step", "error");
			metadata.set("error", errorMessage);

			throw error;
		}
	},
});
