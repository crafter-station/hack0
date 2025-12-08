"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { eventOrganizers, communityMembers, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./claims";

// ============================================
// GET EVENT ORGANIZERS
// ============================================

export async function getEventOrganizers(eventId: string) {
  const organizers = await db
    .select()
    .from(eventOrganizers)
    .where(eq(eventOrganizers.eventId, eventId));

  return organizers;
}

// ============================================
// ADD EVENT ORGANIZER
// ============================================

export async function addEventOrganizer(
  eventId: string,
  userId: string,
  role: "lead" | "organizer" | "volunteer"
) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  // Get event
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || !event.organizationId) {
    return { success: false, error: "Evento no encontrado" };
  }

  // Check permission: must be admin or community owner/admin
  const admin = await isAdmin();
  if (!admin) {
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, event.organizationId),
        eq(communityMembers.userId, currentUserId)
      ),
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return { success: false, error: "No tienes permiso para agregar organizadores" };
    }
  }

  // Verify that the userId is a member of the community
  const targetMembership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, event.organizationId),
      eq(communityMembers.userId, userId)
    ),
  });

  if (!targetMembership) {
    return { success: false, error: "El usuario debe ser miembro de la comunidad primero" };
  }

  // Check if already an organizer
  const existing = await db.query.eventOrganizers.findFirst({
    where: and(
      eq(eventOrganizers.eventId, eventId),
      eq(eventOrganizers.userId, userId)
    ),
  });

  if (existing) {
    return { success: false, error: "Este usuario ya es organizador del evento" };
  }

  // Add organizer
  await db.insert(eventOrganizers).values({
    eventId,
    userId,
    role,
  });

  revalidatePath("/");
  return { success: true };
}

// ============================================
// REMOVE EVENT ORGANIZER
// ============================================

export async function removeEventOrganizer(organizerId: string) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  // Get organizer
  const organizer = await db.query.eventOrganizers.findFirst({
    where: eq(eventOrganizers.id, organizerId),
  });

  if (!organizer) {
    return { success: false, error: "Organizador no encontrado" };
  }

  // Get event
  const event = await db.query.events.findFirst({
    where: eq(events.id, organizer.eventId),
  });

  if (!event || !event.organizationId) {
    return { success: false, error: "Evento no encontrado" };
  }

  // Check permission: must be admin or community owner/admin
  const admin = await isAdmin();
  if (!admin) {
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, event.organizationId),
        eq(communityMembers.userId, currentUserId)
      ),
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return { success: false, error: "No tienes permiso para remover organizadores" };
    }
  }

  // Remove organizer
  await db.delete(eventOrganizers).where(eq(eventOrganizers.id, organizerId));

  revalidatePath("/");
  return { success: true };
}

// ============================================
// UPDATE ORGANIZER ROLE
// ============================================

export async function updateOrganizerRole(
  organizerId: string,
  role: "lead" | "organizer" | "volunteer"
) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  // Get organizer
  const organizer = await db.query.eventOrganizers.findFirst({
    where: eq(eventOrganizers.id, organizerId),
  });

  if (!organizer) {
    return { success: false, error: "Organizador no encontrado" };
  }

  // Get event
  const event = await db.query.events.findFirst({
    where: eq(events.id, organizer.eventId),
  });

  if (!event || !event.organizationId) {
    return { success: false, error: "Evento no encontrado" };
  }

  // Check permission: must be admin or community owner/admin
  const admin = await isAdmin();
  if (!admin) {
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, event.organizationId),
        eq(communityMembers.userId, currentUserId)
      ),
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return { success: false, error: "No tienes permiso para cambiar roles" };
    }
  }

  // Update role
  await db
    .update(eventOrganizers)
    .set({ role })
    .where(eq(eventOrganizers.id, organizerId));

  revalidatePath("/");
  return { success: true };
}
