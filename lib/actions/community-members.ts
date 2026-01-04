"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
	communityInvites,
	communityMembers,
	organizations,
} from "@/lib/db/schema";
import { EMAIL_FROM, resend } from "@/lib/email/resend";
import { CommunityInviteEmail } from "@/lib/email/templates/community-invite";
import { isAdmin } from "./claims";

// ============================================
// GET COMMUNITY MEMBERS
// ============================================

export async function getCommunityMembers(organizationId: string) {
	const members = await db
		.select()
		.from(communityMembers)
		.where(eq(communityMembers.communityId, organizationId));

	return members;
}

// ============================================
// ADD COMMUNITY MEMBER
// ============================================

export async function addCommunityMember(
	organizationId: string,
	userId: string,
	role: "admin" | "member" | "follower",
) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Check permission: must be admin or community owner/admin
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, organizationId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return {
				success: false,
				error: "No tienes permiso para agregar miembros",
			};
		}
	}

	// Check if already a member
	const existing = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	if (existing) {
		return {
			success: false,
			error: "Este usuario ya es miembro de la comunidad",
		};
	}

	// Add member
	await db.insert(communityMembers).values({
		communityId: organizationId,
		userId,
		role,
		invitedBy: currentUserId,
	});

	revalidatePath("/");
	return { success: true };
}

// ============================================
// REMOVE COMMUNITY MEMBER
// ============================================

export async function removeCommunityMember(memberId: string) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Get member
	const member = await db.query.communityMembers.findFirst({
		where: eq(communityMembers.id, memberId),
	});

	if (!member) {
		return { success: false, error: "Miembro no encontrado" };
	}

	// Cannot remove owner
	if (member.role === "owner") {
		return {
			success: false,
			error: "No puedes remover al owner de la comunidad",
		};
	}

	// Check permission: must be admin or community owner/admin
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, member.communityId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return {
				success: false,
				error: "No tienes permiso para remover miembros",
			};
		}
	}

	// Remove member
	await db.delete(communityMembers).where(eq(communityMembers.id, memberId));

	revalidatePath("/");
	return { success: true };
}

// ============================================
// UPDATE MEMBER ROLE
// ============================================

export async function updateMemberRole(
	memberId: string,
	newRole: "admin" | "member" | "follower",
) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Get member
	const member = await db.query.communityMembers.findFirst({
		where: eq(communityMembers.id, memberId),
	});

	if (!member) {
		return { success: false, error: "Miembro no encontrado" };
	}

	// Cannot change owner role
	if (member.role === "owner") {
		return { success: false, error: "No puedes cambiar el rol del owner" };
	}

	// Check permission: must be admin or community owner
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, member.communityId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (!membership || membership.role !== "owner") {
			return { success: false, error: "Solo el owner puede cambiar roles" };
		}
	}

	// Update role
	await db
		.update(communityMembers)
		.set({ role: newRole })
		.where(eq(communityMembers.id, memberId));

	revalidatePath("/");
	return { success: true };
}

// ============================================
// CREATE INVITE
// ============================================

export async function createCommunityInvite(
	organizationId: string,
	roleGranted: "admin" | "member" | "follower",
	options?: {
		maxUses?: number;
		expiresAt?: Date;
	},
) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Check permission: must be admin or community owner/admin
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, organizationId),
				eq(communityMembers.userId, currentUserId),
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
	}

	// Generate unique token
	const inviteToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

	// Create invite
	const [invite] = await db
		.insert(communityInvites)
		.values({
			communityId: organizationId,
			createdBy: currentUserId,
			inviteToken,
			roleGranted,
			maxUses: options?.maxUses || null,
			expiresAt: options?.expiresAt || null,
		})
		.returning();

	revalidatePath("/");
	return { success: true, invite };
}

// ============================================
// GET ORGANIZATION INVITES
// ============================================

export async function getOrganizationInvites(organizationId: string) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return [];
	}

	// Check permission
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, organizationId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return [];
		}
	}

	const invites = await db
		.select()
		.from(communityInvites)
		.where(eq(communityInvites.communityId, organizationId));

	return invites;
}

// ============================================
// VALIDATE INVITE
// ============================================

export async function validateInviteToken(token: string) {
	const invite = await db.query.communityInvites.findFirst({
		where: eq(communityInvites.inviteToken, token),
		with: {
			community: true,
		},
	});

	if (!invite) {
		return { valid: false, error: "Invitación no encontrada" };
	}

	if (!invite.isActive) {
		return { valid: false, error: "Esta invitación ha sido revocada" };
	}

	if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
		return { valid: false, error: "Esta invitación ha expirado" };
	}

	if (invite.maxUses && (invite.usedCount ?? 0) >= invite.maxUses) {
		return {
			valid: false,
			error: "Esta invitación ha alcanzado el límite de usos",
		};
	}

	return { valid: true, invite };
}

// ============================================
// ACCEPT INVITE
// ============================================

export async function acceptInvite(token: string) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const validation = await validateInviteToken(token);

	if (!validation.valid || !validation.invite) {
		return { success: false, error: validation.error };
	}

	const { invite } = validation;

	// Check if already a member
	const existing = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, invite.communityId),
			eq(communityMembers.userId, userId),
		),
	});

	const roleHierarchy: Record<string, number> = {
		follower: 0,
		member: 1,
		admin: 2,
		owner: 3,
	};

	if (existing) {
		const existingRoleLevel = roleHierarchy[existing.role ?? "follower"] || 0;
		const inviteRoleLevel =
			roleHierarchy[invite.roleGranted ?? "follower"] || 0;

		if (inviteRoleLevel > existingRoleLevel) {
			await db
				.update(communityMembers)
				.set({ role: invite.roleGranted })
				.where(eq(communityMembers.id, existing.id));

			await db
				.update(communityInvites)
				.set({ usedCount: (invite.usedCount ?? 0) + 1 })
				.where(eq(communityInvites.id, invite.id));

			revalidatePath("/");
			return { success: true, community: invite.community };
		}

		return {
			success: false,
			error: "Ya eres miembro de esta comunidad con un rol igual o superior",
		};
	}

	// Add member
	await db.insert(communityMembers).values({
		communityId: invite.communityId,
		userId,
		role: invite.roleGranted,
		invitedBy: invite.createdBy,
	});

	// Increment used count
	await db
		.update(communityInvites)
		.set({ usedCount: (invite.usedCount ?? 0) + 1 })
		.where(eq(communityInvites.id, invite.id));

	revalidatePath("/");
	return { success: true, community: invite.community };
}

// ============================================
// REVOKE INVITE
// ============================================

export async function revokeInvite(inviteId: string) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Get invite
	const invite = await db.query.communityInvites.findFirst({
		where: eq(communityInvites.id, inviteId),
	});

	if (!invite) {
		return { success: false, error: "Invitación no encontrada" };
	}

	// Check permission
	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, invite.communityId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return {
				success: false,
				error: "No tienes permiso para revocar invitaciones",
			};
		}
	}

	// Revoke invite
	await db
		.update(communityInvites)
		.set({ isActive: false })
		.where(eq(communityInvites.id, inviteId));

	revalidatePath("/");
	return { success: true };
}

export async function getUserCommunityRole(organizationId: string) {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return null;
	}

	if (org.ownerUserId === userId) {
		return "owner";
	}

	const membership = await db.query.communityMembers.findFirst({
		where: and(
			eq(communityMembers.communityId, organizationId),
			eq(communityMembers.userId, userId),
		),
	});

	return membership?.role || null;
}

// ============================================
// GET COMMUNITY MEMBERS WITH CLERK INFO
// ============================================

export async function getCommunityMembersWithClerkInfo(organizationId: string) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return [];
	}

	const members = await db
		.select()
		.from(communityMembers)
		.where(eq(communityMembers.communityId, organizationId));

	const { clerkClient } = await import("@clerk/nextjs/server");
	const clerk = await clerkClient();

	const membersWithInfo = await Promise.all(
		members.map(async (member) => {
			try {
				const user = await clerk.users.getUser(member.userId);
				const name =
					user.fullName ||
					user.username ||
					user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
					"Usuario";
				const email = user.emailAddresses[0]?.emailAddress || null;

				return {
					...member,
					name,
					email,
					imageUrl: user.imageUrl,
				};
			} catch (error) {
				console.error(`Error fetching user ${member.userId}:`, error);
				return {
					...member,
					name: "Usuario sin nombre",
					email: null,
					imageUrl: null,
				};
			}
		}),
	);

	return membersWithInfo.filter((m) => m.name !== "Usuario sin nombre");
}

// ============================================
// SEND EMAIL INVITE
// ============================================

export async function sendEmailInvite(
	organizationId: string,
	emails: string[],
	roleGranted: "admin" | "member" | "follower",
) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, organizationId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return {
				success: false,
				error: "No tienes permiso para enviar invitaciones",
			};
		}
	}

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		return { success: false, error: "Comunidad no encontrada" };
	}

	const clerk = await clerkClient();
	const currentUser = await clerk.users.getUser(currentUserId);
	const inviterName =
		currentUser.fullName ||
		currentUser.username ||
		currentUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
		"Un administrador";

	const results: { email: string; success: boolean; error?: string }[] = [];

	for (const email of emails) {
		const normalizedEmail = email.toLowerCase().trim();

		const existingInvite = await db.query.communityInvites.findFirst({
			where: and(
				eq(communityInvites.communityId, organizationId),
				eq(communityInvites.email, normalizedEmail),
				eq(communityInvites.isActive, true),
			),
		});

		if (existingInvite) {
			results.push({
				email: normalizedEmail,
				success: false,
				error: "Ya existe una invitación activa para este email",
			});
			continue;
		}

		const inviteToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

		await db.insert(communityInvites).values({
			communityId: organizationId,
			createdBy: currentUserId,
			inviteToken,
			inviteType: "email",
			email: normalizedEmail,
			roleGranted,
			maxUses: 1,
		});

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hack0.dev";
		const acceptUrl = `${baseUrl}/invite/${inviteToken}`;

		try {
			await resend.emails.send({
				from: EMAIL_FROM,
				to: normalizedEmail,
				subject: `${inviterName} te invitó a unirte a ${org.displayName || org.name}`,
				react: CommunityInviteEmail({
					inviterName,
					communityName: org.displayName || org.name,
					communityLogoUrl: org.logoUrl,
					roleGranted,
					acceptUrl,
					recipientEmail: normalizedEmail,
				}),
			});

			results.push({ email: normalizedEmail, success: true });
		} catch (error) {
			console.error(`Error sending invite to ${normalizedEmail}:`, error);
			results.push({
				email: normalizedEmail,
				success: false,
				error: "Error al enviar email",
			});
		}
	}

	revalidatePath("/");
	return { success: true, results };
}

// ============================================
// BULK REMOVE MEMBERS
// ============================================

export async function bulkRemoveMembers(memberIds: string[]) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	if (memberIds.length === 0) {
		return { success: false, error: "No hay miembros seleccionados" };
	}

	const members = await db
		.select()
		.from(communityMembers)
		.where(inArray(communityMembers.id, memberIds));

	if (members.length === 0) {
		return { success: false, error: "Miembros no encontrados" };
	}

	const communityId = members[0].communityId;

	const hasOwner = members.some((m) => m.role === "owner");
	if (hasOwner) {
		return {
			success: false,
			error: "No puedes remover al owner de la comunidad",
		};
	}

	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (
			!membership ||
			(membership.role !== "owner" && membership.role !== "admin")
		) {
			return {
				success: false,
				error: "No tienes permiso para remover miembros",
			};
		}
	}

	await db
		.delete(communityMembers)
		.where(inArray(communityMembers.id, memberIds));

	revalidatePath("/");
	return { success: true, removedCount: members.length };
}

// ============================================
// BULK UPDATE MEMBER ROLES
// ============================================

export async function bulkUpdateMemberRoles(
	memberIds: string[],
	newRole: "admin" | "member" | "follower",
) {
	const { userId: currentUserId } = await auth();

	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	if (memberIds.length === 0) {
		return { success: false, error: "No hay miembros seleccionados" };
	}

	const members = await db
		.select()
		.from(communityMembers)
		.where(inArray(communityMembers.id, memberIds));

	if (members.length === 0) {
		return { success: false, error: "Miembros no encontrados" };
	}

	const communityId = members[0].communityId;

	const hasOwner = members.some((m) => m.role === "owner");
	if (hasOwner) {
		return {
			success: false,
			error: "No puedes cambiar el rol del owner",
		};
	}

	const admin = await isAdmin();
	if (!admin) {
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, communityId),
				eq(communityMembers.userId, currentUserId),
			),
		});

		if (!membership || membership.role !== "owner") {
			return { success: false, error: "Solo el owner puede cambiar roles" };
		}
	}

	await db
		.update(communityMembers)
		.set({ role: newRole })
		.where(inArray(communityMembers.id, memberIds));

	revalidatePath("/");
	return { success: true, updatedCount: members.length };
}
