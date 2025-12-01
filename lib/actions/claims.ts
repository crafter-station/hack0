"use server";

import { db } from "@/lib/db";
import { organizerClaims, winnerClaims, events } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ============================================
// ADMIN CONFIGURATION
// ============================================

const ADMIN_EMAILS = ["railly@clerk.dev"];

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  const email = user.emailAddresses?.[0]?.emailAddress;
  return email ? ADMIN_EMAILS.includes(email) : false;
}

// ============================================
// WINNER CLAIMS
// ============================================

export interface CreateWinnerClaimInput {
  eventId: string;
  position: number;
  teamName?: string;
  projectName?: string;
  projectUrl?: string;
  proofUrl: string;
  proofDescription?: string;
}

export async function createWinnerClaim(input: CreateWinnerClaimInput) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  if (input.position < 1 || input.position > 3) {
    return { success: false, error: "Solo se permiten posiciones 1, 2 o 3" };
  }

  // Check if user already has a pending claim for this event
  const existingClaim = await db
    .select()
    .from(winnerClaims)
    .where(
      and(
        eq(winnerClaims.eventId, input.eventId),
        eq(winnerClaims.userId, userId)
      )
    )
    .limit(1);

  if (existingClaim.length > 0) {
    return { success: false, error: "Ya tienes una solicitud para este evento" };
  }

  await db.insert(winnerClaims).values({
    eventId: input.eventId,
    userId,
    position: input.position,
    teamName: input.teamName,
    projectName: input.projectName,
    projectUrl: input.projectUrl,
    proofUrl: input.proofUrl,
    proofDescription: input.proofDescription,
  });

  revalidatePath(`/`);
  return { success: true };
}

export async function getUserWinnerClaim(eventId: string) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const claim = await db
    .select()
    .from(winnerClaims)
    .where(
      and(
        eq(winnerClaims.eventId, eventId),
        eq(winnerClaims.userId, userId)
      )
    )
    .limit(1);

  return claim[0] || null;
}

// ============================================
// ORGANIZER CLAIMS
// ============================================

export interface CreateOrganizerClaimInput {
  eventId: string;
  email: string;
  name?: string;
  role?: string;
  proofUrl?: string;
  proofDescription?: string;
}

export async function createOrganizerClaim(input: CreateOrganizerClaimInput) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  // Check if user already has a pending claim for this event
  const existingClaim = await db
    .select()
    .from(organizerClaims)
    .where(
      and(
        eq(organizerClaims.eventId, input.eventId),
        eq(organizerClaims.userId, userId)
      )
    )
    .limit(1);

  if (existingClaim.length > 0) {
    return { success: false, error: "Ya tienes una solicitud para este evento" };
  }

  await db.insert(organizerClaims).values({
    eventId: input.eventId,
    userId,
    email: input.email,
    name: input.name,
    role: input.role,
    proofUrl: input.proofUrl,
    proofDescription: input.proofDescription,
  });

  revalidatePath(`/`);
  return { success: true };
}

export async function getUserOrganizerClaim(eventId: string) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const claim = await db
    .select()
    .from(organizerClaims)
    .where(
      and(
        eq(organizerClaims.eventId, eventId),
        eq(organizerClaims.userId, userId)
      )
    )
    .limit(1);

  return claim[0] || null;
}

// ============================================
// VERIFIED ORGANIZER - Check & Update Event
// ============================================

export async function isVerifiedOrganizer(eventId: string): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const event = await db
    .select({
      isOrganizerVerified: events.isOrganizerVerified,
      verifiedOrganizerId: events.verifiedOrganizerId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (event.length === 0) {
    return false;
  }

  return event[0].isOrganizerVerified === true && event[0].verifiedOrganizerId === userId;
}

export interface UpdateEventInput {
  eventId: string;
  name?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  registrationDeadline?: Date | null;
  format?: "virtual" | "in-person" | "hybrid";
  city?: string;
  timezone?: string;
  prizePool?: number | null;
  prizeDescription?: string;
  websiteUrl?: string;
  registrationUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isJuniorFriendly?: boolean;
}

export async function updateEvent(input: UpdateEventInput) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  // Verify user is the verified organizer
  const isVerified = await isVerifiedOrganizer(input.eventId);

  if (!isVerified) {
    return { success: false, error: "No tienes permiso para editar este evento" };
  }

  const { eventId, ...updateData } = input;

  // Filter out undefined values
  const filteredData = Object.fromEntries(
    Object.entries(updateData).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(filteredData).length === 0) {
    return { success: false, error: "No hay cambios para guardar" };
  }

  await db
    .update(events)
    .set({
      ...filteredData,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  revalidatePath(`/`);
  return { success: true };
}

// ============================================
// ADMIN - Get all claims
// ============================================

export async function getAllOrganizerClaims() {
  const admin = await isAdmin();
  if (!admin) return [];

  const claims = await db
    .select({
      id: organizerClaims.id,
      eventId: organizerClaims.eventId,
      userId: organizerClaims.userId,
      email: organizerClaims.email,
      name: organizerClaims.name,
      role: organizerClaims.role,
      proofUrl: organizerClaims.proofUrl,
      proofDescription: organizerClaims.proofDescription,
      status: organizerClaims.status,
      createdAt: organizerClaims.createdAt,
      eventName: events.name,
      eventSlug: events.slug,
    })
    .from(organizerClaims)
    .leftJoin(events, eq(organizerClaims.eventId, events.id))
    .orderBy(desc(organizerClaims.createdAt));

  return claims;
}

export async function getAllWinnerClaims() {
  const admin = await isAdmin();
  if (!admin) return [];

  const claims = await db
    .select({
      id: winnerClaims.id,
      eventId: winnerClaims.eventId,
      userId: winnerClaims.userId,
      position: winnerClaims.position,
      teamName: winnerClaims.teamName,
      projectName: winnerClaims.projectName,
      projectUrl: winnerClaims.projectUrl,
      proofUrl: winnerClaims.proofUrl,
      proofDescription: winnerClaims.proofDescription,
      status: winnerClaims.status,
      createdAt: winnerClaims.createdAt,
      eventName: events.name,
      eventSlug: events.slug,
    })
    .from(winnerClaims)
    .leftJoin(events, eq(winnerClaims.eventId, events.id))
    .orderBy(desc(winnerClaims.createdAt));

  return claims;
}

// ============================================
// ADMIN - Approve/Reject claims
// ============================================

export async function approveOrganizerClaim(claimId: string) {
  const { userId } = await auth();
  const admin = await isAdmin();

  if (!admin || !userId) {
    return { success: false, error: "No autorizado" };
  }

  // Get the claim
  const claim = await db
    .select()
    .from(organizerClaims)
    .where(eq(organizerClaims.id, claimId))
    .limit(1);

  if (claim.length === 0) {
    return { success: false, error: "Solicitud no encontrada" };
  }

  const { eventId, userId: claimUserId } = claim[0];

  // Update the claim status
  await db
    .update(organizerClaims)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: userId,
    })
    .where(eq(organizerClaims.id, claimId));

  // Update the event to mark organizer as verified
  await db
    .update(events)
    .set({
      isOrganizerVerified: true,
      verifiedOrganizerId: claimUserId,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function rejectOrganizerClaim(claimId: string, reason?: string) {
  const { userId } = await auth();
  const admin = await isAdmin();

  if (!admin || !userId) {
    return { success: false, error: "No autorizado" };
  }

  await db
    .update(organizerClaims)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: userId,
      rejectionReason: reason,
    })
    .where(eq(organizerClaims.id, claimId));

  revalidatePath("/admin");
  return { success: true };
}

export async function approveWinnerClaim(claimId: string) {
  const { userId } = await auth();
  const admin = await isAdmin();

  if (!admin || !userId) {
    return { success: false, error: "No autorizado" };
  }

  await db
    .update(winnerClaims)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: userId,
    })
    .where(eq(winnerClaims.id, claimId));

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectWinnerClaim(claimId: string, reason?: string) {
  const { userId } = await auth();
  const admin = await isAdmin();

  if (!admin || !userId) {
    return { success: false, error: "No autorizado" };
  }

  await db
    .update(winnerClaims)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: userId,
      rejectionReason: reason,
    })
    .where(eq(winnerClaims.id, claimId));

  revalidatePath("/admin");
  return { success: true };
}
