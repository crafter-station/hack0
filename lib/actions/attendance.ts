"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendanceClaims, events, users } from "@/lib/db/schema";
import { canManageOrganization } from "./organizations";

export async function claimAttendance(eventId: string): Promise<{
	success: boolean;
	error?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
	});

	if (!event) {
		return { success: false, error: "Evento no encontrado" };
	}

	if (!event.endDate || event.endDate > new Date()) {
		return {
			success: false,
			error: "Solo puedes marcar asistencia a eventos que ya terminaron",
		};
	}

	const existing = await db.query.attendanceClaims.findFirst({
		where: and(
			eq(attendanceClaims.eventId, eventId),
			eq(attendanceClaims.userId, userId),
		),
	});

	if (existing) {
		return { success: false, error: "Ya marcaste asistencia a este evento" };
	}

	await db.insert(attendanceClaims).values({
		eventId,
		userId,
		verification: "self_reported",
	});

	await db
		.update(users)
		.set({
			eventsAttendedCount: sql`${users.eventsAttendedCount} + 1`,
			updatedAt: new Date(),
		})
		.where(eq(users.clerkId, userId));

	return { success: true };
}

export async function removeAttendanceClaim(eventId: string): Promise<{
	success: boolean;
	error?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const existing = await db.query.attendanceClaims.findFirst({
		where: and(
			eq(attendanceClaims.eventId, eventId),
			eq(attendanceClaims.userId, userId),
		),
	});

	if (!existing) {
		return { success: false, error: "No has marcado asistencia a este evento" };
	}

	await db.delete(attendanceClaims).where(eq(attendanceClaims.id, existing.id));

	await db
		.update(users)
		.set({
			eventsAttendedCount: sql`GREATEST(${users.eventsAttendedCount} - 1, 0)`,
			updatedAt: new Date(),
		})
		.where(eq(users.clerkId, userId));

	return { success: true };
}

export async function getUserAttendanceClaim(eventId: string): Promise<{
	hasClaimed: boolean;
	verification: "self_reported" | "organizer_verified" | null;
	claimedAt: Date | null;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { hasClaimed: false, verification: null, claimedAt: null };
	}

	const claim = await db.query.attendanceClaims.findFirst({
		where: and(
			eq(attendanceClaims.eventId, eventId),
			eq(attendanceClaims.userId, userId),
		),
	});

	if (!claim) {
		return { hasClaimed: false, verification: null, claimedAt: null };
	}

	return {
		hasClaimed: true,
		verification: claim.verification,
		claimedAt: claim.claimedAt,
	};
}

export async function getEventAttendees(eventId: string): Promise<{
	attendees: Array<{
		id: string;
		userId: string;
		verification: "self_reported" | "organizer_verified" | null;
		claimedAt: Date | null;
		verifiedAt: Date | null;
	}>;
	total: number;
}> {
	const claims = await db.query.attendanceClaims.findMany({
		where: eq(attendanceClaims.eventId, eventId),
		orderBy: (claims, { desc }) => [desc(claims.claimedAt)],
	});

	return {
		attendees: claims.map((c) => ({
			id: c.id,
			userId: c.userId,
			verification: c.verification,
			claimedAt: c.claimedAt,
			verifiedAt: c.verifiedAt,
		})),
		total: claims.length,
	};
}

export async function verifyAttendance(
	claimId: string,
	eventId: string,
): Promise<{
	success: boolean;
	error?: string;
}> {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
	});

	if (!event) {
		return { success: false, error: "Evento no encontrado" };
	}

	if (!event.organizationId) {
		return { success: false, error: "Este evento no tiene comunidad asociada" };
	}

	const canManage = await canManageOrganization(event.organizationId);

	if (!canManage) {
		return {
			success: false,
			error: "No tienes permisos para verificar asistencias",
		};
	}

	const claim = await db.query.attendanceClaims.findFirst({
		where: and(
			eq(attendanceClaims.id, claimId),
			eq(attendanceClaims.eventId, eventId),
		),
	});

	if (!claim) {
		return { success: false, error: "Asistencia no encontrada" };
	}

	if (claim.verification === "organizer_verified") {
		return { success: false, error: "Esta asistencia ya está verificada" };
	}

	await db
		.update(attendanceClaims)
		.set({
			verification: "organizer_verified",
			verifiedAt: new Date(),
			verifiedBy: userId,
		})
		.where(eq(attendanceClaims.id, claimId));

	return { success: true };
}

export async function getEventAttendanceCount(
	eventId: string,
): Promise<number> {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(attendanceClaims)
		.where(eq(attendanceClaims.eventId, eventId));

	return result[0]?.count ?? 0;
}
