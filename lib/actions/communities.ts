"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { communityInvites, communityMembers, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

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
      eq(communityMembers.userId, userId)
    ),
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { success: false, error: "No tienes permiso para crear invitaciones" };
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
      eq(communityMembers.userId, userId)
    ),
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
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

  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    return { success: false, error: "Esta invitación ha alcanzado el límite de usos" };
  }

  const existingMembership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, invite.communityId),
      eq(communityMembers.userId, userId)
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
    .set({ usedCount: invite.usedCount + 1 })
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
      eq(communityMembers.userId, userId)
    ),
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
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
      eq(communityMembers.userId, userId)
    ),
  });

  return membership?.role || null;
}
