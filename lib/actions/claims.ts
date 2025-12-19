"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { events, organizations, winnerClaims } from "@/lib/db/schema";
import { canManageEventById } from "./permissions";

// ============================================
// ADMIN CONFIGURATION
// ============================================

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "railly@clerk.dev")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

export async function isAdmin(): Promise<boolean> {
	const user = await currentUser();
	if (!user) return false;

	const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
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
				eq(winnerClaims.userId, userId),
			),
		)
		.limit(1);

	if (existingClaim.length > 0) {
		return {
			success: false,
			error: "Ya tienes una solicitud para este evento",
		};
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
			and(eq(winnerClaims.eventId, eventId), eq(winnerClaims.userId, userId)),
		)
		.limit(1);

	return claim[0] || null;
}

// ============================================
// PERMISSIONS - Check & Update Event
// ============================================

// Check if user can edit event (uses new permission system)
export async function canEditEvent(eventId: string): Promise<boolean> {
	return canManageEventById(eventId);
}

export interface UpdateEventInput {
	eventId: string;
	name?: string;
	description?: string;
	startDate?: Date | null;
	endDate?: Date | null;
	registrationDeadline?: Date | null;
	format?: "virtual" | "in-person" | "hybrid";
	department?: string;
	city?: string;
	venue?: string;
	timezone?: string;
	prizePool?: number | null;
	prizeCurrency?: "USD" | "PEN";
	prizeDescription?: string;
	websiteUrl?: string;
	registrationUrl?: string;
	eventImageUrl?: string;
	eventType?: string;
	skillLevel?: string;
	status?: string;
}

export async function updateEvent(input: UpdateEventInput) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	// Verify user can edit (admin or verified organizer)
	const canEdit = await canEditEvent(input.eventId);

	if (!canEdit) {
		return {
			success: false,
			error: "No tienes permiso para editar este evento",
		};
	}

	const { eventId, ...updateData } = input;

	// Filter out undefined values
	const filteredData = Object.fromEntries(
		Object.entries(updateData).filter(([, value]) => value !== undefined),
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
			organizationSlug: organizations.slug,
		})
		.from(winnerClaims)
		.leftJoin(events, eq(winnerClaims.eventId, events.id))
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.orderBy(desc(winnerClaims.createdAt));

	return claims;
}

// ============================================
// ADMIN - Approve/Reject claims
// ============================================

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

// ============================================
// Get claims for a specific event (for manage panel)
// ============================================

export async function getEventWinnerClaims(eventId: string) {
	const claims = await db
		.select()
		.from(winnerClaims)
		.where(eq(winnerClaims.eventId, eventId))
		.orderBy(winnerClaims.position);

	return claims;
}
