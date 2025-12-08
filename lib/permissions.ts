import { db } from "@/lib/db";
import { communityMembers, events, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function canManageEvent(userId: string | null, eventSlug: string): Promise<boolean> {
  if (!userId) return false;

  const event = await db.query.events.findFirst({
    where: eq(events.slug, eventSlug),
    with: {
      organization: true,
    },
  });

  if (!event) return false;

  if (!event.organizationId) {
    return false;
  }

  const membership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, event.organizationId),
      eq(communityMembers.userId, userId)
    ),
  });

  if (!membership) return false;

  return membership.role === "owner" || membership.role === "admin";
}

export async function canManageCommunity(userId: string | null, communitySlug: string): Promise<boolean> {
  if (!userId) return false;

  const community = await db.query.organizations.findFirst({
    where: eq(organizations.slug, communitySlug),
  });

  if (!community) return false;

  const membership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, community.id),
      eq(communityMembers.userId, userId)
    ),
  });

  if (!membership) return false;

  return membership.role === "owner" || membership.role === "admin";
}

export async function getUserCommunityRole(userId: string | null, communityId: string): Promise<string | null> {
  if (!userId) return null;

  const membership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, userId)
    ),
  });

  return membership?.role || null;
}

export async function isUserCommunityMember(userId: string | null, communityId: string): Promise<boolean> {
  if (!userId) return false;

  const membership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, userId)
    ),
  });

  return !!membership;
}

export async function getUserCommunities(userId: string) {
  return await db.query.communityMembers.findMany({
    where: eq(communityMembers.userId, userId),
    with: {
      community: true,
    },
  });
}
