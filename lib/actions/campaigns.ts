"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type BadgeCampaign,
	badgeCampaigns,
	communityBadges,
	communityMembers,
	type NewBadgeCampaign,
	organizations,
} from "@/lib/db/schema";

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 100);
}

export async function getCampaignsForCommunity(communityId: string) {
	return db
		.select()
		.from(badgeCampaigns)
		.where(eq(badgeCampaigns.communityId, communityId))
		.orderBy(desc(badgeCampaigns.createdAt));
}

export async function getActiveCampaigns(communityId: string) {
	return db
		.select()
		.from(badgeCampaigns)
		.where(
			and(
				eq(badgeCampaigns.communityId, communityId),
				eq(badgeCampaigns.status, "active"),
			),
		)
		.orderBy(desc(badgeCampaigns.createdAt));
}

export async function getCampaignById(campaignId: string) {
	const [campaign] = await db
		.select()
		.from(badgeCampaigns)
		.where(eq(badgeCampaigns.id, campaignId))
		.limit(1);

	return campaign || null;
}

export async function getCampaignBySlug(
	communityId: string,
	campaignSlug: string,
) {
	const [campaign] = await db
		.select()
		.from(badgeCampaigns)
		.where(
			and(
				eq(badgeCampaigns.communityId, communityId),
				eq(badgeCampaigns.slug, campaignSlug),
			),
		)
		.limit(1);

	return campaign || null;
}

export async function getDefaultCampaign(communityId: string) {
	const [campaign] = await db
		.select()
		.from(badgeCampaigns)
		.where(
			and(
				eq(badgeCampaigns.communityId, communityId),
				eq(badgeCampaigns.type, "default"),
			),
		)
		.limit(1);

	return campaign || null;
}

export async function getOrCreateDefaultCampaign(communityId: string) {
	const existing = await getDefaultCampaign(communityId);
	if (existing) return existing;

	const { userId } = await auth();

	const [campaign] = await db
		.insert(badgeCampaigns)
		.values({
			communityId,
			name: "Badge Principal",
			slug: "default",
			type: "default",
			status: "active",
			createdBy: userId,
		})
		.returning();

	return campaign;
}

export type CreateCampaignData = {
	name: string;
	description?: string;
	type: "seasonal" | "event";
	eventId?: string;
	stylePreset?: string;
	portraitPrompt?: string;
	backgroundPrompt?: string;
	accentColor?: string;
	customBackgroundImageUrl?: string;
	badgeLabel?: string;
	badgeIcon?: string;
	startsAt?: Date;
	endsAt?: Date;
	maxBadges?: number;
};

export async function createCampaign(
	communityId: string,
	data: CreateCampaignData,
): Promise<{ success: boolean; campaign?: BadgeCampaign; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autorizado" };
	}

	const slug = generateSlug(data.name);

	const existingSlug = await getCampaignBySlug(communityId, slug);
	if (existingSlug) {
		return { success: false, error: "Ya existe una campaña con ese nombre" };
	}

	try {
		const [campaign] = await db
			.insert(badgeCampaigns)
			.values({
				communityId,
				name: data.name,
				slug,
				description: data.description,
				type: data.type,
				status: "draft",
				eventId: data.eventId,
				stylePreset: data.stylePreset,
				portraitPrompt: data.portraitPrompt,
				backgroundPrompt: data.backgroundPrompt,
				accentColor: data.accentColor,
				customBackgroundImageUrl: data.customBackgroundImageUrl,
				badgeLabel: data.badgeLabel,
				badgeIcon: data.badgeIcon,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
				maxBadges: data.maxBadges,
				createdBy: userId,
			})
			.returning();

		return { success: true, campaign };
	} catch (error) {
		console.error("Error creating campaign:", error);
		return { success: false, error: "Error al crear la campaña" };
	}
}

export type UpdateCampaignData = Partial<
	Omit<CreateCampaignData, "type"> & { status: BadgeCampaign["status"] }
>;

export async function updateCampaign(
	campaignId: string,
	data: UpdateCampaignData,
): Promise<{ success: boolean; campaign?: BadgeCampaign; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autorizado" };
	}

	const existing = await getCampaignById(campaignId);
	if (!existing) {
		return { success: false, error: "Campaña no encontrada" };
	}

	if (existing.type === "default" && data.status === "archived") {
		return {
			success: false,
			error: "No se puede archivar la campaña principal",
		};
	}

	try {
		const updateData: Partial<NewBadgeCampaign> = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) {
			updateData.name = data.name;
			updateData.slug = generateSlug(data.name);
		}
		if (data.description !== undefined)
			updateData.description = data.description;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.eventId !== undefined) updateData.eventId = data.eventId;
		if (data.stylePreset !== undefined)
			updateData.stylePreset = data.stylePreset;
		if (data.portraitPrompt !== undefined)
			updateData.portraitPrompt = data.portraitPrompt;
		if (data.backgroundPrompt !== undefined)
			updateData.backgroundPrompt = data.backgroundPrompt;
		if (data.accentColor !== undefined)
			updateData.accentColor = data.accentColor;
		if (data.customBackgroundImageUrl !== undefined)
			updateData.customBackgroundImageUrl = data.customBackgroundImageUrl;
		if (data.badgeLabel !== undefined) updateData.badgeLabel = data.badgeLabel;
		if (data.badgeIcon !== undefined) updateData.badgeIcon = data.badgeIcon;
		if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
		if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
		if (data.maxBadges !== undefined) updateData.maxBadges = data.maxBadges;

		const [campaign] = await db
			.update(badgeCampaigns)
			.set(updateData)
			.where(eq(badgeCampaigns.id, campaignId))
			.returning();

		return { success: true, campaign };
	} catch (error) {
		console.error("Error updating campaign:", error);
		return { success: false, error: "Error al actualizar la campaña" };
	}
}

export async function deleteCampaign(
	campaignId: string,
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autorizado" };
	}

	const existing = await getCampaignById(campaignId);
	if (!existing) {
		return { success: false, error: "Campaña no encontrada" };
	}

	if (existing.type === "default") {
		return {
			success: false,
			error: "No se puede eliminar la campaña principal",
		};
	}

	try {
		await db.delete(badgeCampaigns).where(eq(badgeCampaigns.id, campaignId));
		return { success: true };
	} catch (error) {
		console.error("Error deleting campaign:", error);
		return { success: false, error: "Error al eliminar la campaña" };
	}
}

export async function activateCampaign(
	campaignId: string,
): Promise<{ success: boolean; error?: string }> {
	return updateCampaign(campaignId, { status: "active" });
}

export async function endCampaign(
	campaignId: string,
): Promise<{ success: boolean; error?: string }> {
	return updateCampaign(campaignId, { status: "ended" });
}

export async function canGenerateBadgeForCampaign(
	campaignId: string,
	userId: string,
): Promise<{ allowed: boolean; reason?: string; campaign?: BadgeCampaign }> {
	const campaign = await getCampaignById(campaignId);
	if (!campaign) {
		return { allowed: false, reason: "Campaña no encontrada" };
	}

	if (campaign.status !== "active") {
		return { allowed: false, reason: "La campaña no está activa", campaign };
	}

	if (campaign.startsAt && new Date() < campaign.startsAt) {
		return {
			allowed: false,
			reason: "La campaña aún no ha comenzado",
			campaign,
		};
	}

	if (campaign.endsAt && new Date() > campaign.endsAt) {
		return { allowed: false, reason: "La campaña ha finalizado", campaign };
	}

	if (campaign.maxBadges && campaign.badgesGenerated >= campaign.maxBadges) {
		return {
			allowed: false,
			reason: "La campaña ha alcanzado el límite de badges",
			campaign,
		};
	}

	const [existingBadge] = await db
		.select()
		.from(communityBadges)
		.where(
			and(
				eq(communityBadges.campaignId, campaignId),
				eq(communityBadges.userId, userId),
			),
		)
		.limit(1);

	if (existingBadge) {
		return {
			allowed: false,
			reason: "Ya tienes un badge para esta campaña",
			campaign,
		};
	}

	const [membership] = await db
		.select()
		.from(communityMembers)
		.where(
			and(
				eq(communityMembers.communityId, campaign.communityId),
				eq(communityMembers.userId, userId),
			),
		)
		.limit(1);

	const [community] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, campaign.communityId))
		.limit(1);

	const isOwner = community?.ownerUserId === userId;
	const isMember = membership && membership.role !== "follower";

	if (!isOwner && !isMember) {
		return {
			allowed: false,
			reason: "Solo los miembros pueden generar badges",
			campaign,
		};
	}

	return { allowed: true, campaign };
}

export async function incrementCampaignBadgeCount(campaignId: string) {
	await db
		.update(badgeCampaigns)
		.set({
			badgesGenerated: sql`${badgeCampaigns.badgesGenerated} + 1`,
			updatedAt: new Date(),
		})
		.where(eq(badgeCampaigns.id, campaignId));
}

export async function getUserBadgesForCommunity(
	communityId: string,
	userId: string,
) {
	return db
		.select({
			badge: communityBadges,
			campaign: badgeCampaigns,
		})
		.from(communityBadges)
		.leftJoin(badgeCampaigns, eq(communityBadges.campaignId, badgeCampaigns.id))
		.where(
			and(
				eq(communityBadges.communityId, communityId),
				eq(communityBadges.userId, userId),
			),
		);
}

export async function getCommunityBadgesByCampaign(
	communityId: string,
	campaignId?: string,
	limit = 50,
) {
	const conditions = [
		eq(communityBadges.communityId, communityId),
		eq(communityBadges.status, "completed"),
	];

	if (campaignId) {
		conditions.push(eq(communityBadges.campaignId, campaignId));
	}

	return db
		.select({
			badge: communityBadges,
			campaign: badgeCampaigns,
		})
		.from(communityBadges)
		.leftJoin(badgeCampaigns, eq(communityBadges.campaignId, badgeCampaigns.id))
		.where(and(...conditions))
		.orderBy(desc(communityBadges.badgeNumber))
		.limit(limit);
}
