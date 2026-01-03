import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import {
	DEFAULT_BADGE_BACKGROUND_PROMPT,
	DEFAULT_BADGE_STYLE_PROMPT,
} from "@/lib/badge/defaults";
import { db } from "@/lib/db";
import {
	type CommunityMember,
	communityBadges,
	organizations,
} from "@/lib/db/schema";

const FRAMING_INSTRUCTIONS = `8-bit pixel-art portrait, chest-up view. Keep the person's likeness and features recognizable. Use a simple solid color background. Style should be cartoonish, anime inspired, cute and tender soft. Maintain the original pose and expression.`;

export const generateCommunityBadgeTask = task({
	id: "generate-community-badge",
	maxDuration: 120,
	run: async (payload: {
		badgeId: string;
		communityId: string;
		photoUrl: string;
		memberName: string;
		memberRole: CommunityMember["role"];
		badgeNumber: number;
	}) => {
		const {
			badgeId,
			communityId,
			photoUrl,
			memberName,
			memberRole,
			badgeNumber,
		} = payload;

		metadata.set("step", "initializing");
		metadata.set("badgeId", badgeId);
		metadata.set("communityId", communityId);

		try {
			await db
				.update(communityBadges)
				.set({ status: "generating" })
				.where(eq(communityBadges.id, badgeId));

			const [community] = await db
				.select()
				.from(organizations)
				.where(eq(organizations.id, communityId))
				.limit(1);

			const stylePrompt =
				community?.badgeStylePrompt || DEFAULT_BADGE_STYLE_PROMPT;
			const backgroundPrompt =
				community?.badgeBackgroundPrompt || DEFAULT_BADGE_BACKGROUND_PROMPT;

			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_images");

			const enhancedPrompt = `${stylePrompt}. ${FRAMING_INSTRUCTIONS}`;

			const portraitResult = await fal.subscribe("fal-ai/qwen-image-edit", {
				input: {
					prompt: enhancedPrompt,
					image_url: photoUrl,
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

			const generatedImageUrl = (rmbgResult.data as { image: { url: string } })
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

			const generatedBackgroundUrl = (
				backgroundResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("generatedImageUrl", generatedImageUrl);
			metadata.set("generatedBackgroundUrl", generatedBackgroundUrl);
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
				.update(communityBadges)
				.set({
					generatedImageUrl: finalImageUrl,
					generatedBackgroundUrl: finalBackgroundUrl,
					status: "completed",
					completedAt: new Date(),
				})
				.where(eq(communityBadges.id, badgeId));

			metadata.set("step", "completed");
			metadata.set("finalImageUrl", finalImageUrl);
			metadata.set("finalBackgroundUrl", finalBackgroundUrl);

			return {
				success: true,
				badgeId,
				badgeNumber,
				memberName,
				memberRole,
				generatedImageUrl: finalImageUrl,
				generatedBackgroundUrl: finalBackgroundUrl,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await db
				.update(communityBadges)
				.set({
					status: "failed",
					errorMessage,
				})
				.where(eq(communityBadges.id, badgeId));

			metadata.set("step", "error");
			metadata.set("error", errorMessage);

			throw error;
		}
	},
});
