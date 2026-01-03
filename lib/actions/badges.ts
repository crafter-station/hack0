"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	communityBadges,
	communityMembers,
	organizations,
} from "@/lib/db/schema";

export async function getUserBadgeForCommunity(
	communityId: string,
	userId: string,
) {
	const [badge] = await db
		.select()
		.from(communityBadges)
		.where(
			and(
				eq(communityBadges.communityId, communityId),
				eq(communityBadges.userId, userId),
			),
		)
		.limit(1);

	return badge || null;
}

export async function getCommunityBadges(communitySlug: string, limit = 50) {
	const [community] = await db
		.select({ id: organizations.id })
		.from(organizations)
		.where(eq(organizations.slug, communitySlug))
		.limit(1);

	if (!community) return [];

	return db
		.select()
		.from(communityBadges)
		.where(
			and(
				eq(communityBadges.communityId, community.id),
				eq(communityBadges.status, "completed"),
			),
		)
		.orderBy(desc(communityBadges.badgeNumber))
		.limit(limit);
}

export async function getBadgeByToken(token: string) {
	const [badge] = await db
		.select({
			badge: communityBadges,
			community: {
				id: organizations.id,
				slug: organizations.slug,
				name: organizations.name,
				displayName: organizations.displayName,
				logoUrl: organizations.logoUrl,
				badgePrimaryColor: organizations.badgePrimaryColor,
				badgeSecondaryColor: organizations.badgeSecondaryColor,
			},
		})
		.from(communityBadges)
		.innerJoin(organizations, eq(communityBadges.communityId, organizations.id))
		.where(eq(communityBadges.shareToken, token))
		.limit(1);

	return badge || null;
}

export async function canGenerateBadge(
	communityId: string,
	userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
	const [community] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, communityId))
		.limit(1);

	if (!community) {
		return { allowed: false, reason: "Comunidad no encontrada" };
	}

	if (!community.badgeEnabled) {
		return {
			allowed: false,
			reason: "Los badges no están habilitados para esta comunidad",
		};
	}

	const [membership] = await db
		.select()
		.from(communityMembers)
		.where(
			and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, userId),
			),
		)
		.limit(1);

	if (!membership) {
		return { allowed: false, reason: "Debes ser miembro de la comunidad" };
	}

	if (membership.role === "follower") {
		return {
			allowed: false,
			reason: "Los seguidores no pueden generar badges. Solicita ser miembro.",
		};
	}

	const existingBadge = await getUserBadgeForCommunity(communityId, userId);
	if (existingBadge) {
		return { allowed: false, reason: "Ya tienes un badge para esta comunidad" };
	}

	return { allowed: true };
}

export async function getNextBadgeNumber(communityId: string): Promise<number> {
	const result = await db
		.select({ maxNum: sql<number>`COALESCE(MAX(badge_number), 0)` })
		.from(communityBadges)
		.where(eq(communityBadges.communityId, communityId));

	return (result[0]?.maxNum || 0) + 1;
}

export async function getCommunityBadgeSettings(communitySlug: string) {
	const [community] = await db
		.select({
			id: organizations.id,
			slug: organizations.slug,
			name: organizations.name,
			displayName: organizations.displayName,
			logoUrl: organizations.logoUrl,
			badgeEnabled: organizations.badgeEnabled,
			badgeStylePrompt: organizations.badgeStylePrompt,
			badgeBackgroundPrompt: organizations.badgeBackgroundPrompt,
			badgePrimaryColor: organizations.badgePrimaryColor,
			badgeSecondaryColor: organizations.badgeSecondaryColor,
			badgeLogoPosition: organizations.badgeLogoPosition,
			badgeAiStyle: organizations.badgeAiStyle,
			badgeCustomTestPortraitUrl: organizations.badgeCustomTestPortraitUrl,
			badgeCustomTestBackgroundUrl: organizations.badgeCustomTestBackgroundUrl,
			badgeCustomTestReferenceUrl: organizations.badgeCustomTestReferenceUrl,
		})
		.from(organizations)
		.where(eq(organizations.slug, communitySlug))
		.limit(1);

	return community || null;
}

export async function updateCommunityBadgeSettings(
	communityId: string,
	settings: {
		badgeEnabled?: boolean;
		badgeStylePrompt?: string | null;
		badgeBackgroundPrompt?: string | null;
		badgePrimaryColor?: string | null;
		badgeSecondaryColor?: string | null;
		badgeLogoPosition?: string | null;
		badgeAiStyle?: string | null;
	},
) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("No autorizado");
	}

	const [membership] = await db
		.select()
		.from(communityMembers)
		.where(
			and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, userId),
			),
		)
		.limit(1);

	if (
		!membership ||
		(membership.role !== "owner" && membership.role !== "admin")
	) {
		throw new Error("Solo admins pueden modificar la configuración de badges");
	}

	await db
		.update(organizations)
		.set({
			...settings,
			updatedAt: new Date(),
		})
		.where(eq(organizations.id, communityId));

	return { success: true };
}

export async function getUserMembershipRole(
	communityId: string,
	userId: string,
) {
	const [membership] = await db
		.select({ role: communityMembers.role })
		.from(communityMembers)
		.where(
			and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, userId),
			),
		)
		.limit(1);

	return membership?.role || null;
}

export async function testCustomBadgeStyle(
	communityId: string,
	portraitPrompt: string,
	backgroundPrompt: string,
	testImageUrl?: string,
): Promise<{ success: boolean; runId?: string; error?: string }> {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autorizado" };
	}

	const [membership] = await db
		.select()
		.from(communityMembers)
		.where(
			and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, userId),
			),
		)
		.limit(1);

	if (
		!membership ||
		(membership.role !== "owner" && membership.role !== "admin")
	) {
		return {
			success: false,
			error: "Solo admins pueden probar estilos personalizados",
		};
	}

	await db
		.update(organizations)
		.set({
			badgeStylePrompt: portraitPrompt,
			badgeBackgroundPrompt: backgroundPrompt,
			badgeAiStyle: "custom",
			badgeCustomTestReferenceUrl: testImageUrl || null,
			updatedAt: new Date(),
		})
		.where(eq(organizations.id, communityId));

	const { tasks } = await import("@trigger.dev/sdk/v3");
	const handle = await tasks.trigger("test-custom-badge-style", {
		communityId,
		portraitPrompt,
		backgroundPrompt,
		testImageUrl,
	});

	return { success: true, runId: handle.id };
}

export async function clearCustomTestReferenceImage(communityId: string) {
	const { userId } = await auth();
	if (!userId) {
		return { success: false };
	}

	await db
		.update(organizations)
		.set({
			badgeCustomTestReferenceUrl: null,
			updatedAt: new Date(),
		})
		.where(eq(organizations.id, communityId));

	return { success: true };
}

export async function getCustomStyleTestStatus(communityId: string) {
	const [community] = await db
		.select({
			badgeCustomTestPortraitUrl: organizations.badgeCustomTestPortraitUrl,
			badgeCustomTestBackgroundUrl: organizations.badgeCustomTestBackgroundUrl,
		})
		.from(organizations)
		.where(eq(organizations.id, communityId))
		.limit(1);

	return community || null;
}
