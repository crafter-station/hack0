"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
	communityInvites,
	communityMembers,
	communityRoleRequests,
	organizations,
} from "@/lib/db/schema";

export interface CreateInviteInput {
	communityId: string;
	roleGranted?: "follower" | "member" | "admin";
	maxUses?: number;
	expiresInDays?: number;
}

export async function createCommunityInvite(input: CreateInviteInput) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, input.communityId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		!membership ||
		(membership.role !== "owner" && membership.role !== "admin")
	) {
		return {
			success: false,
			error: "No tienes permiso para crear invitaciones",
		};
	}

	const inviteToken = nanoid(16);
	const expiresAt = input.expiresInDays
		? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
		: null;

	const [invite] = await db
		.insert(communityInvites)
		.values({
			communityId: input.communityId,
			createdBy: userId,
			inviteToken,
			roleGranted: input.roleGranted || "follower",
			maxUses: input.maxUses || null,
			expiresAt,
		})
		.returning();

	revalidatePath(`/manage/communities/${input.communityId}`);

	return { success: true, invite };
}

export async function getCommunityInvites(communityId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, communityId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		!membership ||
		(membership.role !== "owner" && membership.role !== "admin")
	) {
		return { success: false, error: "No tienes permiso" };
	}

	const invites = await db.query.communityInvites.findMany({
		where: eq(communityInvites.communityId, communityId),
	});

	return { success: true, invites };
}

export async function acceptCommunityInvite(inviteToken: string) {
	const { userId } = await auth();
	const user = await currentUser();

	if (!userId || !user) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const invite = await db.query.communityInvites.findFirst({
		where: eq(communityInvites.inviteToken, inviteToken),
		with: {
			community: true,
		},
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	if (!invite.isActive) {
		return { success: false, error: "Esta invitación ya no está activa" };
	}

	if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
		return { success: false, error: "Esta invitación ha expirado" };
	}

	if (invite.maxUses && (invite.usedCount ?? 0) >= invite.maxUses) {
		return {
			success: false,
			error: "Esta invitación ha alcanzado el límite de usos",
		};
	}

	const existingMembership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, invite.communityId),
			eq(communityMembers.userId, userId),
		),
	});

	if (existingMembership) {
		return {
			success: true,
			message: "Ya eres miembro de esta comunidad",
			community: invite.community,
			alreadyMember: true,
		};
	}

	await db.insert(communityMembers).values({
		communityId: invite.communityId,
		userId,
		role: invite.roleGranted,
		invitedBy: invite.createdBy,
	});

	await db
		.update(communityInvites)
		.set({ usedCount: (invite.usedCount ?? 0) + 1 })
		.where(eq(communityInvites.id, invite.id));

	revalidatePath(`/communities/${invite.community.slug}`);

	return {
		success: true,
		message: "Te has unido a la comunidad exitosamente",
		community: invite.community,
		alreadyMember: false,
	};
}

export async function deactivateInvite(inviteId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const invite = await db.query.communityInvites.findFirst({
		where: eq(communityInvites.id, inviteId),
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, invite.communityId),
			eq(communityMembers.userId, userId),
		),
	});

	if (
		!membership ||
		(membership.role !== "owner" && membership.role !== "admin")
	) {
		return { success: false, error: "No tienes permiso" };
	}

	await db
		.update(communityInvites)
		.set({ isActive: false })
		.where(eq(communityInvites.id, inviteId));

	revalidatePath(`/manage/communities/${invite.communityId}`);

	return { success: true };
}

export async function getUserCommunities() {
	const { userId } = await auth();

	if (!userId) {
		return [];
	}

	const memberships = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		with: {
			community: true,
		},
	});

	return memberships;
}

export async function getCommunityBySlug(slug: string) {
	return await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});
}

export async function getUserRoleInCommunity(communityId: string) {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, communityId),
			eq(communityMembers.userId, userId),
		),
	});

	return membership?.role || null;
}

// ============================================
// FOLLOW / UNFOLLOW COMMUNITY
// ============================================

export async function followCommunity(organizationId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	const existing = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (existing) {
		return { success: false, error: "Ya sigues esta comunidad" };
	}

	await db.insert(communityMembers).values({
		communityId: organizationId,
		userId,
		role: "follower",
	});

	revalidatePath(`/c/${org.slug}`);
	revalidatePath("/events");
	return { success: true };
}

export async function unfollowCommunity(organizationId: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (!membership) {
		return { success: false, error: "No sigues esta comunidad" };
	}

	if (membership.role === "owner") {
		return {
			success: false,
			error: "No puedes dejar de seguir tu propia comunidad",
		};
	}

	await db
		.delete(communityMembers)
		.where(eq(communityMembers.id, membership.id));

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	revalidatePath(`/c/${org?.slug}`);
	revalidatePath("/events");
	return { success: true };
}

// ============================================
// REQUEST ROLE UPGRADES
// ============================================

export async function requestMemberUpgrade(
	organizationId: string,
	_message?: string,
) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (!membership) {
		return { success: false, error: "Debes seguir la comunidad primero" };
	}

	if (membership.role !== "follower") {
		return { success: false, error: "Ya eres miembro de esta comunidad" };
	}

	// TODO: Implement approval workflow with notifications
	// For now, auto-approve
	await db
		.update(communityMembers)
		.set({ role: "member" })
		.where(eq(communityMembers.id, membership.id));

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	revalidatePath(`/c/${org?.slug}`);
	return { success: true, message: "Ahora eres miembro de la comunidad" };
}

export async function requestAdminUpgrade(
	organizationId: string,
	message?: string,
) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (!membership) {
		return {
			success: false,
			error: "Debes ser miembro de la comunidad primero",
		};
	}

	if (membership.role !== "member") {
		return {
			success: false,
			error:
				membership.role === "admin" || membership.role === "owner"
					? "Ya eres admin de esta comunidad"
					: "Solo los miembros pueden solicitar ser admin",
		};
	}

	const existingRequest = await db.query.communityRoleRequests.findFirst({
		where: and(
			eq(communityRoleRequests.communityId, organizationId),
			eq(communityRoleRequests.userId, userId),
			eq(communityRoleRequests.status, "pending"),
		),
	});

	if (existingRequest) {
		return {
			success: false,
			error: "Ya tienes una solicitud pendiente para esta comunidad",
		};
	}

	await db.insert(communityRoleRequests).values({
		communityId: organizationId,
		userId,
		requestedRole: "admin",
		message: message || null,
		status: "pending",
	});

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	revalidatePath(`/c/${org?.slug}`);

	return {
		success: true,
		message:
			"Tu solicitud ha sido enviada. El owner de la comunidad la revisará pronto.",
	};
}

// ============================================
// DISCOVER COMMUNITIES (PUBLIC)
// ============================================

export interface PublicCommunityFilters {
	search?: string;
	type?: string;
	types?: string[];
	department?: string;
	countries?: string[];
	sizes?: string[];
	verification?: string[];
	tags?: string[];
	verifiedOnly?: boolean;
	orderBy?: "popular" | "recent" | "name";
}

// Size filter definitions
const SIZE_FILTER_RANGES: Record<string, { min?: number; max?: number }> = {
	small: { max: 100 },
	medium: { min: 100, max: 1000 },
	large: { min: 1000 },
};

export interface PublicCommunity {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	description: string | null;
	type: string | null;
	logoUrl: string | null;
	isVerified: boolean | null;
	memberCount: number;
	isFollowing: boolean;
	email: string | null;
	country: string | null;
	department: string | null;
	websiteUrl: string | null;
	twitterUrl: string | null;
	linkedinUrl: string | null;
	instagramUrl: string | null;
	githubUrl: string | null;
	tags: string[] | null;
}

export async function getPublicCommunities(
	filters: PublicCommunityFilters = {},
): Promise<PublicCommunity[]> {
	const { userId } = await auth();
	const {
		search,
		type,
		types,
		department,
		countries,
		sizes,
		verification,
		tags,
		verifiedOnly,
		orderBy = "popular",
	} = filters;

	const allCommunities = await db.query.organizations.findMany({
		where: and(
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		),
		with: {
			members: {
				columns: { id: true },
			},
		},
	});

	let filtered = allCommunities;

	if (search) {
		const searchLower = search.toLowerCase();
		filtered = filtered.filter(
			(c) =>
				c.name.toLowerCase().includes(searchLower) ||
				c.displayName?.toLowerCase().includes(searchLower) ||
				c.description?.toLowerCase().includes(searchLower),
		);
	}

	// Single type filter (legacy)
	if (type) {
		filtered = filtered.filter((c) => c.type === type);
	}

	// Multiple types filter
	if (types && types.length > 0) {
		filtered = filtered.filter((c) => c.type && types.includes(c.type));
	}

	if (department) {
		filtered = filtered.filter((c) => c.department === department);
	}

	// Countries filter
	if (countries && countries.length > 0) {
		filtered = filtered.filter(
			(c) => c.country && countries.includes(c.country),
		);
	}

	if (verifiedOnly) {
		filtered = filtered.filter((c) => c.isVerified);
	}

	// Verification filter (can be both verified and unverified selected)
	if (verification && verification.length > 0) {
		filtered = filtered.filter((c) => {
			if (
				verification.includes("verified") &&
				verification.includes("unverified")
			) {
				return true; // Both selected, show all
			}
			if (verification.includes("verified")) {
				return c.isVerified === true;
			}
			if (verification.includes("unverified")) {
				return c.isVerified !== true;
			}
			return true;
		});
	}

	// Tags filter (community must have at least one matching tag)
	if (tags && tags.length > 0) {
		filtered = filtered.filter((c) => {
			if (!c.tags || c.tags.length === 0) return false;
			return tags.some((tag) => c.tags?.includes(tag));
		});
	}

	let userMemberships: Set<string> = new Set();
	if (userId) {
		const memberships = await db.query.communityMembers.findMany({
			where: eq(communityMembers.userId, userId),
			columns: { communityId: true },
		});
		userMemberships = new Set(memberships.map((m) => m.communityId));
	}

	let result: PublicCommunity[] = filtered.map((c) => ({
		id: c.id,
		slug: c.slug,
		name: c.name,
		displayName: c.displayName,
		description: c.description,
		type: c.type,
		logoUrl: c.logoUrl,
		isVerified: c.isVerified,
		memberCount: c.members.length,
		isFollowing: userMemberships.has(c.id),
		email: c.email,
		country: c.country,
		department: c.department,
		websiteUrl: c.websiteUrl,
		twitterUrl: c.twitterUrl,
		linkedinUrl: c.linkedinUrl,
		instagramUrl: c.instagramUrl,
		githubUrl: c.githubUrl,
		tags: c.tags,
	}));

	// Size filter (applied after memberCount is calculated)
	if (sizes && sizes.length > 0) {
		result = result.filter((c) => {
			return sizes.some((sizeId) => {
				const range = SIZE_FILTER_RANGES[sizeId];
				if (!range) return false;
				const meetsMin = range.min === undefined || c.memberCount >= range.min;
				const meetsMax = range.max === undefined || c.memberCount < range.max;
				return meetsMin && meetsMax;
			});
		});
	}

	result.sort((a, b) => {
		const aVerified = a.isVerified ? 1 : 0;
		const bVerified = b.isVerified ? 1 : 0;
		if (bVerified !== aVerified) {
			return bVerified - aVerified;
		}

		if (orderBy === "popular") {
			return b.memberCount - a.memberCount;
		}
		if (orderBy === "recent") {
			return b.id.localeCompare(a.id);
		}
		if (orderBy === "name") {
			return a.name.localeCompare(b.name);
		}
		return 0;
	});

	return result;
}

export async function getUniqueDepartments(): Promise<string[]> {
	const orgs = await db.query.organizations.findMany({
		where: and(
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		),
		columns: { department: true },
	});

	const departments = [
		...new Set(orgs.map((o) => o.department).filter(Boolean)),
	] as string[];
	return departments.sort();
}

export async function getUniqueCountries(): Promise<string[]> {
	const orgs = await db.query.organizations.findMany({
		where: and(
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		),
		columns: { country: true },
	});

	const countries = [
		...new Set(orgs.map((o) => o.country).filter(Boolean)),
	] as string[];
	return countries.sort();
}

export async function getUniqueTags(): Promise<string[]> {
	const orgs = await db.query.organizations.findMany({
		where: and(
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		),
		columns: { tags: true },
	});

	const allTags = orgs.flatMap((o) => o.tags || []).filter(Boolean);

	return [...new Set(allTags)].sort();
}

export async function getTagCounts(): Promise<{
	counts: Record<string, number>;
	total: number;
}> {
	const orgs = await db.query.organizations.findMany({
		where: and(
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		),
		columns: { tags: true },
	});

	const counts: Record<string, number> = {};
	for (const org of orgs) {
		for (const tag of org.tags || []) {
			counts[tag] = (counts[tag] || 0) + 1;
		}
	}

	return { counts, total: orgs.length };
}
