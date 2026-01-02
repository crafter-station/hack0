import { fal } from "@fal-ai/client";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { communityBadges, organizations, type CommunityMember } from "@/lib/db/schema";
import {
	DEFAULT_BADGE_BACKGROUND_PROMPT,
	DEFAULT_BADGE_STYLE_PROMPT,
} from "@/lib/badge/defaults";

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
		const { badgeId, communityId, photoUrl, memberName, memberRole, badgeNumber } = payload;

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

			const stylePrompt = community?.badgeStylePrompt || DEFAULT_BADGE_STYLE_PROMPT;
			const backgroundPrompt = community?.badgeBackgroundPrompt || DEFAULT_BADGE_BACKGROUND_PROMPT;

			fal.config({ credentials: process.env.FAL_API_KEY });

			metadata.set("step", "generating_images");

			const [portraitResult, backgroundResult] = await Promise.all([
				fal.subscribe("fal-ai/gpt-image-1.5/edit", {
					input: {
						prompt: stylePrompt,
						image_urls: [photoUrl],
						image_size: "1024x1024",
						quality: "high",
						input_fidelity: "high",
					},
				}),
				fal.subscribe("fal-ai/gpt-image-1.5", {
					input: {
						prompt: backgroundPrompt,
						image_size: "1024x1024",
						quality: "high",
					},
				}),
			]);

			const rawPortraitUrl = (
				portraitResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			const generatedBackgroundUrl = (
				backgroundResult.data as { images: Array<{ url: string }> }
			).images[0].url;

			metadata.set("step", "removing_background");

			const rmbgResult = await fal.subscribe("fal-ai/rmbg-v2", {
				input: {
					image_url: rawPortraitUrl,
				},
			});

			const generatedImageUrl = (rmbgResult.data as { image: { url: string } })
				.image.url;

			metadata.set("generatedImageUrl", generatedImageUrl);
			metadata.set("generatedBackgroundUrl", generatedBackgroundUrl);
			metadata.set("step", "uploading_final");

			const utapi = new UTApi();
			const [uploadPortrait, uploadBackground] = await Promise.all([
				utapi.uploadFilesFromUrl(generatedImageUrl),
				utapi.uploadFilesFromUrl(generatedBackgroundUrl),
			]);

			const finalImageUrl = uploadPortrait.data?.url || generatedImageUrl;
			const finalBackgroundUrl = uploadBackground.data?.url || generatedBackgroundUrl;

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
