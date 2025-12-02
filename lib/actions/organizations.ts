"use server";

import { db } from "@/lib/db";
import { organizations, events, type NewOrganization } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ============================================
// ORGANIZATION QUERIES
// ============================================

/**
 * Get the organization for the current user
 */
export async function getUserOrganization() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.ownerUserId, userId),
  });

  return org;
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

  // Check if user already has an organization
  const existingOrg = await getUserOrganization();
  if (existingOrg) {
    throw new Error("User already has an organization");
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

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return org;
}

/**
 * Update the current user's organization
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

  // If updating slug, check if it's taken
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
    .where(eq(organizations.id, org.id))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return updated;
}

// ============================================
// ORGANIZATION EVENTS
// ============================================

/**
 * Get events for the current user's organization
 */
export async function getOrganizationEvents() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const org = await getUserOrganization();
  if (!org) {
    return [];
  }

  const orgEvents = await db.query.events.findMany({
    where: eq(events.organizationId, org.id),
    orderBy: [desc(events.createdAt)],
  });

  return orgEvents;
}

/**
 * Get stats for the current user's organization
 */
export async function getOrganizationStats() {
  const { userId } = await auth();

  if (!userId) {
    return { totalEvents: 0, activeEvents: 0, endedEvents: 0 };
  }

  const org = await getUserOrganization();
  if (!org) {
    return { totalEvents: 0, activeEvents: 0, endedEvents: 0 };
  }

  const orgEvents = await db.query.events.findMany({
    where: eq(events.organizationId, org.id),
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
