"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { communityMembers, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "./claims";

export async function canManageEventById(eventId: string): Promise<boolean> {
  const admin = await isAdmin();
  if (admin) return true;

  const { userId } = await auth();
  if (!userId) return false;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || !event.organizationId) {
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

export async function canManageEventBySlug(slug: string): Promise<boolean> {
  const admin = await isAdmin();
  if (admin) return true;

  const { userId } = await auth();
  if (!userId) return false;

  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
  });

  if (!event || !event.organizationId) {
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
