import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
	getNextBadgeNumber,
	getUserMembershipRole,
} from "@/lib/actions/badges";
import {
	canGenerateBadgeForCampaign,
	getCampaignById,
	getOrCreateDefaultCampaign,
	incrementCampaignBadgeCount,
} from "@/lib/actions/campaigns";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rate-limit";
import type { generateCommunityBadgeTask } from "@/trigger/community-badge-generate";

export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return Response.json({ error: "No autorizado" }, { status: 401 });
		}

		const clientIP = getClientIP(req);
		const limiter = rateLimiters.badgeGenerate();
		const { success, remaining } = await checkRateLimit(
			limiter,
			`${userId}:badge`,
		);

		if (!success) {
			return Response.json(
				{ error: "Rate limit exceeded. Try again later." },
				{
					status: 429,
					headers: { "X-RateLimit-Remaining": String(remaining ?? 0) },
				},
			);
		}

		const { communitySlug, photoUrl, memberName, campaignId } =
			await req.json();

		if (!communitySlug || !photoUrl) {
			return Response.json(
				{ error: "Community slug and photo URL are required" },
				{ status: 400 },
			);
		}

		if (
			!photoUrl.startsWith("https://utfs.io/") &&
			!photoUrl.startsWith("https://uploadthing.com/")
		) {
			return Response.json({ error: "Invalid photo URL" }, { status: 400 });
		}

		const [community] = await db
			.select()
			.from(organizations)
			.where(eq(organizations.slug, communitySlug))
			.limit(1);

		if (!community) {
			return Response.json(
				{ error: "Comunidad no encontrada" },
				{ status: 404 },
			);
		}

		if (!community.badgeEnabled) {
			return Response.json(
				{ error: "Los badges no están habilitados para esta comunidad" },
				{ status: 403 },
			);
		}

		const campaign = campaignId
			? await getCampaignById(campaignId)
			: await getOrCreateDefaultCampaign(community.id);

		if (!campaign || campaign.communityId !== community.id) {
			return Response.json({ error: "Campaña no encontrada" }, { status: 404 });
		}

		const eligibility = await canGenerateBadgeForCampaign(campaign.id, userId);
		if (!eligibility.allowed) {
			return Response.json({ error: eligibility.reason }, { status: 403 });
		}

		const memberRole = await getUserMembershipRole(community.id, userId);
		if (!memberRole || memberRole === "follower") {
			return Response.json(
				{ error: "Debes ser miembro para generar un badge" },
				{ status: 403 },
			);
		}

		const shareToken = nanoid(12);
		const badgeNumber = await getNextBadgeNumber(community.id);

		const [badge] = await db
			.insert(communityBadges)
			.values({
				communityId: community.id,
				userId,
				campaignId: campaign.id,
				originalPhotoUrl: photoUrl,
				badgeNumber,
				shareToken,
			})
			.returning();

		await incrementCampaignBadgeCount(campaign.id);

		const handle = await tasks.trigger<typeof generateCommunityBadgeTask>(
			"generate-community-badge",
			{
				badgeId: badge.id,
				communityId: community.id,
				campaignId: campaign.id,
				photoUrl,
				memberName: memberName || "",
				memberRole,
				badgeNumber,
			},
		);

		await db
			.update(communityBadges)
			.set({ triggerRunId: handle.id })
			.where(eq(communityBadges.id, badge.id));

		return Response.json({ token: shareToken, badgeNumber });
	} catch (error) {
		console.error("Error generating badge:", error);
		return Response.json(
			{ error: "Failed to generate badge" },
			{ status: 500 },
		);
	}
}
