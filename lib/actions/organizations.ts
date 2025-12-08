"use server";

import { db } from "@/lib/db";
import { organizations, events, communityMembers, type NewOrganization } from "@/lib/db/schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ============================================
// ORGANIZATION QUERIES
// ============================================

/**
 * Get all organizations where the user is owner
 */
export async function getUserOrganizations() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const orgs = await db.query.organizations.findMany({
    where: eq(organizations.ownerUserId, userId),
    orderBy: [desc(organizations.createdAt)],
  });

  return orgs;
}

/**
 * Get the first organization for the current user (backwards compatibility)
 */
export async function getUserOrganization() {
  const orgs = await getUserOrganizations();
  return orgs[0] || null;
}

/**
 * Get all organizations where the user is a member (owner, admin, member, or follower)
 */
export async function getAllUserOrganizations() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const ownedOrgs = await db.query.organizations.findMany({
    where: eq(organizations.ownerUserId, userId),
  });

  const memberOrgs = await db
    .select({
      organization: organizations,
      role: communityMembers.role,
    })
    .from(communityMembers)
    .innerJoin(organizations, eq(communityMembers.communityId, organizations.id))
    .where(eq(communityMembers.userId, userId));

  const allOrgs = [
    ...ownedOrgs.map((org) => ({ organization: org, role: "owner" as const })),
    ...memberOrgs.filter((m) => !ownedOrgs.some((o) => o.id === m.organization.id)),
  ];

  allOrgs.sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2, follower: 3 };
    const aOrder = roleOrder[a.role];
    const bOrder = roleOrder[b.role];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.organization.createdAt).getTime() - new Date(a.organization.createdAt).getTime();
  });

  return allOrgs;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  return org;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });

  return org;
}

/**
 * Search organizations by name or slug
 */
export async function searchOrganizations(query: string, limit = 10) {
  const results = await db
    .select()
    .from(organizations)
    .where(
      or(
        ilike(organizations.name, `%${query}%`),
        ilike(organizations.slug, `%${query}%`)
      )
    )
    .limit(limit);

  return results;
}

// ============================================
// ORGANIZATION MUTATIONS
// ============================================

/**
 * Create a new organization for the current user
 */
export async function createOrganization(
  data: Omit<NewOrganization, "id" | "ownerUserId" | "createdAt" | "updatedAt">
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Check if slug is taken
  const slugTaken = await db.query.organizations.findFirst({
    where: eq(organizations.slug, data.slug),
  });

  if (slugTaken) {
    throw new Error("Slug already taken");
  }

  const [org] = await db
    .insert(organizations)
    .values({
      ...data,
      ownerUserId: userId,
    })
    .returning();

  revalidatePath(`/c/${org.slug}`);
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return org;
}

/**
 * Update a specific organization by ID
 */
export async function updateOrganizationById(
  organizationId: string,
  data: Partial<
    Omit<NewOrganization, "id" | "ownerUserId" | "createdAt" | "updatedAt">
  >
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const canManage = await canManageOrganization(organizationId);
  if (!canManage) {
    throw new Error("Not authorized to update this organization");
  }

  if (data.slug && data.slug !== org.slug) {
    const slugTaken = await db.query.organizations.findFirst({
      where: eq(organizations.slug, data.slug),
    });

    if (slugTaken) {
      throw new Error("Slug already taken");
    }
  }

  const [updated] = await db
    .update(organizations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  revalidatePath(`/c/${org.slug}`);
  revalidatePath(`/c/${org.slug}/settings`);
  revalidatePath(`/dashboard`);
  if (data.slug && data.slug !== org.slug) {
    revalidatePath(`/c/${data.slug}`);
    revalidatePath(`/c/${data.slug}/settings`);
  }

  return updated;
}

/**
 * Update the current user's organization (backwards compatibility)
 */
export async function updateOrganization(
  data: Partial<
    Omit<NewOrganization, "id" | "ownerUserId" | "createdAt" | "updatedAt">
  >
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const org = await getUserOrganization();
  if (!org) {
    throw new Error("Organization not found");
  }

  return updateOrganizationById(org.id, data);
}

// ============================================
// ORGANIZATION EVENTS
// ============================================

/**
 * Get events for an organization
 */
export async function getOrganizationEvents(organizationId?: string) {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  let orgId = organizationId;

  if (!orgId) {
    const org = await getUserOrganization();
    if (!org) {
      return [];
    }
    orgId = org.id;
  }

  const orgEvents = await db.query.events.findMany({
    where: eq(events.organizationId, orgId),
    orderBy: [desc(events.createdAt)],
  });

  return orgEvents;
}

/**
 * Get stats for an organization
 */
export async function getOrganizationStats(organizationId?: string) {
  const { userId } = await auth();

  if (!userId) {
    return { totalEvents: 0, activeEvents: 0, endedEvents: 0 };
  }

  let orgId = organizationId;

  if (!orgId) {
    const org = await getUserOrganization();
    if (!org) {
      return { totalEvents: 0, activeEvents: 0, endedEvents: 0 };
    }
    orgId = org.id;
  }

  const orgEvents = await db.query.events.findMany({
    where: eq(events.organizationId, orgId),
  });

  const now = new Date();
  const activeEvents = orgEvents.filter((e) => {
    if (!e.endDate) return true;
    return new Date(e.endDate) >= now;
  }).length;

  return {
    totalEvents: orgEvents.length,
    activeEvents,
    endedEvents: orgEvents.length - activeEvents,
  };
}

// ============================================
// PERMISSIONS
// ============================================

/**
 * Check if current user can manage a specific organization
 * (either owner or admin member)
 */
export async function canManageOrganization(organizationId: string): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    return false;
  }

  if (org.ownerUserId === userId) {
    return true;
  }

  const membership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, organizationId),
      eq(communityMembers.userId, userId)
    ),
  });

  return membership?.role === "admin";
}

// ============================================
// HELPERS
// ============================================

/**
 * Generate a slug from organization name
 */
export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  return !existing;
}
