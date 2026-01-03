import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

const DEFAULT_SAMPLE_PHOTO =
	"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=512&h=512&fit=crop&crop=face";

const FRAMING_INSTRUCTIONS = `CRITICAL FRAMING: Leave at least 20% empty space ABOVE the head. Show head and shoulders with the face centered. Plain solid white background only.`;

export const testCustomBadgeStyleTask = task({
	id: "test-custom-badge-style",
	maxDuration: 120,
	run: async (payload: {
		communityId: string;
		portraitPrompt: string;
		backgroundPrompt: string;
		testImageUrl?: string;
	}) => {
		const { communityId, portraitPrompt, backgroundPrompt, testImageUrl } =
			payload;

		metadata.set("step", "initializing");
		metadata.set("communityId", communityId);

		const sourceImageUrl = testImageUrl || DEFAULT_SAMPLE_PHOTO;
		const enhancedPortraitPrompt = `${portraitPrompt}. ${FRAMING_INSTRUCTIONS}`;

		try {
			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_portrait");

			const portraitResult = await fal.subscribe("fal-ai/gpt-image-1.5/edit", {
				input: {
					prompt: enhancedPortraitPrompt,
					image_urls: [sourceImageUrl],
					image_size: "1024x1024",
					quality: "high",
					input_fidelity: "high",
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

			const backgroundUrl = (
				backgroundResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("step", "uploading_to_storage");

			const utapi = new UTApi();
			const [uploadPortrait, uploadBackground] = await Promise.all([
				utapi.uploadFilesFromUrl(portraitNoBgUrl),
				utapi.uploadFilesFromUrl(backgroundUrl),
			]);

			const finalPortraitUrl = uploadPortrait.data?.url || portraitNoBgUrl;
			const finalBackgroundUrl = uploadBackground.data?.url || backgroundUrl;

			metadata.set("step", "saving_to_database");

			await db
				.update(organizations)
				.set({
					badgeCustomTestPortraitUrl: finalPortraitUrl,
					badgeCustomTestBackgroundUrl: finalBackgroundUrl,
					badgeCustomTestReferenceUrl: sourceImageUrl,
					updatedAt: new Date(),
				})
				.where(eq(organizations.id, communityId));

			metadata.set("step", "completed");
			metadata.set("portraitUrl", finalPortraitUrl);
			metadata.set("backgroundUrl", finalBackgroundUrl);

			return {
				success: true,
				communityId,
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
